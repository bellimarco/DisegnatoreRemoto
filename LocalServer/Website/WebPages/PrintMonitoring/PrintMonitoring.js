
function ModeVariables(p){

  p.ServoToggleDelay=1500;

  p.PhraseT = [];

  p.FastMode=false;
  p.PenMode=true;
  p.LiveUpdate=true;

  //the pen displayed
  p.filler=-1;
  p.letter=-1;
  p.X = 297 / 2;
  p.Y = 210 / 2;
  p.isup = true;
  p.XSpeed = 0;
  p.YSpeed = 0;

  p.TimeRemaining = 0;

  //IsPrinting indicates if after the currentTarget is finished,
  //  the PrintMonitor will search for more by activating UpdateLoopRun
  //IsPrinting on the PrintMonitor and on the WS are synced thanks to using
  //  ToggleIsPrinting(), instead of just IsPrinting=x
  //on the WS it indicates a new target will be passed to the arduino
  p.IsPrinting = false;
  //received new target->false
  //  after dt->true
  p.TargetReached=true;

  //the point of the phrase that has been tapped
  p.Chosen=false;
  p.Xchosen=-1;
  p.Ychosen=-1;
  p.LetterChosen=-1;
  p.PointChosen=-1;

  p.TargetQueue=[];
  p.QueueColors=[];//the colors assigned to each filler in the queue, [lett][fill]{r,g,b}

  //wether to calculate the variance for the targets
  p.IncludeSpeedVariance=false;

  p.dT = 0;//duration of the current target, sets timer to trigger TargetReached=true

  p.UpdateLoopT = 0; //loop to ask repeatedly to the server the UpdatePoint
  p.UpdateLoopdT = 0.2;
}

//---------------------------------------------------------------------------//
function ModeSetup(p){
  p.config.opacity=230;

  p.textSize(15);
  p.textAlign(p.LEFT, p.TOP);

  $("#activate-button").click(() => {
    if (!p.IsPrinting) {
      p.ToggleIsPrinting(true,true);
    } else {
      p.ToggleIsPrinting(false,true);
    }
  });
  $("#home-button").click(() => {
    p.httpGet("/WSPushHome", (res)=>{
      p.UpdateQueue();
      p.ToggleIsPrinting(true,true);
      console.log(res);
    });
  });
  $("#setcoords-button").click(() => {
    //input the distance in mm from the center, the WS then
    //  normalizes the value to [0;297],[0;210] for the CartPhrase
    var inp = prompt("inserisci coordinte iniziali corrette:", "0,0");
    if (inp != null && inp != "" && inp.indexOf(",")>0 && inp.length>=3) {
      let comma= inp.indexOf(",");
      let x=inp.slice(0,comma);
      let y=inp.slice(comma+1,inp.length);
      p.X=parseInt(x)+297/2;
      p.Y=parseInt(y)+210/2;
      p.isup=true;
      p.ShowPen();
      p.httpGet("/WSSetCoords/"+x+"/"+y, (res)=>{
        //p.ToggleIsPrinting(true,true);
        console.log(res);
      });
    }
  });
  $("#pushmanual-button").click(() => {
    if(p.Chosen){
      p.httpGet("/WSPushManual/"+p.Xchosen+"/"+p.Ychosen, (res)=>{
        p.UpdateQueue();
        p.UpdatePoint();
        //p.ToggleIsPrinting(true,true);
        console.log(res);
      });
    }
  });
  $("#addphrase-button").click(() => {
    p.httpGet("/WSPushPhrase", (res)=>{
      p.UpdateQueue();
      //p.ToggleIsPrinting(true,true);
      console.log(res);
    });
  });
  $("#addletter-button").click(() => {
    if (p.Chosen && p.LetterChosen!=-1) {
      p.httpGet("/WSPushLetter/"+p.LetterChosen, (res)=>{
        p.UpdateQueue();
        //p.ToggleIsPrinting(true,true);
        console.log(res);
      });
    }
    else{
      alert("Tocca una lettera sullo schermo, per selezionarla");
    }
  });
  $("#clear-button").click(() => {
    p.httpGet("/WSClear&Ascend", (res)=>{
      p.UpdateQueue();
      //p.ToggleIsPrinting(true,true);
      console.log(res);
    });
  });
  $("#variance-button").click(() => {
    if(!p.IncludeSpeedVariance){
      $("#variance-button").css("background-color","rgba(130,255,0,0.8)");
      p.IncludeSpeedVariance=true;
    }
    else{
      $("#variance-button").css("background-color","rgba(255,255,255,0.5)");
      p.IncludeSpeedVariance=false;
    }
    p.httpGet("/WSToggleVariance/"+Number(p.IncludeSpeedVariance), (res)=>{ console.log(res); });
  });
  $("#setpress-button").click(()=>{
    var inp = prompt("inserisci la percentuale di pressione desiderata:","100");
    if (inp != null && inp != "" && inp.length>=1 && parseInt(inp)>=0 && parseInt(inp)<=100) {
      p.httpGet("/WSPenDescend/"+Math.round(parseInt(inp)), (res)=>{
        p.ToggleIsPrinting(true,true);
        console.log(res);
      });
    }
  });
  $("#liveupdate-button").click(()=>{
    if(p.LiveUpdate){
      p.LiveUpdate=false;
      $("#liveupdate-button").css("background-color","rgba(255,255,255,0.5)");
    }
    else{
      p.LiveUpdate=true;
      $("#liveupdate-button").css("background-color","rgba(130,255,0,0.8)");
    }
  });
  $("#fastmode-button").click(()=>{
    if(p.FastMode){
      p.FastMode=false;
      $("#fastmode-button").css("background-color","rgba(255,255,255,0.5)");
    }
    else{
      p.FastMode=true;
      $("#fastmode-button").css("background-color","rgba(130,255,0,0.8)");
      p.LiveUpdate=false;
      $("#liveupdate-button").css("background-color","rgba(255,255,255,0.5)");
    }
    p.httpGet("/WSToggleFastMode/"+Number(p.FastMode),(res)=>{});
    console.log("clnt/toggled fastmode: "+p.FastMode);
  });
  $("#penmode-button").click(()=>{
    if(p.PenMode){
      p.PenMode=false;
      $("#penmode-button").css("background-color","rgba(255,255,255,0.5)");
    }
    else{
      p.PenMode=true;
      $("#penmode-button").css("background-color","rgba(130,255,0,0.8)");
    }
    p.httpGet("/WSTogglePenMode/"+Number(p.PenMode),(res)=>{});
    console.log("clnt/toggled penmode: "+p.PenMode);
  });
  $("#manupdate-button").click(()=>{
    p.UpdatePoint();
  });

  $("#main-canvas").on("mousedown",()=>{
    let c= ClosestPoint(p);
    p.LetterChosen=c.letter;
    p.PointChosen=c.point;
    p.Xchosen=Math.round(p.mouseX/p.Scale);
    p.Ychosen=Math.round(p.mouseY/p.Scale);
    p.Chosen=true;
  });
  $("#main-canvas").on("touchstart",()=>{
    //for touch, it has to be delayed cause time is needed for p5 to setup mouse variables
    setTimeout(()=>{
      let c= ClosestPoint(p);
      p.LetterChosen=c.letter;
      p.PointChosen=c.point;
      p.Xchosen=p.mouseX/p.Scale;
      p.Ychosen=p.mouseY/p.Scale;
      p.Chosen=true;
    },2);
  });

  p.UpdateQueue();
  setTimeout(()=>{
    $("#Phrase-Name").html("Nome: " + p.PhraseName);
  }, 1000);
  p.UpdateHTML();

}

//---------------------------------------------------------------------------//
function ModeDraw(p){

  p.noStroke();

  for(let i=0; i<p.TargetQueue.length; i++){
    if(p.TargetQueue[i].letter==-1){ p.fill(0,0,255); }
    else{ p.fill(p.QueueColors[p.TargetQueue[i].letter][p.TargetQueue[i].filler]); }
    p.circle(p.TargetQueue[i].X*p.Scale, p.TargetQueue[i].Y*p.Scale,5);
  }
  for(let i=1; i<p.TargetQueue.length; i++){
    if(p.TargetQueue[i].isup){
      p.strokeWeight(2);
      p.stroke(0,0,255);
    }else{
      p.stroke(0);
    }
    p.line(p.TargetQueue[i-1].X*p.Scale, p.TargetQueue[i-1].Y*p.Scale,
             p.TargetQueue[i].X*p.Scale, p.TargetQueue[i].Y*p.Scale);
    p.strokeWeight(1);
  }


  //if IsPrinting, after dt check for more targets
  if (p.IsPrinting) {
    if (p.TargetReached && p.LiveUpdate) {
      p.UpdateLoopT++;
      if (p.UpdateLoopT > p.UpdateLoopdT * p.fps) {
        p.UpdateLoopT = 0;
        p.UpdatePoint();
      }
    }

  }

  if (!p.TargetReached) {
    if(p.TimeRemaining>1/p.fps){
      p.TimeRemaining -= 1/p.fps;
      p.UpdateHTML();
    }

    p.MovePen();
  }
  p.ShowPen();
}

//---------------------------------------------------------------------------//
function ModeFunctions(p){
  //toggle to true/false current IsPrinting and send it  to the server
  p.ToggleIsPrinting = (a,req) => {
    if (a) {
      p.IsPrinting = true;
      $("#activate-button").css("background-image", 'url("/images/icon-pause.png")');
      $("#State").html("State: Printing");
      if(req){
      p.httpGet("/WSIsPrinting/1", (res) => {
        console.log(res);
      });
      }
    } else {
      p.IsPrinting = false;
      $("#activate-button").css("background-image", 'url("/images/icon-play.png")');
      $("#State").html("State: NotPrinting");
      if(req){
      p.httpGet("/WSIsPrinting/0", (res) => {
        console.log(res);
      });
      }
    }
  }

  p.UpdatePoint=()=>{
    p.httpGet("/WSUpdatePoint", (res) => {
      let a=JSON.parse(res);

      //if the queue has been finished, WS turns automatically isprinting
      if(!a.IsPrinting){
        console.log("clnt/Received Not Printing");
        //set is printing in the client to false, but dont resend it to the server
        p.ToggleIsPrinting(false,false);
        p.XSpeed=0;
        p.YSpeed=0;
        p.dT=0;
        p.TimeRemaining=0;
        p.UpdateQueue();

        p.UpdateHTML();
      }else if(a.new){
        p.filler=a.filler;
        p.letter=a.letter;
        p.label=a.label;
        p.XSpeed=a.XSpeed;
        p.YSpeed=a.YSpeed;
        p.X=a.X;
        p.Y=a.Y;

        if(p.isup!=a.isup){
          p.isup=a.isup;
          console.log("clnt/toggled isup: "+p.isup);
        }

        if(p.TargetQueue.length>0){
        while(p.X!=p.TargetQueue[0].X || p.Y != p.TargetQueue[0].Y){
          p.TargetQueue.shift();
        }}

        p.dT=a.dT;
        p.TimeRemaining=a.Ttot;

        //after the get request, always reset the timers
        p.UpdateLoopT = 0;
        //received new target
        p.TargetReached=false;
        //after dT disable penmove and start UpdateLoop
        setTimeout(()=>{
          p.TargetReached=true;
        },p.dT*1000);

        console.log("clnt/received new target");
        p.UpdateHTML();
      }
    });
  }

  p.UpdateQueue=()=>{
    p.httpGet("/WSUpdateQueue", (res) => {
      let a=JSON.parse(res);
      p.TargetQueue=[];
      p.QueueColors=[];
      for(let i=0; i<p.phrase.length; i++){
        p.QueueColors[i]=[];
      }
      //push the queue
      for(let i=0; i<a.length; i++){
        if(a[i].letter!=-1){
          p.TargetQueue.push({
            letter:a[i].letter,
            filler:a[i].filler,
            isup:a[i].isup,
            X:a[i].X,
            Y:a[i].Y,
          });
          //push a random p5color variable
          if(!p.QueueColors[a[i].letter][a[i].filler]){
            //create random hsl color and convert it to rgb
            let h=Math.round(Math.random()*360);
            let l=0.2+Math.random()*0.4;
            let c=1-Math.abs(2*l-1);
            let x=c*(1-Math.abs((h/60)%2-1));
            let m=l-c/2;
            let r=0; let g=0; let b=0;
            if(h<60){ r=c; g=x; b=0; }
            else if(h<120){ r=x; g=c; b=0; }
            else if(h<180){ r=0; g=c; b=x; }
            else if(h<240){ r=0; g=x; b=c; }
            else if(h<300){ r=x; g=0; b=c; }
            else if(h<=360){ r=c; g=0; b=x; }
            p.QueueColors[a[i].letter][a[i].filler]=p.color((r+m)*255,(g+m)*255,(b+m)*255);
          }
        }else{
          p.TargetQueue.push({
            letter:-1,
            filler:-1,
            isup:a[i].isup,
            X:a[i].X,
            Y:a[i].Y,
          });
        }
      }
    });
  }

  p.MovePen = () => {
    p.X += p.XSpeed / p.fps;
    p.Y += p.YSpeed / p.fps;
  }
  p.ShowPen = () => {
    p.fill(255, 255, 0);
    p.stroke(0);
    p.circle(p.X * p.Scale, p.Y * p.Scale, 18);
    if (!p.isup) {
      p.line(p.X * p.Scale, p.Y * p.Scale - 7, p.X * p.Scale, p.Y * p.Scale + 6);
      p.line(p.X * p.Scale, p.Y * p.Scale + 6, p.X * p.Scale + 5, p.Y * p.Scale + 1);
      p.line(p.X * p.Scale, p.Y * p.Scale + 6, p.X * p.Scale - 5, p.Y * p.Scale + 1);
    } else {
      p.line(p.X * p.Scale, p.Y * p.Scale + 7, p.X * p.Scale, p.Y * p.Scale - 6);
      p.line(p.X * p.Scale, p.Y * p.Scale - 6, p.X * p.Scale + 5, p.Y * p.Scale - 1);
      p.line(p.X * p.Scale, p.Y * p.Scale - 6, p.X * p.Scale - 5, p.Y * p.Scale - 1);
    }
  }

  //update the info relative to the currentTarget
  p.UpdateHTML = () => {
    $("#Time-Remaining").html("Tempo Rimanente: " + Math.floor(p.TimeRemaining / 60) + "m " + Math.floor((p.TimeRemaining - Math.floor(p.TimeRemaining / 60) * 60)*10)/10 + "s");
    $("#XSpeed").html("X: "+p.X.toFixed(1)+"&nbsp&nbsp&nbsp&nbsp Speed X: "+Math.round(p.XSpeed*10)/10);
    $("#YSpeed").html("Y: "+p.Y.toFixed(1)+"&nbsp&nbsp&nbsp&nbsp Speed Y: "+Math.round(p.YSpeed*10)/10);
  }

}
