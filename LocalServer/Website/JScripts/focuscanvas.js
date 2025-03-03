/*
int this file are present the functions for anything rgarding the size and place
of a main-canvas of a "workstation" page

SetCanvasSize is the first comand called in the setup of the canvas, after
comes the creation of the actual canvas with (p.canvaswidth,p.canvasheight)

setcanvassize is required for the MoveJoystickCanvas because it sets the global
variable MainCanvasWidth

FocusCanvas and CartesianReferece are the last comand called in the draw of the canvas,
they require that MoveJoystickCanvas is setup
because they use the Zoom,FocusX,FocusY,ShowCartesianReferece global variables

*/

//placeholder value
var MainCanvasWidth = window.innerWidth*0.8;


function SetCanvasSize(ctx){
  ctx.canvaswidth= Math.round(window.innerWidth*0.8);
  ctx.canvasheight= Math.round(ctx.canvaswidth*0.70707);
  if(window.innerHeight*0.9<ctx.canvasheight){
    ctx.canvasheight= Math.round(window.innerHeight*0.9);
    ctx.canvaswidth= Math.round(ctx.canvasheight*1.4142+1);
  }
  MainCanvasWidth=ctx.canvaswidth;
  ctx.Scale=(ctx.canvaswidth/297+ctx.canvasheight/210)/2;
  ctx.dxWindowCanvas=(window.innerWidth-ctx.canvaswidth)/2;
  ctx.dyWindowCanvas=(window.innerHeight-ctx.canvasheight)/2;
  console.log("clnt/MainCanvas dimensions: "+"  ("+ctx.dxWindowCanvas+","+ctx.dyWindowCanvas+") "
              +ctx.canvaswidth+"x"+ctx.canvasheight+"   Scale: "+ctx.Scale);
}
function FocusCanvas(ctx, Fx, Fy, Z){
  //focus point x,y is the offset from the center: [-297/2;-210/2]->[297/2;210/2]
  ctx.canvasX=Math.round(-Fx*ctx.Scale*Z+ctx.dxWindowCanvas-(ctx.canvaswidth*Z-ctx.canvaswidth)/2);
  ctx.canvasY=Math.round(-Fy*ctx.Scale*Z+ctx.dyWindowCanvas-(ctx.canvasheight*Z-ctx.canvasheight)/2);
  $(".main-canvas").css("left",ctx.canvasX+"px");
  $(".main-canvas").css("top",ctx.canvasY+"px");
  $(".main-canvas").css("width",Math.round(ctx.canvaswidth*Z)+"px");
  $(".main-canvas").css("height",Math.round(ctx.canvasheight*Z)+"px");
}
function CartesianReference(ctx, Fx, Fy, Z){
  //theese values have been carefully tweaked to ensure a nice layout, so
  //there is no particular formula behind them
  ctx.stroke(0); ctx.fill(0); ctx.textSize(17/Z+0.2*Z);
  ctx.line(0, (210/2+Fy)*ctx.Scale, (297/2+Fx)*ctx.Scale+15/Z, (210/2+Fy)*ctx.Scale);//focus point X line
  ctx.line((297/2+Fx)*ctx.Scale, 0, (297/2+Fx)*ctx.Scale, (210/2+Fy)*ctx.Scale+15/Z);//focus point Y line
  ctx.line((297/2+Fx)*ctx.Scale+30/Z,(210/2+Fy)*ctx.Scale-80/Z, (297/2+Fx)*ctx.Scale+130/Z,(210/2+Fy)*ctx.Scale-80/Z);
  ctx.line((297/2+Fx)*ctx.Scale+30/Z,(210/2+Fy)*ctx.Scale-95/Z,(297/2+Fx)*ctx.Scale+30/Z,(210/2+Fy)*ctx.Scale-65/Z);
  ctx.line((297/2+Fx)*ctx.Scale+130/Z,(210/2+Fy)*ctx.Scale-95/Z,(297/2+Fx)*ctx.Scale+130/Z,(210/2+Fy)*ctx.Scale-65/Z);
  ctx.noStroke();
  ctx.textAlign(ctx.CENTER,ctx.TOP);
  ctx.text(Math.round(Fx*10)/10, (297/2+Fx)*ctx.Scale,(210/2+Fy)*ctx.Scale+18/Z);
  ctx.text(Math.round(100/ctx.Scale/Z*10)/10+"mm",(297/2+Fx)*ctx.Scale+80/Z,(210/2+Fy)*ctx.Scale-75/Z)
  ctx.textAlign(ctx.LEFT,ctx.CENTER);
  ctx.text(Math.round(FocusY*10)/10, (297/2+Fx)*ctx.Scale+25/Z,(210/2+Fy)*ctx.Scale);

}
