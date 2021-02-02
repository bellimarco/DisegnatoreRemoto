
//with two vectors, find the outer point of the shape going clockwise
//  if only one vector is given, means its an extreme of the path so return the points of a circle
function PathShapePoints(p,vin,vfi,sharp){
  let points={
    X:[],
    Y:[],
  }

  //if its not an extreme of the path
  if(vin.X!=404 && vfi.X!=404){
    //first normalize the input vectors
    let rin=Math.sqrt(Math.pow(vin.X,2)+Math.pow(vin.Y,2));
    let rfi=Math.sqrt(Math.pow(vfi.X,2)+Math.pow(vfi.Y,2));
    vin.X/=rin; vin.Y/=rin;
    vfi.X/=rfi; vfi.Y/=rfi;

    let v={
      X:404,
      Y:404,
    }
    //the sum of the vectors returns the middle vector in the acute space,
    //  so we need to do *-1 if the convex space comes first clockwise
    //if clockwise, there is an angle <180 between vin,vfi
    if(-vin.Y*vfi.X+vin.X*vfi.Y>0){
      v.X=vin.X+vfi.X;
      v.Y=vin.Y+vfi.Y;
    }
    else if(-vin.Y*vfi.X+vin.X*vfi.Y<0){
      v.X=-vin.X-vfi.X;
      v.Y=-vin.Y-vfi.Y;
    }
    else{
      v.X=-vin.Y; v.Y=vin.X;
    }
    //normalize the output vector
    let rv=Math.sqrt(Math.pow(v.X,2)+Math.pow(v.Y,2));
    v.X=v.X/rv*sharp/2;
    v.Y=v.Y/rv*sharp/2;
    points.X.push(v.X);
    points.Y.push(v.Y);
  }
  //if its the end point
  else if(vin.X!=404 && vfi.X==404){
    //first normalize the input vectors
    let rin=Math.sqrt(Math.pow(vin.X,2)+Math.pow(vin.Y,2));
    vin.X/=rin; vin.Y/=rin;
    //console.log("vfi404, vinX: "+vin.X+"  vinY: "+vin.Y);

    let start={X:0,Y:0};
    start.X=-vin.Y*sharp/2; start.Y=vin.X*sharp/2;
    for(let k=0; k<5; k++){
      points.X.push(start.X*Math.cos(k*3.1415/4)-start.Y*Math.sin(k*3.1415/4));
      points.Y.push(start.X*Math.sin(k*3.1415/4)+start.Y*Math.cos(k*3.1415/4));
    }
  }
  //if its the start point
  else if(vin.X==404 && vfi.X!=404){
    //first normalize the input vectors
    let rfi=Math.sqrt(Math.pow(vfi.X,2)+Math.pow(vfi.Y,2));
    vfi.X/=rfi; vfi.Y/=rfi;
    //console.log("vin404, vfiX: "+vfi.X+"  vfiY: "+vfi.Y);

    let start={X:0,Y:0};
    start.X=-vfi.Y*sharp/2; start.Y=vfi.X*sharp/2;
    for(let k=0; k<5; k++){
      points.X.push(start.X*Math.cos(k*3.1415/4)-start.Y*Math.sin(k*3.1415/4));
      points.Y.push(start.X*Math.sin(k*3.1415/4)+start.Y*Math.cos(k*3.1415/4));
    }
  }

  return points;
}

//given a path, find the path of the edge of the shape
function PathToShape(p,path,sharp){

  let shape={
    X:[],
    Y:[],
  }

  //covers the first outer side of the path, and the 2 extremes
  if(path.X.length>1){
  for(let i=0; i<path.X.length; i++){
    let vin={X:404,Y:404,};
    let vfi={X:404,Y:404,};
    if(i>0){
      vin.X=path.X[i-1]-path.X[i];
      vin.Y=path.Y[i-1]-path.Y[i];
    }
    if(i<path.X.length-1){
      vfi.X=path.X[i+1]-path.X[i];
      vfi.Y=path.Y[i+1]-path.Y[i];
    }
    let points=PathShapePoints(p,vin,vfi,sharp);
    for(let j=0; j<points.X.length; j++){
      shape.X.push(path.X[i]+points.X[j]);
      shape.Y.push(path.Y[i]+points.Y[j]);
    }
  }
  //the second outer part of the path
  if(path.X.length>2){
  for(let i=path.X.length-2; i>0; i--){
    let vin={X:path.X[i+1]-path.X[i], Y:path.Y[i+1]-path.Y[i],};
    let vfi={X:path.X[i-1]-path.X[i], Y:path.Y[i-1]-path.Y[i],};

    let points=PathShapePoints(p,vin,vfi,sharp);
    shape.X.push(path.X[i]+points.X[0]);
    shape.Y.push(path.Y[i]+points.Y[0]);
  }
  }
  }
  //for single point paths, return a circle
  else if(path.X.length==1){
  for(let a=0; a<8; a++){
    shape.X.push(path.X[0]+sharp/2*Math.cos(a*3.1415/4));
    shape.Y.push(path.Y[0]+sharp/2*Math.sin(a*3.1415/4));
  }
  }

  return shape;
}
