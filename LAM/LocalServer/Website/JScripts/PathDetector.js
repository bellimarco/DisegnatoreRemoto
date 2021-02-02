PD={
  //the pixel array of the analyzed image
  pxls:[],
  pxw:-1,//width
  pxh:-1,//height
  //the interval between color steps
  ColorStep:17,
  //the color with wich the checked/discovered border is colored
  Checked:300,
  //the color with wich the pixels of added sheps are colored
  Added:400,

  //update the internal pixel array
  UpdatePxls: function(px,w,h, stp){
    this.pxw=w;
    this.pxh=h;
    this.ColorStep=stp;

    for(let i=0; i<px.length; i++){
      this.pxls[i]=px[i];
    }

    //create white borders around the image
    for(let x=0; x<PD.pxw; x++){
      for(let y=0; y<3; y++){
        PD.pxls[x+y*PD.pxw]=255;
        PD.pxls[x+(PD.pxh-1-y)*PD.pxw]=255;
      }
    }
    for(let y=0; y<PD.pxh; y++){
      for(let x=0; x<3; x++){
        PD.pxls[x+y*PD.pxw]=255;
        PD.pxls[(PD.pxw-1-x)+y*PD.pxw]=255;
      }
    }
  },
  //expand the pixels of a certain color
  Highlight: function(x,y,r){
    let c=this.pxls[x+y*this.pxw];
    if(c!=255){
    for(let dx=-1*r; dx<=r; dx++){
      for(let dy=-1*r; dy<=r; dy++){
        this.pxls[x+dx+(y+dy)*this.pxw]=c;
      }
    }
    }
  },
  //count the connections of a point
  Connections: function(x,y){
    let c=this.pxls[x+y*this.pxw];
    let conn={
      tot:{
        b:[],
        w:[],
      },
      dir:{
        b: [],
        w: [],
      }
    }
    for(let a=0; a<2*Math.PI; a+=0.7854){
      if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]==c){
        conn.tot.b.push({X:x+Math.round(Math.cos(a)), Y:y+Math.round(Math.sin(a))});
      }else if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=c
      && this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=this.Checked){
        conn.tot.w.push({X:x+Math.round(Math.cos(a)), Y:y+Math.round(Math.sin(a))});
      }
    }
    for(let a=0; a<2*Math.PI; a+=1.571){
      if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]==c){
        conn.dir.b.push({X:x+Math.round(Math.cos(a)), Y:y+Math.round(Math.sin(a))});
      }else if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=c
      && this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=this.Checked){
        conn.dir.w.push({X:x+Math.round(Math.cos(a)), Y:y+Math.round(Math.sin(a))});
      }
    }
    return conn;
  },
  //returns the grayscale value of the nearest non white and non notc pixel
  ClosestColor: function(ox,oy,notc){
    let x=-1;
    let y=-1;
    let c=255;
    let found=false;

    for(let r=1; r<300; r+=0.9){
      for(let a=0; a<2*Math.PI; a+=0.9/r){
        x=ox+Math.round(Math.cos(a)*r);
        y=oy+Math.round(Math.sin(a)*r);
        //search not white and not c, and defined
        if(this.pxls[x+y*this.pxw]!=255 && this.pxls[x+y*this.pxw]!=notc
           && this.pxls[x+y*this.pxw]){
          c=this.pxls[x+y*this.pxw];
          found=true;
        }
      }
      if(found){break;}
    }
    return c;
  },

  //return whether the given point is on an undiscovered border
  IsBorder: function(x,y,c){
    let is=false;
    if(this.pxls[x+y*this.pxw]==c){
      //if any neighbour pixel is white
      for(let a=0; a<2*Math.PI; a+=0.7853){
        if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=c
        && this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=this.Checked){
          is=true;
        }
      }
    }
    return is;
  },
  //return the vector that points outside the border, rotated +90deg
  BorderVect: function(x,y,c){
    //to be sure, prepare a placeholder vector in case the operation goes wrong
    let v={ X:1, Y:0}
    let bord={
      X:[],
      Y:[],
    }

    if(this.IsBorder(x,y,c)){
      //find every different color neighbour pixel
      for(let a=0; a<2*Math.PI; a+=0.7853){
        if(this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=c
        && this.pxls[x+Math.round(Math.cos(a))+(y+Math.round(Math.sin(a)))*this.pxw]!=this.Checked){
          bord.X.push(x+Math.round(Math.cos(a)));
          bord.Y.push(y+Math.round(Math.sin(a)));
        }
      }
      let xavg=0; let yavg=0;
      for(let i=0; i<bord.X.length; i++){
        xavg+=bord.X[i]/bord.X.length;
        yavg+=bord.Y[i]/bord.X.length;
      }
      xavg=Math.round(xavg); yavg=Math.round(yavg);
      //rotate the white vector 90deg
      v.X=-1*(yavg-y);
      v.Y=(xavg-x);
    }

    return v;
  },
  //given a point and an initial vector, find the best neighbour border point
  //  a border is always navigated clockwise, so search with anticlockwise anglestep
  NextBorderPoint: function(ox,oy,vdirx,vdiry,c){

    let vin={
      X:[],
      Y:[],
    };
    let best=0;

    //the starting attributes are set with the given vector
    let a=0;
    while(a<2*Math.PI){
      let x=ox+Math.cos(a);
      let y=oy+Math.sin(a);
      if(this.IsBorder(Math.round(x),Math.round(y),c)){
        vin.X.push(x-ox);
        vin.Y.push(y-oy);
      }
      //2PI/4, to check every neighbour pixel
      a+=1.571;
    }
    //give a second chance to search for some next border points, including the checked
    if(vin.X.length==0){
      a=0;
      while(a<2*Math.PI){
        let x=ox+Math.cos(a);
        let y=oy+Math.sin(a);
        if(this.pxls[Math.round(x)+Math.round(y)*this.pxw]==this.Checked){
          vin.X.push(x-ox);
          vin.Y.push(y-oy);
        }
        a+=1.571;
      }
    }

    let point={
      X:-1,
      Y:-1,
    }
    if(vin.X.length>0){
      for(let i=0; i<vin.X.length; i++){
        if(vdirx*vin.X[i]+vdiry*vin.Y[i]>vdirx*vin.X[best]+vdiry*vin.Y[best]){
          best=i;
        }
      }
      point.X=ox+Math.round(vin.X[best]);
      point.Y=oy+Math.round(vin.Y[best]);
    }

//alternative method
/*
    let v={
      X: -1*Math.round(vdirx/Math.sqrt(vdirx*vdirx+vdiry*vdiry+0.01)),
      Y: -1*Math.round(vdiry/Math.sqrt(vdirx*vdirx+vdiry*vdiry+0.01)),
    };

    let point={
      X:-1,
      Y:-1,
    }

    let safe=0;
    while(safe<8 && point.X==-1){
      safe++;

      //rotate by +45deg
      let x=v.X;
      v.X=Math.round(0.707*x-0.707*v.Y);
      v.Y=Math.round(0.707*x+0.707*v.Y);
      if((v.X==0 || v.Y==0) && this.IsBorder(ox+v.X,oy+v.Y,c)){
        point.X=ox+v.X;
        point.Y=oy+v.Y;
      }
    }
    if(point.X==-1){
      safe=0;
      while(safe<8 && point.X==-1){
        safe++;

        //rotate by +45deg
        let x=v.X;
        v.X=Math.round(0.707*v.X-0.707*v.Y);
        v.Y=Math.round(0.707*x+0.707*v.Y);
        if(this.pxls[ox+v.X+(oy+v.Y)*this.pxw]==this.Checked){
          point.X=ox+v.X;
          point.Y=oy+v.Y;
        }
      }
    }
*/

    return point;
  },

  //given a point, find the closest point that is part of an undiscovered border
  ClosestBorder: function(ox,oy){
    let c=this.pxls[ox+oy*this.pxw];

    let point={
      X:-1,
      Y:-1,
    }
    //variables needed later
    let r=1;
    let x=-1;
    let y=-1;
    let found=false;

    let safe=0;
    while(safe<800){
      safe++;

      for(let a=0; a<2*Math.PI; a+=0.6/r){
        x=ox+Math.round(Math.cos(a)*r);
        y=oy+Math.round(Math.sin(a)*r);
        if(this.IsBorder(x,y,c)){
          found=true;
          point.X=x;
          point.Y=y;
        }
      }
      //if found a point, break the while loop
      if(found){ break; }
      //check a bigger radius
      r+=0.6;
    }
    return point;
  },
  //given a start and final point, color the border that connects them
  ColorBorder: function(ox,oy,fx,fy,c,fillc){
    let curr={
      X:ox,
      Y:oy,
    }
    //with this value for prev, the first vector ill point toward the final point
    let prev={
      X:2*ox-fx,
      Y:2*oy-fy,
    }

    let safe=0;
    while(safe<10000 && curr.X!=-1 && (curr.X!=fx || curr.Y!=fy)){
      safe++;

      this.pxls[curr.X+curr.Y*this.pxw]=fillc;

      let p=this.NextBorderPoint(curr.X,curr.Y,curr.X-prev.X,curr.Y-prev.Y,c);
      prev.X=curr.X; prev.Y=curr.Y;
      curr.X=p.X; curr.Y=p.Y;
    }
  },
  //given start point, find the array of the pixels that form the border path
  BorderPixelPath: function(ox,oy,vdirx,vdiry,c,trace){
    let path={
      X:[],
      Y:[],
    }
    let curr={
      X:ox,
      Y:oy,
    }
    //with this value for prev, the first vector will point toward vdir
    let prev={
      X:ox-vdirx,
      Y:oy-vdiry,
    }

    path.X.push(curr.X);
    path.Y.push(curr.Y);
    this.pxls[curr.X+curr.Y*this.pxw]=this.Checked;

    let p=this.NextBorderPoint(curr.X,curr.Y,curr.X-prev.X,curr.Y-prev.Y,c);
    prev.X=curr.X; prev.Y=curr.Y;
    curr.X=p.X; curr.Y=p.Y;

    let safe=0;
    while(safe<50000 && curr.X!=-1 && (curr.X!=ox || curr.Y!=oy)){
      safe++;

      path.X.push(curr.X);
      path.Y.push(curr.Y);

      this.pxls[curr.X+curr.Y*this.pxw]=this.Checked;

      let p=this.NextBorderPoint(curr.X,curr.Y,curr.X-prev.X,curr.Y-prev.Y,c);
      prev.X=curr.X; prev.Y=curr.Y;
      curr.X=p.X; curr.Y=p.Y;
    }

    //if trace is true, leave the pixels checked, otherwie restore them to c
    if(!trace){
      for(let i=0; i<path.X.length; i++){
        this.pxls[path.X[i]+path.Y[i]*this.pxw]=c;
      }
    }

    return path;
  },

  //every how many pixels, a new point along the borderpixelpath should be created
  PathDstep: 6,
  //given any starting point, find the array of points along its "closest" edge
  DiscoverPath: function(ox,oy,trace){
    let c=this.pxls[ox+oy*this.pxw];

    let path={
      X:[],
      Y:[],
    }

    if(c!=255 && c!=this.Checked){
    let v=this.BorderVect(ox,oy,c);
    p=this.BorderPixelPath(ox,oy,v.X,v.Y,c,trace);

    let d=10000;
    for(let i=0; i<p.X.length; i++){
      //if enough distance has passed since the last point, add a new point
      if(d>this.PathDstep){
        d=0;
        path.X.push(p.X[i]);
        path.Y.push(p.Y[i]);
      }
      d++;
    }
    //if the process has succeded there shoul be more than two points
    if(path.X.length<3){
      path.X=[];
      path.Y=[];
    }
    }
    return path;
  },
  //given any starting point, find every path that defines a shape
  DiscoverShape: function(ox,oy){
    let ref=ox+oy*this.pxw;
    let c=this.pxls[ref];

    //the paths array is classified in ext and int
    let shape={
      c: c,//the color of the shape
      ext: {},//the external path, there is only one
      int: [],//potential internal paths that define holes in the shape
    }
    let first=true;

    let check=true;
    let safe=0;
    while(safe<10 && check){
      safe++;
      check=false;

      for(let i=0; i<this.blobpxls[ref].X.length; i++){
        if(this.IsBorder(this.blobpxls[ref].X[i],this.blobpxls[ref].Y[i],c)){
          let p=this.DiscoverPath(this.blobpxls[ref].X[i],this.blobpxls[ref].Y[i],true);
          if(first){
            shape.ext={X:p.X, Y:p.Y};
            first=false;
          }
          else{
            shape.int.push({X:p.X, Y:p.Y});
          }
          this.UpdateBlobPxls();
          i=Infinity;
          check=true;
        }
      }
    }

    //restore the checked pixels to the original color
    for(let i=0; i<this.pxls.length; i++){
      if(this.pxls[i]==this.Checked){
        this.pxls[i]=c;
      }
    }

    return shape;
  },

  //array that for every pixel, holds all the pixels of the corresponding blob
  blobpxls:[],
  //update the array that holds the blob area for each pixel
  UpdateBlobPxls: function(){
    for(let i=0; i<this.pxls.length; i++){
      this.blobpxls[i]={X:[],Y:[]};
    }
    //array to mark which pixels have been counted, checked=1
    let pxlqueue=[];
    for(let i=0; i<this.pxls.length; i++){
      pxlqueue[i]=0;
    }

    //go through all the pixels
    for(let x=0; x<this.pxw; x++){
      for(let y=0; y<this.pxh; y++){
      if(pxlqueue[x+y*this.pxw]==0){

          let c=this.pxls[x+y*this.pxw];
          //all the points of the same color part of the blob
          let points={
            X:[],
            Y:[],
          }
          //the temporary queue of points to check
          let queue={
            X:[],
            Y:[],
          }

          //start by adding the first point to the queue
          queue.X.push(x); queue.Y.push(y);
          //now branch out of the first point, into every other same colored point
          let safe=0;
          while(safe<500000 && queue.X.length>0){
            safe++;

            if(this.pxls[queue.X[0]+queue.Y[0]*this.pxw]==c){
              points.X.push(queue.X[0]);
              points.Y.push(queue.Y[0]);
              //temporeraly modify the pixel array, to mark the checked points with -1
              this.pxls[queue.X[0]+queue.Y[0]*this.pxw]=-1;
              if(this.pxls[queue.X[0]+1+queue.Y[0]*this.pxw]==c){
                queue.X.push(queue.X[0]+1); queue.Y.push(queue.Y[0]);
              }
              if(this.pxls[queue.X[0]-1+queue.Y[0]*this.pxw]==c){
                queue.X.push(queue.X[0]-1); queue.Y.push(queue.Y[0]);
              }
              if(this.pxls[queue.X[0]+(queue.Y[0]+1)*this.pxw]==c){
                queue.X.push(queue.X[0]); queue.Y.push(queue.Y[0]+1);
              }
              if(this.pxls[queue.X[0]+(queue.Y[0]-1)*this.pxw]==c){
                queue.X.push(queue.X[0]); queue.Y.push(queue.Y[0]-1);
              }
            }
            //remove the point from the queue
            queue.X.shift();
            queue.Y.shift();
          }

          //restore the original pxls array and calculate the blobpxls array
          for(let i=0; i<points.X.length; i++){
            this.pxls[points.X[i]+points.Y[i]*this.pxw]=c;
            this.blobpxls[points.X[i]+points.Y[i]*this.pxw].X=points.X;
            this.blobpxls[points.X[i]+points.Y[i]*this.pxw].Y=points.Y;
            pxlqueue[points.X[i]+points.Y[i]*this.pxw]=1;
          }

        }
      }
    }

  },
  //Color a blob
  ColorBlob: function(x,y,c){
    let ref=x+y*this.pxw;
    for(let i=0; i<this.blobpxls[ref].X.length; i++){
      this.pxls[this.blobpxls[ref].X[i]+this.blobpxls[ref].Y[i]*this.pxw]=c;
    }
  },
  //make blob bigger by 1 pixel
  WidenBlob: function(x,y){
    let ref=x+y*this.pxw;
    let c=this.pxls[ref];
    console.log(ref,c);
    //color the 4 pixels around x,y, if they are not white
    for(let i=0; i<this.blobpxls[ref].X.length; i++){
      if(this.pxls[this.blobpxls[ref].X[i]+1+this.blobpxls[ref].Y[i]*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]+1+this.blobpxls[ref].Y[i]*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]-1+this.blobpxls[ref].Y[i]*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]-1+this.blobpxls[ref].Y[i]*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]+(this.blobpxls[ref].Y[i]+1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]+(this.blobpxls[ref].Y[i]+1)*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]+(this.blobpxls[ref].Y[i]-1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]+(this.blobpxls[ref].Y[i]-1)*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]+1+(this.blobpxls[ref].Y[i]+1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]+1+(this.blobpxls[ref].Y[i]+1)*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]-1+(this.blobpxls[ref].Y[i]+1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]-1+(this.blobpxls[ref].Y[i]+1)*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]+1+(this.blobpxls[ref].Y[i]-1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]+1+(this.blobpxls[ref].Y[i]-1)*this.pxw]=c;}
      if(this.pxls[this.blobpxls[ref].X[i]-1+(this.blobpxls[ref].Y[i]-1)*this.pxw]!=255){
        this.pxls[this.blobpxls[ref].X[i]-1+(this.blobpxls[ref].Y[i]-1)*this.pxw]=c;}
    }
  },
}
