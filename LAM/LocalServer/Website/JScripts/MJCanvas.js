/*
this is the canvas in the Move left nav, common to every "workstation" page

it has the purpose of setting the global variables below,
it requires that SetCanvasSize is setup because it requires the MainCanvasWidth global variable

this canvas is put inside #MJCanvasContainer (which is inside a nav-content)
the zoom slider is called #MJSlider

in the whole setup is used the jquery ready function, because before creating
the canvas, the nav needs to be setup so we can access the computed width
*/



//total focus offset from the center, this is the variable sent to focuscanvas()
var FocusX=0;
var FocusY=0;
var Zoom=1;

//option in the move nav to display cartesian reference on the main canvas
var ShowCartesianReference=false;

//MoveJoystickCanvas
var MJCanvas = new p5((p)=>{

p.canvas;
//placeholder
p.canvaswidth=100;
//variable to set right scale on the joystick
p.K=0.5;
//previous total focus
p.pFocusX=0;
p.pFocusY=0;
//focus offset component that gets added in each swipe
p.fx=0;
p.fy=0;
//where the mouse is pressed and the pivot point forms
p.PivotX=0;
p.PivotY=0;
//zoom is distributed with the (+-linear)function:
//[0;20]->z=20/(40-val)-----[21;100]->z=(val-11)/10
p.sliderval=20;
//temporery boolean to capture mouseddown events
p.t=false;

p.setup=()=>{
  $(document).ready(()=>{

  p.canvaswidth = parseInt($("#MJCanvasContainer").css("width"));
  p.canvas= p.createCanvas(p.canvaswidth, p.canvaswidth);
  p.canvas.id("MJCanvas");
  console.log("clnt/MoveJoystickCanvas size set: "+p.canvaswidth);

  p.frameRate(30);

  //disable touch movements events on the canvas
  document.getElementById('MJCanvas').addEventListener('touchstart', (e)=>{
    e.preventDefault();
  }, false);

  document.getElementById('MJCanvas').addEventListener('mousedown', ()=>p.t=true);
  document.getElementById('MJCanvas').addEventListener('touchstart', ()=>p.t=true);

  $("#CartesianReferenceButton").click(()=>{ShowCartesianReference=!ShowCartesianReference;})
  $("#ResetFocusButton").click(()=>{
    FocusX=0; FocusY=0; Zoom=1; $("#MJSlider").val(21);
  });

  });
  p.textAlign(p.CENTER, p.CENTER);
}
p.draw=()=>{

  p.clear();
  p.fill(220,120);p.textSize(18);
  p.circle(p.canvaswidth/2,p.canvaswidth/2,p.canvaswidth);

  if(p.t){p.t=false;
    if(p.dist(p.canvaswidth/2,p.canvaswidth/2,p.mouseX,p.mouseY)<p.canvaswidth/2+5){
    p.iscontrolling=true;
    p.PivotX=p.mouseX; p.PivotY=p.mouseY; }}

  p.sliderval=$("#MJSlider").val();
  if(p.sliderval<=20){  Zoom=20/(40-p.sliderval); }
  else{  Zoom=(p.sliderval-11)/10; }
  p.fill(0); p.noStroke();
  p.text(Math.round(Zoom*10)/10+"x",p.canvaswidth*3/4,p.canvaswidth/4);

  p.stroke(0);
  p.fill(220, 80);
  p.circle(p.canvaswidth/2,p.canvaswidth/2, p.canvaswidth);
  p.line(p.canvaswidth/2,0,p.canvaswidth/2,p.canvaswidth);
  p.line(0,p.canvaswidth/2,p.canvaswidth,p.canvaswidth/2);

  if(p.mouseIsPressed && p.dist(p.canvaswidth/2,p.canvaswidth/2,p.mouseX,p.mouseY)<p.canvaswidth/2+10 && p.iscontrolling){
    p.fx=(p.mouseX-p.PivotX)*p.K/Zoom;  p.fy=(p.mouseY-p.PivotY)*p.K/Zoom;
    p.fill(160,80);
    p.circle(p.PivotX,p.PivotY,p.canvaswidth/6);
    p.fill(200,80);
    p.circle(p.mouseX,p.mouseY, p.canvaswidth/6);
  }
  if(p.iscontrolling){ FocusX = p.pFocusX+p.fx; FocusY = p.pFocusY+p.fy; }

  //visual feedback of the zoom slider on the canvas
  p.fill(0);
  for(let i=0; i<=p.canvaswidth/2; i=i+p.canvaswidth/10*Zoom){
    for(let j=p.canvaswidth/100*Zoom; j<p.canvaswidth/10*Zoom; j=j+p.canvaswidth/100*Zoom){
      p.stroke(0,p.map(Zoom,1,9,0,255));
      p.line(j+i+p.canvaswidth/2, p.canvaswidth/2+10, j+i+p.canvaswidth/2, p.canvaswidth/2-10);
      p.line(p.canvaswidth/2+10, j+i+p.canvaswidth/2, p.canvaswidth/2-10, j+i+p.canvaswidth/2);
      p.line(-j-i+p.canvaswidth/2, p.canvaswidth/2+10, -j-i+p.canvaswidth/2, p.canvaswidth/2-10);
      p.line(p.canvaswidth/2+10, -j-i+p.canvaswidth/2, p.canvaswidth/2-10, -j-i+p.canvaswidth/2);
    }
    p.stroke(0);
    p.line(i+p.canvaswidth/2, p.canvaswidth/2+10, i+p.canvaswidth/2, p.canvaswidth/2-10);
    p.line(p.canvaswidth/2+10, i+p.canvaswidth/2, p.canvaswidth/2-10, i+p.canvaswidth/2);
    p.line(-i+p.canvaswidth/2, p.canvaswidth/2+10, -i+p.canvaswidth/2, p.canvaswidth/2-10);
    p.line(p.canvaswidth/2+10, -i+p.canvaswidth/2, p.canvaswidth/2-10, -i+p.canvaswidth/2);
  }
  p.line(p.canvaswidth/2, p.canvaswidth/2+p.canvaswidth/10, p.canvaswidth, p.canvaswidth/2+p.canvaswidth/10);//x meter
  p.fill(0); p.noStroke();
  p.text(Math.round(p.canvaswidth/2/MainCanvasWidth*297/Zoom*10)/10+"mm",p.canvaswidth*3/4, p.canvaswidth/2+p.canvaswidth/10+10);

}//draw

p.mouseReleased=()=>{
  p.iscontrolling=false;
  p.PivotX=0; p.PivotY=0;
  p.pFocusX=FocusX; p.pFocusY=FocusY;
}


}, 'MJCanvasContainer');
