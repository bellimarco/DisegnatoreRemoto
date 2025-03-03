//given a path, return another path, that covers all the space inside of the input
module.exports={
  //a "pixels" array, to mark wich points have been checked/added
    //0->nothing/clear, 1->checked, 3->hole border, 4->temporary checkpath filler
    pxls: [],
    //the scale at wich is drawn the pxls array
    scale: 8,

    //the external path
    path: {
      X:[],
      Y:[],
    },
    //the holes of the path
    holes: [],
    //if the path goes to the left while movinng forward(anti-clockise)
    pathlefty: false,

    //how much space (radius) can a point cover
    sharpness:0.34,
    //when calculating an inner path, the distance set between each new point
    //should be a bit more than sharpness*2
    smoothd:0.72,
    //the depth step of every new inner path
    depthstep:0.8,
    //dstep applied to every inner path during FillStep
    middleSmoothd: 1.2,
    //dstep applied to every finished filler at the end
    finalSmoothd: 1.4,

    //fill algorithm
    fillers:[],//the object returned at the end, array of concentric paths, and colors
    paths:[],//temporary fill algorithm array
    queue:[],//temporary fill algorithm array
    //safe switch for while loop
    FillSteps:0,
    MaxFillStep:150,

    //setup the SF object with the letter-> {X[],Y[],holes[]}
    Setup: function(pth){
      //initialize the pxls array
      for(let i=0; i<297*this.scale; i++){
        for(let j=0; j<210*this.scale; j++){
          this.pxls[i+j*297*this.scale]=0;
        }
      }

      //to avoid pasing the reference of the path object, copy elements 1 by 1
      this.path={X:[], Y:[]};
      this.holes=[];
      //create a path closed at the end with the first point
      let p={X:[], Y:[]};
      for(let j=0; j<pth.X.length; j++){
        p.X[j]=pth.X[j];
        p.Y[j]=pth.Y[j];
      }
      p.X.push(pth.X[0]); p.Y.push(pth.Y[0]);
      //smooth the closed pth
      let s=this.Smooth(p,this.smoothd);
      for(let j=0; j<s.X.length; j++){
        this.path.X[j]=s.X[j];
        this.path.Y[j]=s.Y[j];
      }
      //do the same for the holes
      for(let j=0; j<pth.holes.length; j++){
        this.holes[j]={X:[],Y:[]};
        p={X:[], Y:[]};
        for(let k=0; k<pth.holes[j].X.length; k++){
          p.X[k]=pth.holes[j].X[k];
          p.Y[k]=pth.holes[j].Y[k];
        }
        p.X.push(pth.holes[j].X[0]); p.Y.push(pth.holes[j].Y[0]);
        s=this.Smooth(p,this.smoothd);
        for(let k=0; k<s.X.length; k++){
          this.holes[j].X[k]=s.X[k];
          this.holes[j].Y[k]=s.Y[k];
        }
      }
      //close the smoothed path and the holes with the first and last points
      this.path.X.splice(0,0,this.path.X[this.path.X.length-1]);
      this.path.Y.splice(0,0,this.path.Y[this.path.Y.length-1]);
      this.path.X.push(this.path.X[1]);
      this.path.Y.push(this.path.Y[1]);
      for(let j=0; j<this.holes.length; j++){
        this.holes[j].X.splice(0,0,this.holes[j].X[this.holes[j].X.length-1]);
        this.holes[j].Y.splice(0,0,this.holes[j].Y[this.holes[j].Y.length-1]);
        this.holes[j].X.push(this.holes[j].X[1]);
        this.holes[j].Y.push(this.holes[j].Y[1]);
      }

      //calculate direction of the smoothed path
      //the holes go in the opposite direction
      this.pathlefty=this.lefty(this.path);

      //color the path and the holes
      for(let i=0; i<this.path.X.length; i++){
        this.ColorPoint(this.path.X[i],this.path.Y[i],this.sharpness,1);
      }
      for(let j=0; j<this.holes.length; j++){
        //fill the inside of the hole
        let inn=this.Inner(this.holes[j],!this.pathlefty);
        let safe=0;
        while(safe<1 && inn.X.length>0){
          safe++;
          for(let k=0; k<inn.X.length; k++){
            this.ColorPoint(inn.X[k],inn.Y[k],this.sharpness*1,1);
          }
          inn=this.Inner(inn,!this.pathlefty);
        }
        //mark the border hole
        for(let k=0; k<this.holes[j].X.length; k++){
          this.ColorPoint(this.holes[j].X[k],this.holes[j].Y[k],this.sharpness*1.4,3);
        }
      }

      this.fillers=[];
      this.fillers.push({X:[],Y:[],r:200,g:0,b:0});
      this.paths=[];
      this.paths.push(this.path);
      this.queue=[];
      this.FillSafe=0;
    },

    //following right hand rule, if det>0 -> going clockwise -> not lefty
    lefty: function(path){
     //dont count the points that are in the same coordinates
      let pth={X:[],Y:[]};
      for(let i=1; i<path.X.length; i++){
        if(path.X[i]!=path.X[i-1] && path.Y[i]!=path.Y[i-1]){
          pth.X.push(path.X[i]); pth.Y.push(path.Y[i]);
        }
      }

      //following right hand rule, if det>0 -> going anti-clockwise
      let sum=0;
      for(let i=1; i<pth.X.length-1; i++){
        let vin={
          X: pth.X[i]-pth.X[i-1],
          Y: pth.Y[i]-pth.Y[i-1],
        }
        let vfi={
          X: pth.X[i+1]-pth.X[i],
          Y: pth.Y[i+1]-pth.Y[i],
        }
        //signed arccosine, *0.99 to avoid >1 arguments
        let a=Math.sign(vin.X*vfi.Y-vin.Y*vfi.X)*Math.acos(0.99*(vin.X*vfi.X+vin.Y*vfi.Y)/
          (Math.sqrt((vin.X*vin.X+vin.Y*vin.Y)*(vfi.X*vfi.X+vfi.Y*vfi.Y))));
        sum+=a;
      }
      if(sum>=0){ return false; }
      else{ return true; }
    },

    //new path with points spread between equal distance intervals
    Smooth: function(pth, dstep){
      //the returned object
      let smth={
        par: [],//the index of the parent point
        X:[],
        Y:[],
      }

      let d=0;
      for(let i=1; i<pth.X.length; i++){
        //the space available until the next point
        let di=Math.sqrt(Math.pow(pth.X[i-1]-pth.X[i],2)+Math.pow(pth.Y[i-1]-pth.Y[i],2));
        //while there is space until the next point
        while(d<di){
          smth.par.push(i);
          smth.X.push(pth.X[i-1]+(pth.X[i]-pth.X[i-1])*d/di);
          smth.Y.push(pth.Y[i-1]+(pth.Y[i]-pth.Y[i-1])*d/di);
          d+=dstep;
        }
        //setback the d, so its ready for the next point
        d-=di;
      }

      return smth;
    },

    //check if around a point there are checked pixels
    CheckPoint: function(x,y,r,c){
      let check=false
      for(let R=0.1; R<=r; R+=0.08){
        for(let a=0; a<2*Math.PI; a+=0.08/R){
          if(this.pxls[
            Math.round((Math.cos(a)*R+x)*this.scale)+
            Math.round((Math.sin(a)*R+y)*this.scale)*297*this.scale]==c){
            check=true;
          }
        }
      }
      return check;
    },
    //color the pixels aroun a point
    ColorPoint: function(x,y,r,c){
      this.pxls[Math.round(x*this.scale)+Math.round(y*this.scale)*297*this.scale]=c;
      for(let R=0.1; R<=r; R+=0.1){
        for(let a=0; a<2*Math.PI; a+=0.1/R){
          this.pxls[
            Math.round((Math.cos(a)*R+x)*this.scale)+
            Math.round((Math.sin(a)*R+y)*this.scale)*297*this.scale]=c;
        }
      }
    },
    //color the pixels around every point of a path
    ColorPath: function(pth,r,c){
      for(let i=0; i<pth.X.length; i++){
        this.ColorPoint(pth.X[i],pth.Y[i],r,c);
      }
    },
    //check between 2 points how many colored pixels are there
    CheckLine: function(ax,ay,bx,by,r,c){
      let count=0;
      let v={X: bx-ax, Y: by-ay,};
      let d=Math.sqrt(v.X*v.X+v.Y*v.Y);
      for(let dt=0; dt<d; dt+=0.1){
        if(this.CheckPoint(ax+v.X*dt/(d+0.01),ay+v.Y*dt/(d+0.01),r,c)){
          count++;
        }
      }
      return count;
    },

    //return the closest hole and hole point
    ClosestHole: function(x,y){
      let closest={hole: -1, point: -1};
      let bestd=10000000;
      for(let j=0; j<this.holes.length; j++){
        for(let k=0; k<this.holes[j].X.length; k++){
          if(Math.pow(this.holes[j].X[k]-x,2)+Math.pow(this.holes[j].Y[k]-y,2)<bestd){
            bestd=Math.pow(this.holes[j].X[k]-x,2)+Math.pow(this.holes[j].Y[k]-y,2);
            closest.hole=j;
            closest.point=k;
          }
        }
      }
      return closest;
    },

    //given a path and its direction, find the path directly inside of it
    Inner: function(pth,lefty){
      let inner={X:[],Y:[]}
      let vin={ X:404, Y:404, };
      let vfi={ X:404, Y:404, };
      let v={ X:404, Y:404, };

      for(let i=1; i<pth.X.length-1; i++){
        //find and normailize the vectors
        vin.X=pth.X[i]-pth.X[i-1];
        vin.Y=pth.Y[i]-pth.Y[i-1];
        vfi.X=pth.X[i+1]-pth.X[i];
        vfi.Y=pth.Y[i+1]-pth.Y[i];
        let rin=Math.sqrt(Math.pow(vin.X,2)+Math.pow(vin.Y,2));
        let rfi=Math.sqrt(Math.pow(vfi.X,2)+Math.pow(vfi.Y,2));
        vin.X/=rin; vin.Y/=rin;
        vfi.X/=rfi; vfi.Y/=rfi;

        //the vector that should be facing inward
        v.X=vfi.X-vin.X;
        v.Y=vfi.Y-vin.Y;
        if(vin.X*vfi.Y-vin.Y*vfi.X<0 && !lefty){
          v.X*=-1;
          v.Y*=-1;
        }
        else if(vin.X*vfi.Y-vin.Y*vfi.X>0 && lefty){
          v.X*=-1;
          v.Y*=-1;
        }
        else if(vin.X*vfi.Y-vin.Y*vfi.X==0){
          if(lefty){
            v.X=vin.Y;
            v.Y=-vin.X;
          }
          else{
            v.X=-vin.Y;
            v.Y=vin.X;
          }
        }

        let vd=Math.sqrt(Math.pow(v.X,2)+Math.pow(v.Y,2));
        //normalize the vector to module=depthstep, push the point
        inner.X.push(v.X*this.depthstep/vd+pth.X[i]);
        inner.Y.push(v.Y*this.depthstep/vd+pth.Y[i]);
      }

      return inner;
    },

    //from the entire inner path, create all the paths that should be added
    CheckPath: function(inner){
      let checked={X:[], Y:[]};
      let paths=[];

      //copy in the checked array only non occupied inner points
      for(let i=0; i<inner.X.length; i++){
        //not occupied point
        if(!this.CheckPoint(inner.X[i],inner.Y[i],this.sharpness,1)){
          //not close to a hole border
          if(!this.CheckPoint(inner.X[i],inner.Y[i],this.sharpness,3)){
            checked.X.push(inner.X[i]);
            checked.Y.push(inner.Y[i]);
          }
          else{
            checked.X.push(inner.X[i]);
            checked.Y.push(inner.Y[i]);
            //eliminate the color that marks the border
            this.ColorPoint(inner.X[i],inner.Y[i],this.sharpness*1.2,0);
            //add the entire border, from the closest point
            //only if the border points aren't occupied
            let closest=this.ClosestHole(inner.X[i],inner.Y[i]);
            for(let k=closest.point; k<this.holes[closest.hole].X.length-1; k++){
                checked.X.push(this.holes[closest.hole].X[k]);
                checked.Y.push(this.holes[closest.hole].Y[k]);
                this.ColorPoint(this.holes[closest.hole].X[k],this.holes[closest.hole].Y[k],this.sharpness*1.6,0);
            }
            for(let k=1; k<closest.point; k++){
                checked.X.push(this.holes[closest.hole].X[k]);
                checked.Y.push(this.holes[closest.hole].Y[k]);
                this.ColorPoint(this.holes[closest.hole].X[k],this.holes[closest.hole].Y[k],this.sharpness*1.6,0);
            }
          }
        }
      }
      //divide checked in connected paths
      for(let i=0; i<checked.X.length; i++){
        let connected=false;
        //if can find an alreay existing path, add it to that
        for(let j=paths.length-1; j>=0; j--){
          //if this point is connected to last point of last created path
          if(10>this.CheckLine(checked.X[i], checked.Y[i],paths[j].X[paths[j].X.length-1], paths[j].Y[paths[j].X.length-1],this.sharpness,1,1)){
            paths[j].X.push(checked.X[i]);
            paths[j].Y.push(checked.Y[i]);
            j=-1;
            connected=true;
          }
        }
        //if it isnt already connected to any path, create a new path
        if(!connected){
          let p={X:[],Y:[]};
          p.X.push(checked.X[i]);
          p.Y.push(checked.Y[i]);
          paths.push(p);
        }
      }

      //check for unclosed paths
      for(let i=0; i<paths.length-1; i++){
        if(Math.pow(paths[i].X[paths[i].X.length-1]-paths[i].X[0],2)
              +Math.pow(paths[i].Y[paths[i].X.length-1]-paths[i].Y[0],2)>200){
          paths[i].X.push(...paths[i+1].X);   paths[i].Y.push(...paths[i+1].Y);
          paths.splice(i+1,1);
          i--;
        }
      }
      //check for too small paths
      //for(let i=paths.length-1; i>=0; i--){if(paths[i].X.length<=3){paths.splice(i,1);}}

      //close and smooth the paths
      for(let i=0; i<paths.length; i++){
        paths[i].X.push(paths[i].X[0]);
        paths[i].Y.push(paths[i].Y[0]);
        let s=this.Smooth(paths[i],this.smoothd);
        paths[i]={X:[],Y:[]};
        for(let j=0; j<s.X.length; j++){
          paths[i].X[j]=s.X[j];
          paths[i].Y[j]=s.Y[j];
        }
        paths[i].X.splice(0,0,paths[i].X[paths[i].X.length-1]);
        paths[i].Y.splice(0,0,paths[i].Y[paths[i].Y.length-1]);
        paths[i].X.push(paths[i].X[1]);
        paths[i].Y.push(paths[i].Y[1]);
      }
      return paths;
    },

    //a step in the Fill algorithm, useful for debugging and going one step at a time
    FillStep: function(){
      this.FillSteps++;

      if(this.paths.length>0){
        //if more paths branch out, add them in the queue
        for(let i=1; i<this.paths.length; i++){this.queue.unshift(this.paths[i]);}

        let p=this.paths[0];
        this.ColorPath(p,this.sharpness,1);
        //find the inner paths of the parent
        this.paths=this.CheckPath(this.Inner(p,this.pathlefty));

        //now that p has been used, smooth it to use less memory and add it to the fillers
        let P=this.Smooth(p,this.middleSmoothd);
        //the first path starts from where the last ended, so add it directly
        for(let i=1; i<P.X.length-1; i++){
            this.fillers[this.fillers.length-1].X.push(P.X[i]);
            this.fillers[this.fillers.length-1].Y.push(P.Y[i]);
        }
      }
      //when a branch is finished, go up the queue and create new filler
      else if(this.queue.length>0){
        this.paths=[this.queue[0]];
        this.queue.splice(0,1);
        this.fillers.push({X:[],Y:[]});
      }
    },

    //complete function letter->fillers
    Fill: function(letter){
      console.log("SF/starting, shapelength: "+letter.X.length+", holes: "+letter.holes.length);
      //Setup every variable in SF for the new letter
      this.Setup(letter);
      //max 100 fill steps
      while(this.FillSteps<this.MaxFillStep && (this.paths.length>0 || this.queue.length>0)){
        this.FillStep();
      }
      //smooth the found fillers, add random colors to every filler
      for(let i=0; i<this.fillers.length; i++){
        this.fillers[i]=this.Smooth(this.fillers[i],this.finalSmoothd);
        this.fillers[i].r=Math.round(Math.random()*255);
        this.fillers[i].g=Math.round(Math.random()*255);
        this.fillers[i].b=Math.round(Math.random()*255);
      }

      console.log("SF/filled shape, fillers: "+this.fillers.length+", FillSteps: "+this.FillSteps);
      this.FillSteps=0;
      return this.fillers;
    }
  }
