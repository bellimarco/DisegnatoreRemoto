

module.exports={
  //the mm interval between each point in Smooth
  //smaller=more precise, but also more expensive
  Delta:0.8,
  //how many 0 SmoothPoints does the first point of the path have to be set to
  StartZeroLength: 20,
  //haw many 0 SmoothPoints does the last added point on the path have to be set to
  EndZeroLength: 20,
  //to approximate
  //how many points far from the analyzed point does the variance have to take into account
  VarRadius: 20,
  //whether the path is just 1 point
  IsSinglePoint: false,

  //the DPoints array is another way to organize the points, by calculating
  //  their ditance(on the path) from the first point of the path
  //  so we also have a timetable for all the distances, and they don't need to be
  //  calculated during the process

  //the set of points, of wich we want to calculate the variance
  Path: {
    X:[],
    Y:[],
    XSpeed: [],
    YSpeed: [],
    DPoints: [],
  },
  //the path might not be smooth(points not being equally distant form eachother)
  //  so a new set of points is created, that is "homogenous", and will return
  //  a better value for the variance
  //the parent is the index of the Path Point that this Smooth Point is rappresenting
  Smooth: {
    parent: [],
    XSpeed: [],
    YSpeed: [],
    DPoints: [],
    XVar: [],
    YVar: [],
  },
  //reset to a new path this object
  Reset: function(path){
    this.Path.X=path.X;
    this.Path.Y=path.Y;
    this.Path.XSpeed=path.XSpeed;
    this.Path.YSpeed=path.YSpeed;
    this.Path.DPoints=[],
    this.Smooth.parent=[];
    this.Smooth.XSpeed=[];
    this.Smooth.YSpeed=[];
    this.Smooth.DPoints=[];
    this.Smooth.XVar=[];
    this.Smooth.YVar=[];
    if(this.Path.X.length==1){
      this.IsSinglePoint=true;
    }
    else{
      this.IsSinglePoint=false;
    }
  },

  //function to quickly push a new point to Smooth
  SmoothPush: function(p,xspeed,yspeed,d){
    this.Smooth.parent.push(p);
    this.Smooth.YSpeed.push(yspeed);
    this.Smooth.XSpeed.push(xspeed);
    this.Smooth.DPoints.push(d);
  },
  //returns the path distance between 2 points(a,b)
  PathDist: function(a,b){
    let dist=0;
    if(a>b){
      for(let j=b+1; j<=a; j++){
        dist+=Math.sqrt(Math.pow(this.Path.X[j]-this.Path.X[j-1],2)
              +Math.pow(this.Path.Y[j]-this.Path.Y[j-1],2));
      }
    }
    else{
      for(let j=a+1; j<=b; j++){
        dist+=Math.sqrt(Math.pow(this.Path.X[j]-this.Path.X[j-1],2)
              +Math.pow(this.Path.Y[j]-this.Path.Y[j-1],2));
      }
    }
    return dist;
  },


  //returns the variance array of the path
  Variance: function(path){

    this.Reset(path);

    //the array that will be returned
    let Var=[];

    //only calculate if its not a single point, otherwise var=0
    if(!this.IsSinglePoint){

      //copy the path points on the D line
      this.Path.DPoints.push(0);
      for(let j=1; j<this.Path.X.length; j++){
        this.Path.DPoints.push(this.PathDist(0,j));
      }

      //calculate the smooth points
      for(let k=1; k<this.StartZeroLength+1; k++){
        this.SmoothPush(0,0,0,this.Delta*(-this.StartZeroLength+k));
      }
      let d=this.Delta;
      let par=1;
      while(d<this.Path.DPoints[this.Path.DPoints.length-1]){
        //first check if d is over the current parent d
        if(d>this.Path.DPoints[par]){
          par++;
        }
        this.SmoothPush(par,this.Path.XSpeed[par],this.Path.YSpeed[par],d);
        //go forward with d of Delta
        d+=this.Delta;
      }
      //add zeros at the end, setting arbitrarily the distance of the invented letter
      for(let k=0; k<this.EndZeroLength; k++){
        this.SmoothPush(par+1,0,0,d+this.Delta*k);
      }

      //calculate the variance of the smooth points
      for(let k=0; k<this.Smooth.DPoints.length; k++){
        let varx=0; let vary=0;
        for(let K=k-this.VarRadius; K<=k+this.VarRadius; K++){
          if(K>=0 && K<this.Smooth.DPoints.length){
          let d=Math.pow(Math.abs(this.Smooth.DPoints[k]-this.Smooth.DPoints[K]),2)+0.01;
          let a=Math.pow(Math.abs(this.Smooth.XSpeed[k]-this.Smooth.XSpeed[K]),1.8);
          varx+=a/d;
          a=Math.pow(this.Smooth.YSpeed[k]-this.Smooth.YSpeed[K],2);
          vary+=a/d;
          }
        }
        this.Smooth.XVar[k]=varx;
        this.Smooth.YVar[k]=vary;
      }

      //calculate the variance of the path(average of the same parent)
      for(let j=1; j<this.Path.X.length; j++){
        let varxavg=0; let varyavg=0;
        let tot=0;
        for(let k=0; k<this.Smooth.DPoints.length; k++){
          if(j==this.Smooth.parent[k]){
            tot++;
            varxavg+=this.Smooth.XVar[k];
            varyavg+=this.Smooth.YVar[k];
          }
        }
        varxavg/=tot;
        varyavg/=tot;
        if(tot==0){varxavg=0; varyavg=0;}
        Var[j]=Math.sqrt(Math.pow(varxavg,2)+Math.pow(varyavg,2));
      }
      Var[0]=0;
    }
    else{
      Var[0]=0;
    }

    return Var;
  },
};
