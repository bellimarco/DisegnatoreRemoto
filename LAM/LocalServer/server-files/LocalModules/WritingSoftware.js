//REFERENCE: looking from above,
//xy=0 -> top-left corner, paper is horizontal
//x+ -> right   y+ -> down
//pivotxy to the far right
//AngleScrew to the left, the motor left-down
//r+ -> right    a+ -> anticlockwise
//rstep+ -> right    astep+ -> down
//rstep = 0, astep = 0 -> x = 297/2, y = 210/2
//arduino: digitalwrite(HIGH)->clockwise->radial
//arduino is set to def ault dx>0->digitalwrite(LOW)->anti-radial
//  both steppers are LOW->both positive at right-down section
//stepper drivers->2b-black, 1b-green, 1a-red, 2a-blu

const PV=require("./PathVariance");
const SF=require("./ShapeFill");
const OP = require("./OptimalPath");

module.exports = {
  StepsPerRev: 400,
  rStepsPerMM: 200,
  aStepsPerMM: 200,
  PivotX: 297 + 380,//the x,y of the pivot point with respect to the canvas
  PivotY: 210 / 2,
  PivotToAngleScrew: 687+25,//distance from the pivot, to the AngleScrew
  rOrigin: 528.5,
  CartToRSteps: function(x,y){
    let r=Math.sqrt(Math.pow(this.PivotX - x, 2) + Math.pow(y - this.PivotY, 2));
    return Math.round((this.rOrigin-r) * this.rStepsPerMM);
  },
  CartToASteps: function(x,y){
    let xtopivot=this.PivotX-x;//always positive
    let ytopivot=y-this.PivotY;//decides the sign of ASteps
    //using similar triangles formulas
    return Math.round(ytopivot/xtopivot*this.PivotToAngleScrew * this.aStepsPerMM);
  },

  ServoToggleDelay: 1500, //time it takes for the pen to descend/ascend
  MaxSpeedR: 1300, //steps/sec
  MaxSpeedA: 1300, //microstepping level on stepper driver
  microstepA: 8,
  microstepR: 8,

  //if the robot has a pen, ignore press value and simply descend with ServoMid value
  //if the robot has a pencil, use press value to descned with ServoMin/ServoMax values
  PenMode:true,
  //if test mode active, descend with value press*17
  ServoTestMode:false,
  //servopin 0-255 analog values
  ServoMid: 6,
  ServoMin: 2, //maximum pressure
  ServoMax: 12, //0 pressure, just touching
  ServoUp: 0, //ascended position

  AutoReorder: true, //if the WS should automatically reorder the phrase at setup
  OPRevertShape: true,//if the shapes should be reverted during reordeding

  //wether to update the speeds of the motors to the Variance of the ideal speeds
  IncludeSpeedVariance: false,
  IdealVarK: 0.018,//multiplier for the impact of the variance on speed change

  //activate FastMode on the arduino
  FastMode:false,

  //data calculated in setup, resetted in reset()
  //every point specific array is in the form [letter][filler][point]
  //for non shape letters, simply use [letter][0][point]
  Phrase: {
    Name: "",
    Dim:[],//.length->letters, [letter].length->fillers, [letter][filler]->points
    Reorder:[],//how has the phrase been reordered, dictionary array
    Shape:[],//the shape property of every letter
    Press: [],//the press property of every letter, 0-1 value
    Cart: {
      //cartesian coordinates
      X: [],
      Y: []
    },
    Tlett: [],//duration of letters
    Ttot: 0, //the total ideal time needed for the entire phrase
    Var:[],//the variance of each point
    VarTlett: [],//the time that the variance adds to a LetterT
    VarTtot: 0,//the time that the variance adds to the total phrase time
  },
  //calculate speed of a target based on dx,dy,maxspeedx,maxspeedy
  CalcSpeeds: function(ax,ay,bx,by,maxspeedR,maxspeedA){
    let data={
      CartSpeed: {
        X:0,
        Y:0,
      },
      StepSpeed: {
        R:0,
        A:0,
      },
      Stepdt:{
        R:100000,
        A:100000,
      },
      T: 0,
    };
    //find delta step coordinates
    let aR=this.CartToRSteps(ax,ay); let aA=this.CartToASteps(ax,ay);
    let bR=this.CartToRSteps(bx,by); let bA=this.CartToASteps(bx,by);
    let dR=bR-aR; let dA=bA-aA;
    let dX=bx-ax; let dY=by-ay;

    if(dR!=0 && dA!=0){
      if (Math.abs(dR) / maxspeedR > Math.abs(dA) / maxspeedA) {
        data.StepSpeed.R = maxspeedR * Math.sign(dR);
        data.T = Math.abs(dR) / maxspeedR;
        data.StepSpeed.A = dA / data.T;
      } else {
        data.StepSpeed.A = maxspeedA * Math.sign(dA);
        data.T = Math.abs(dA) / maxspeedA;
        data.StepSpeed.R = dR / data.T;
      }
      data.CartSpeed.X = dX/data.T;
      data.CartSpeed.Y = dY/data.T;
      //1000000->1sec/1microsec   *2->double toggle for one step
      data.Stepdt.R = 1000000 / (Math.abs(data.StepSpeed.R) * 2 * this.microstepR);
      data.Stepdt.A = 1000000 / (Math.abs(data.StepSpeed.A) * 2 * this.microstepA);
    }else if(dR==0 && dA!=0){
      data.StepSpeed.A=maxspeedA;
      data.T=Math.abs(dA)/maxspeedA;
      data.StepSpeed.R=0;
      data.CartSpeed.X = dX/data.T;
      data.CartSpeed.Y = dY/data.T;
      data.Stepdt.R = 100000;
      data.Stepdt.A = 1000000 / (Math.abs(data.StepSpeed.A) * 2 * this.microstepA);
    }else if(dR!=0 && dA==0){
      data.StepSpeed.R=maxspeedR;
      data.T=Math.abs(dR)/maxspeedR;
      data.StepSpeed.A=0;
      data.CartSpeed.X = dX/data.T;
      data.CartSpeed.Y = dY/data.T;
      data.Stepdt.A = 100000;
      data.Stepdt.R = 1000000 / (Math.abs(data.StepSpeed.R) * 2 * this.microstepR);
    }

    return data;
  },


  //define here the requests that will be made to the WS
  SetupHttpRequests: function(app){
    //receiveing new value
    app.get("/WSIsPrinting/:val",(req,res)=>{
      if(parseInt(req.params.val)==1){
        if(this.TargetQueue.length>0){
          this.IsPrinting=true;
          console.log("clnt/set IsPrinting: true");
          res.send("WS/received IsPrinting: true");
        }
        else{
          console.log("clnt/set IsPrinting: true, but targetqueue is empty");
          res.send("WS/received IsPrinting: true, but targetqueue is empty");
        }
      }
      else if(parseInt(req.params.val)==0){
        this.IsPrinting=false;
        console.log("clnt/set ISPRINTING: FALSE");
        res.send("WS/received IsPrinting: false");
      }
    });
    app.get("/WSToggleVariance/:n",(req,res)=>{
      this.IncludeSpeedVariance=Boolean(parseInt(req.params.n));
      console.log("clnt/set IncludeVariance to: "+this.IncludeSpeedVariance);
      res.send("WS/toggle IncludeVariance to: "+this.IncludeSpeedVariance);
    });
    app.get("/WSToggleFastMode/:n",(req,res)=>{
      this.FastMode=Boolean(parseInt(req.params.n));
      console.log("clnt/set FastMode to: "+this.FastMode);
      res.send("WS/toggled fastmode: "+this.FastMode);
    });
    app.get("/WSTogglePenMode/:n",(req,res)=>{
      this.PenMode=Boolean(parseInt(req.params.n));
      console.log("clnt/set PenMode to: "+this.PenMode);
      res.send("WS/toggled penmode: "+this.PenMode);
    });
    //receiving signal to execute a WS comand on the targetqueue
    app.get("/WSPushPhrase",(req,res)=>{
      console.log("\nWS/------PUSH PHRASE------");
      this.ClearTargetQueue();
      this.PushPhrase();
      res.send("WS/pushed phrase");
    });
    app.get("/WSPushLetter/:i",(req,res)=>{
      console.log("\nWS/------PUSH LETTER------");
      this.ClearTargetQueue();
      this.PushLetter(this.Phrase.Reorder.indexOf(parseInt(req.params.i)));
      this.PushAscend();
      res.send("WS/pushed letter: "+req.params.i);
    });
    app.get("/WSPushHome",(req,res)=>{
      console.log("\nWS/------PUSH HOME------");
      this.ClearTargetQueue();
      this.PushHome();
      res.send("WS/pushed home");
    });
    app.get("/WSPushManual/:x/:y",(req,res)=>{
      let x=parseFloat(req.params.x);
      let y=parseFloat(req.params.y);
      this.ClearTargetQueue();
      console.log("WS/push manual: "+x+","+y);
      this.PushTarget(x,y,true,1,-1,-1,-1,2);
      res.send("WS/pushed manual: "+x+","+y);
    });
    app.get("/WSSetCoords/:x/:y",(req,res)=>{
      console.log("\nWS/------Reset Coordinates------");
      let x=parseFloat(req.params.x)+297/2;
      let y=parseFloat(req.params.y)+210/2;
      this.SetCoords(x,y);
      this.ClearTargetQueue();
      res.send("WS/setted coords");
    });
    app.get("/WSClear&Ascend",(req,res)=>{
      console.log("\nWS/------PUSH CLEAR&ASCEND------");
      this.ClearTargetQueue();
      res.send("WS/cleared and ascended");
    });
    app.get("/WSPenAscend", (req,res)=>{
      this.PushAscend();
      res.send("WS/pen ascended");
    });
    app.get("/WSPenDescend/:press", (req,res)=>{
      this.PushDescend(parseFloat(req.params.press)/100);
      this.ServoTestMode=true;
      res.send("WS/pen descended, press: "+parseFloat(req.params.press).toFixed(2));
    });

  },

  //initialize all the data of the WS
  Reset: function(){
    this.Phrase.Name= "";
    this.Phrase.Dim=[];
    this.Phrase.Reorder=[];
    this.Phrase.Shape=[];
    this.Phrase.Press = [];
    this.Phrase.Col=[];
    this.Phrase.Cart.X = [];
    this.Phrase.Cart.Y = [];
    this.Phrase.Tlett = [];
    this.Phrase.Ttot=0;
    this.Phrase.Var=[];
    this.Phrase.VarTlett=[];
    this.Phrase.VarTtot=0;
  },
  //set the Phrase array objects
  Setup: function(phrase) {
    console.log("-------WS Setup-------");
    this.Reset();

    //first setup, create the Press,Cart objects
    this.Phrase.Name = phrase.name;
    for (let i = 0; i < phrase.X.length; i++) {
      this.Phrase.Reorder[i]=i;
      this.Phrase.Shape[i]=phrase.shape[i];
      this.Phrase.Press[i]=phrase.press[i];
      this.Phrase.Dim[i]=[];
      this.Phrase.Cart.X[i] = [];
      this.Phrase.Cart.Y[i] = [];
      if(!this.Phrase.Shape[i]){
        this.Phrase.Dim[i][0]=phrase.X[i].length;
        this.Phrase.Cart.X[i][0]=[];
        this.Phrase.Cart.Y[i][0]=[];
        for (let j = 0; j < phrase.X[i].length; j++) {
          //copy phrase
          this.Phrase.Cart.X[i][0][j] = phrase.X[i][j];
          this.Phrase.Cart.Y[i][0][j] = phrase.Y[i][j];
        }
      }else{
        //fill the shape and copy the fillers
        let filler=SF.Fill({
          X:phrase.X[i],
          Y:phrase.Y[i],
          holes: phrase.holes[i],
        });
        for(let j=0; j<filler.length; j++){
          if(filler[j].X.length>2){
            this.Phrase.Dim[i].push(filler[j].X.length);
            this.Phrase.Cart.X[i][this.Phrase.Dim[i].length-1]=[];
            this.Phrase.Cart.Y[i][this.Phrase.Dim[i].length-1]=[];
            for(let k=0; k<filler[j].X.length; k++){
              this.Phrase.Cart.X[i][this.Phrase.Dim[i].length-1][k]=filler[j].X[k];
              this.Phrase.Cart.Y[i][this.Phrase.Dim[i].length-1][k]=filler[j].Y[k];
            }
          }
        }
        if(this.Phrase.Dim[i].length==0){
          this.Phrase.Dim[i][0]=phrase.X[i].length;
          this.Phrase.Cart.X[i][0]=[];
          this.Phrase.Cart.Y[i][0]=[];
          for(let j=0; j<phrase.X[i].length; j++){
            this.Phrase.Cart.X[i][0][j]=phrase.X[i][j];
            this.Phrase.Cart.Y[i][0][j]=phrase.Y[i][j];
          }
        }
      }
    }

    //just a visual clue for the console
    for(let i=0; i<this.Phrase.Dim.length; i++){
      if(this.Phrase.Shape[i]){this.Phrase.Dim[i].unshift("shape");}
      else{this.Phrase.Dim[i].unshift("line");}
    }
    console.log("WS/phrase dim: ");
    console.log(this.Phrase.Dim);
    for(let i=0; i<this.Phrase.Dim.length; i++){
      this.Phrase.Dim[i].shift();
    }//reset the phraseDim array

    //reorder the phrase using cartesian coordinates
    if(this.AutoReorder && this.Phrase.Dim.length>1){
      //create path through every letter
      let path=[];
      for(let i=0; i<this.Phrase.Dim.length; i++){
        path.push({
          startX:this.Phrase.Cart.X[i][0][0],
          startY:this.Phrase.Cart.Y[i][0][0],
          endX:this.Phrase.Cart.X[i][this.Phrase.Dim[i].length-1][this.Phrase.Dim[i][this.Phrase.Dim[i].length-1]-1],
          endY:this.Phrase.Cart.Y[i][this.Phrase.Dim[i].length-1][this.Phrase.Dim[i][this.Phrase.Dim[i].length-1]-1],
        });
      }
      //find the best order
      OP.Setup(path);
      OP.Generate();
      let best=OP.Best();
      let ordered={X:[],Y:[],Dim:[],Press:[],Shape:[]};
      //create the ordered phrase
      for(let i=0; i<best.length; i++){
        let I=best[i];
        if(I>=best.length){
          I=best[i]-best.length;
          this.Phrase.Reorder[i]=I;
          if(this.OPRevertShape || !this.Phrase.Shape[I]){
            this.Phrase.Cart.X[I].reverse();
            this.Phrase.Cart.Y[I].reverse();
            this.Phrase.Dim[I].reverse();
            for(let j=0; j<this.Phrase.Dim[I].length; j++){
              this.Phrase.Cart.X[I][j].reverse();
              this.Phrase.Cart.Y[I][j].reverse();
            }
          }
        }
        this.Phrase.Reorder[i]=I;
        ordered.X[i]=this.Phrase.Cart.X[I];
        ordered.Y[i]=this.Phrase.Cart.Y[I];
        ordered.Dim[i]=this.Phrase.Dim[I];
        ordered.Press[i]=this.Phrase.Press[I];
        ordered.Shape[i]=this.Phrase.Shape[I];
      }

      console.log("OP/Reordered phrase to: "+best);
      //copy ordered into WS.Phrase
      this.Phrase.Cart.X=[]; this.Phrase.Cart.Y=[];
      this.Phrase.Press=[]; this.Phrase.Shape=[];
      this.Phrase.Dim=[];
      for(let i=0; i<ordered.Dim.length; i++){
        this.Phrase.Dim[i]=ordered.Dim[i]
        this.Phrase.Press[i]=ordered.Press[i];
        this.Phrase.Shape[i]=ordered.Shape[i];
        this.Phrase.Cart.X[i]=[]; this.Phrase.Cart.Y[i]=[];
        for(let j=0; j<ordered.Dim[i].length; j++){
          this.Phrase.Cart.X[i][j]=[]; this.Phrase.Cart.Y[i][j]=[];
          for(let k=0; k<ordered.Dim[i][j]; k++){
            this.Phrase.Cart.X[i][j][k]=ordered.X[i][j][k];
            this.Phrase.Cart.Y[i][j][k]=ordered.Y[i][j][k];
          }
        }
      }
    }

    //calculate timing
    //create a simulation of the cooridinates moving through the phrase
    let X=297/2; let Y=210/2;
    for (let i=0; i<this.Phrase.Dim.length; i++) {
      this.Phrase.Var[i]=[];
      this.Phrase.Tlett[i]=0;
      this.Phrase.VarTlett[i]=0;
      for(let j=0; j<this.Phrase.Dim[i].length; j++){
        //path with wich to calculate the variance
        let path={X:[],Y:[],XSpeed: [],YSpeed: []};
        let startX=X; let startY=Y;

        //calculate time for every point and set new X,Y
        for(let k=0; k<this.Phrase.Dim[i][j]; k++){
          let speeds=this.CalcSpeeds(X,Y,
            this.Phrase.Cart.X[i][j][k],this.Phrase.Cart.Y[i][j][k],
            this.MaxSpeedA,this.MaxSpeedR);

          X=this.Phrase.Cart.X[i][j][k];
          Y=this.Phrase.Cart.Y[i][j][k];
          this.Phrase.Tlett[i]+=speeds.T;
          this.Phrase.Ttot+=speeds.T;

          path.X.push(X); path.Y.push(Y);
          path.XSpeed.push(speeds.CartSpeed.X); path.YSpeed.push(speeds.CartSpeed.Y);
        }

        //calculate variance
        this.Phrase.Var[i][j]=PV.Variance(path);

        //restart simulation for this path
        X=startX; Y=startY;
        //calculate time added by the variance for every point, and set new X,Y
        for(let k=0; k<this.Phrase.Dim[i][j]; k++){
          let speeds=this.CalcSpeeds(X,Y,
            this.Phrase.Cart.X[i][j][k],this.Phrase.Cart.Y[i][j][k],
            this.MaxSpeedA/(1+this.IdealVarK*this.Phrase.Var[i][j][k]),
            this.MaxSpeedR/(1+this.IdealVarK*this.Phrase.Var[i][j][k]));

          X=this.Phrase.Cart.X[i][j][k];
          Y=this.Phrase.Cart.Y[i][j][k];
          this.Phrase.VarTlett[i]+=speeds.T;
          this.Phrase.VarTtot+=speeds.T;
        }
        //add ascend/descend delay between fillers
        this.Phrase.Tlett[i]+=2*this.ServoToggleDelay/1000;
        this.Phrase.Ttot+=2*this.ServoToggleDelay/1000;
        this.Phrase.VarTlett[i]+=2*this.ServoToggleDelay/1000;
        this.Phrase.VarTtot+=2*this.ServoToggleDelay/1000;
      }
      //calculate the time added by the variance for letter i
      this.Phrase.VarTlett[i]-=this.Phrase.Tlett[i];
    }
    //calculate the time added by the variance for the phrase
    this.Phrase.VarTtot-=this.Phrase.Ttot;

    console.log("WS/phrase time: "+this.Phrase.Ttot.toFixed(1)+"s");
    console.log("WS/variance time: "+this.Phrase.VarTtot.toFixed(1)+"s");
    console.log("WS/Setup done");
  },

  //TARGET->it is an object defined by xin,yin,xtarg,ytarg,isup,lett,point,label
  //xin,yin are automatically assigned by CreateTarget to LastTarget.X/.Y
  //isup means before moving, the arduino will move/stay to position isup
  //letter and point are just any labels, arent used for any calculation

  //VARIABLES UPDATED THAT REFLECT THE CURRENT STATE OF THE TARGET QUEUE
  //if currently the WS is:
  //-letting the arduino continue the queue
  //-sending new target queues to arduino
  //can be true only if TargetQueue.length>0, else it will try to send
  //  to the arduino targets that dont exist
  IsPrinting: false,
  //used the next time the arduino calls ArdFastUpdate
  //is reset to false when used
  //must be turned true when the TargetQueue changes some
  //  already pushed targets, so in ClearTargetQueue
  ArdReupdate: false,
  //if the TargetQueue[0] has been updated to currentTarget by the Arduino
  CurrTargArdSent: false,
  //if the TargetQueue[0] has been updated to currentTarget by the printmonitor page
  CurrTargClntSent: false,
  //the last target of the target TargetQueue
  LastTarget: {
    Label:-1,
    Letter: -1,
    Filler: -1,
    Point: -1,
    Xtarg: 297/2, //the target coordinates
    Ytarg: 210/2,
    RTarg: 0,
    ATarg: 0,
    X:297/2, //the initial coordinates
    Y:210/2,
    A:0,
    R:0,
    dX: 0,//Xtarg-X
    dY: 0,
    dR:0,
    dA:0,
    T: 0,//duration of the point, with or without variance
    XSpeed: 0,
    YSpeed: 0,
    RSpeed: 0,
    ASpeed: 0,
    dtR: 30000,//delay between each digitalWriteLow/High toggle
    dtA: 30000,
    isup: true,
    press: 0, //0-1 value for pen pressure
  },

  //TARGET QUEUE
  //in this array the targets that should be sent to the arduino are put in
  //an array of objects, with all the properties that the arduino needs
  TargetQueue: [],
  //the total time that should take the target queue to empty
  TargetQueueT: function(){
    let sum=0;

    if(this.TargetQueue.length>0){
    //to count how many up/downs the arudino will have to make
    let toggles=0;
    let isup=this.TargetQueue[0].isup;

    for(let i=0; i<this.TargetQueue.length; i++){
      sum+=this.TargetQueue[i].T;

      if(isup!=this.TargetQueue[i].isup){
        toggles++; isup=this.TargetQueue[i].isup;
      }
    }
    sum+=toggles*this.ServoToggleDelay/1000;
    }

    return sum;
  },

  //TARGETQUEUE SET SENT TO THE ARDUINO
  //returns the length of the set of the TargetQueue to send to the arduino
  //used to compromise between:
  // -sending the entire queue and storing it for all the duration,
  // -sending just one target, and make the arduino update every time
  TargetQueueSetSize: function(){
    //only returns 0 if length==0
    let size=0;
    //simulate one at a time through the TargetQueue
    if(this.TargetQueue.length>0){
      //set already the right labels, so it starts correctly
      let letter=this.TargetQueue[0].Letter;
      let fill=this.TargetQueue[0].Fill;
      for(let i=0; i<this.TargetQueue.length; i++){
        //the conditions that define a set
        if(letter==this.TargetQueue[i].Letter
          && fill==this.TargetQueue[i].Fill
          && size<this.MaxSetSize){
            size++;
        }
        else{ break; }
      }
    }
    return size;
  },
  //the max size of a set, it corresponds to
  MaxSetSize: 50,

  //ACTUAL FUNCTIONS TO MANIPULATE THE TARGET QUEUE
  //create and push a new target at the at end of TargetQueue
  PushTarget: function(x,y,isup,press,i,j,k,lbl){
    //i,j,k,lbl are just labels that dont affect the actual target
    let trg={};
    trg.Label=lbl;
    trg.Letter=i; trg.Filler=j; trg.Point=k;
    trg.isup=isup;
    trg.press=press;//0-1 value for pen pressure
    //any new target, has its starting coordinates from the last target
    trg.X=this.LastTarget.Xtarg; trg.Y=this.LastTarget.Ytarg;
    trg.R=this.CartToRSteps(trg.X,trg.Y); trg.A=this.CartToASteps(trg.X,trg.Y);
    trg.Xtarg=x; trg.Ytarg=y;
    trg.Rtarg=this.CartToRSteps(x,y); trg.Atarg=this.CartToASteps(x,y);
    trg.dX = trg.Xtarg - trg.X;
    trg.dY = trg.Ytarg - trg.Y;
    trg.dR = trg.Rtarg - trg.R;
    trg.dA = trg.Atarg - trg.A;

    let Speeds;
    if(this.IncludeSpeedVariance && trg.Label==0){
      Speeds=this.CalcSpeeds(trg.X, trg.Y, trg.Xtarg, trg.Ytarg,
        this.MaxSpeedR/(1+this.IdealVarK*this.Phrase.Var[trg.Letter][trg.Filler][trg.Point]),
        this.MaxSpeedA/(1+this.IdealVarK*this.Phrase.Var[trg.Letter][trg.Filler][trg.Point]));
    }
    else{
      Speeds=this.CalcSpeeds(trg.X, trg.Y, trg.Xtarg, trg.Ytarg,
        this.MaxSpeedR,
        this.MaxSpeedA);
    }
    trg.XSpeed=Speeds.CartSpeed.X;
    trg.YSpeed=Speeds.CartSpeed.Y;
    trg.RSpeed=Speeds.StepSpeed.R;
    trg.ASpeed=Speeds.StepSpeed.A;
    trg.dtR=Speeds.Stepdt.R;
    trg.dtA=Speeds.Stepdt.A;
    trg.T=Speeds.T;

    if(this.LastTarget.isup != trg.isup){ trg.T += this.ServoToggleDelay/1000; }

    //all properties are set->push target
    this.LastTarget = trg;
    this.TargetQueue.push(trg);
  },


  //push at the at end of TargetQueue an entire letter, label=0
  PushLetter: function(i){
    //if it is a single point letter, just descend
    if(this.Phrase.Dim[i][0]==1){
      this.PushTarget(
        this.Phrase.Cart.X[i][0][0], this.Phrase.Cart.Y[i][0][0],true,1,i,0,0,0);
      this.PushDescend(1);
    }else{
      for(let j=0; j<this.Phrase.Dim[i].length; j++){
        this.PushTarget(
          this.Phrase.Cart.X[i][j][0], this.Phrase.Cart.Y[i][j][0],true,this.Phrase.Press[i],i,j,0,0);
        for(let k=1; k<this.Phrase.Dim[i][j]; k++){
          this.PushTarget(
            this.Phrase.Cart.X[i][j][k], this.Phrase.Cart.Y[i][j][k],false,this.Phrase.Press[i],i,j,k,0);
        }
      }
    }
    console.log("WS/pushed letter: "+i);
  },
  //push at the at end of TargetQueue the entire phrase
  PushPhrase: function(){
    for(let i=0; i<this.Phrase.Dim.length; i++){
      this.PushLetter(i);
    }
    this.PushAscend();
  },
  //push at the at end of TargetQueue a target to 0,0, label=-1
  //label=-2 is a push manual target
  PushHome: function(){
    console.log("WS/pushed home");
    this.PushTarget(297/2,210/2,true,1,-1,-1,-1,1);
  },
  //push at the at end of TargetQueue a Descend target, label=-3
  PushDescend: function(press){
    console.log("WS/pushed Descend, press: "+press);
    this.PushTarget(this.LastTarget.Xtarg,this.LastTarget.Ytarg,false,press,-1,-1,-1,3);
  },
  //push at the at end of TargetQueue a Descend target, label=-4
  PushAscend: function(){
    console.log("WS/pushed Ascend");
    this.PushTarget(this.LastTarget.Xtarg,this.LastTarget.Ytarg,true,0,-1,-1,-1,4);
  },
  //set the current coordinates of the WS and ascend
  SetCoords: function(x,y){
    this.LastTarget.Xtarg=x;
    this.LastTarget.Ytarg=y;
    console.log("WS/resetted coordinates to: "+x+","+y);
  },
  //clear the entire TargetQueue
  ClearTargetQueue: function(){
    //only send a reupdate signal if the ClearTargetQueue is actually changing something
    //  ,if before the length was 0, than its uselesss
    if(this.TargetQueue.length>0){
      this.ArdReupdate=true;
      //if the queue is going to be cleared, the last target is the current target
      this.LastTarget=this.TargetQueue[0];
    }
    this.TargetQueue=[];
    this.IsPrinting=false;
    console.log("WS/Cleared TargetQueue");

    this.PushAscend();
    //simulate that the arduino and the client have reached the last target
    //a new Currenttarget is set (the new TargetQueue[0]),
    this.CurrTargArdSent=false;
    //it must be sent to the PrintMonitor
    this.CurrTargClntSent=false;
  },

}
