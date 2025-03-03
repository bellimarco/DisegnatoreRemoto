class letter{

  constructor(shape,press){
    this.finished=false; //true means the letter is confirmed and saved
    this.press=press;
    this.shape=shape;
    this.X = [];
    this.Y = [];
    this.LastX = 0; this.LastY = 0; //needed for the software, to quickly access the last point
    this.points = 0;

    this.holes=[];//an array of paths that define the holes, if the letter is a shape
  }

write(x,y){
  this.X.push(x); this.Y.push(y);
  this.LastX = x; this.LastY = y;
  this.points++;
}

//display all the points of this letter,
display(ctx,opacity,colork){
  if(!this.shape){
    ctx.stroke(255*(1-this.press)*colork,opacity);
  if(this.points>0){
    ctx.fill(255*(1-this.press)*colork,opacity);
    if(this.points==1){
      ctx.circle(this.X[0]*ctx.Scale,this.Y[0]*ctx.Scale,4);
    }
    else{
      ctx.circle(this.X[0]*ctx.Scale,this.Y[0]*ctx.Scale,3);
    }
    for(let i=1; i<this.points; i++){
      ctx.circle(this.X[i]*ctx.Scale,this.Y[i]*ctx.Scale,3);
      ctx.line(this.X[i-1]*ctx.Scale, this.Y[i-1]*ctx.Scale, this.X[i]*ctx.Scale, this.Y[i]*ctx.Scale);
    }
  }
  }
  else{
    ctx.noStroke();
    //create the exterior shape
    ctx.beginShape();
    for(let i=0; i<this.points; i++){
      ctx.vertex(this.X[i]*ctx.Scale, this.Y[i]*ctx.Scale);
    }
    //create the holes
    ctx.fill(255,0);
    for(let i=0; i<this.holes.length; i++){
      ctx.beginContour();
      for(let j=0; j<this.holes[i].X.length; j++){
        ctx.vertex(this.holes[i].X[j]*ctx.Scale, this.holes[i].Y[j]*ctx.Scale);
      }
      ctx.endContour(ctx.CLOSE);
    }
    ctx.fill(255*(1-this.press),opacity);
    ctx.endShape(ctx.CLOSE);
  }
}
// //display the points of the letter, but with some options
// displayColored(ctx, greenpoints, highlight, letter){
//
//   if(this.points>0){
//     ctx.stroke(0);
//     if(this.points==1){
//       if(greenpoints>0){ctx.fill(0,255,0,150);ctx.stroke(0,255,0,100);}
//       else{ctx.fill(255,0,0,150);ctx.stroke(255,0,0,100);}
//       ctx.circle(this.X[0]*ctx.Scale,this.Y[0]*ctx.Scale,5);
//     }
//     else{
//       if(greenpoints>0){ctx.fill(0,255,0,150);ctx.stroke(0,255,0,100);}
//       else{ctx.fill(255,0,0,150);ctx.stroke(255,0,0,100);}
//       ctx.circle(this.X[0]*ctx.Scale,this.Y[0]*ctx.Scale,3);
//     }
//     for(let i=1; i<this.points; i++){
//       if(i<greenpoints){
//         ctx.fill(0,255,0,150);
//         ctx.stroke(0,255,0,100);
//       }
//       else{
//         ctx.fill(highlight);ctx.stroke(highlight);
//       }
//       ctx.line(this.X[i-1]*ctx.Scale, this.Y[i-1]*ctx.Scale, this.X[i]*ctx.Scale, this.Y[i]*ctx.Scale);
//       ctx.circle(this.X[i]*ctx.Scale,this.Y[i]*ctx.Scale,3);
//     }
//     if(this.points>1){
//     if(greenpoints>this.points){ctx.fill(0,255,0,150);ctx.stroke(0,255,0,100);}
//     else{ctx.fill(255,0,0,150);ctx.stroke(255,0,0,100);
//       ctx.fill(highlight);ctx.stroke(highlight);}
//     ctx.circle(this.X[this.points-1]*ctx.Scale,this.Y[this.points-1]*ctx.Scale,3);
//     }
//     if(letter>=0){
//       ctx.fill(200,0,0);
//       ctx.text(letter, this.X[0]*ctx.Scale, this.Y[0]*ctx.Scale);
//     }
//   }
//
// }

}//class
