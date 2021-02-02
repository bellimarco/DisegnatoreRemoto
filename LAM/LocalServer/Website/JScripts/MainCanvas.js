/*
this is a template file for every "workstation" page,
see more info on the "PROJECT Guide"

this script just has to be included in the html, with the file that
defines the actual workmode(wich is located in /WebPages/"Mode"/"Mode"Mode.js)

in that file the 4 functions (specific to the mode) are defined in the
global namespace, and this template automatically searches for theese 4 functions
to execute in this code (ModeVariables(ctx),ModeSetup(ctx),ModeDraw(ctx),ModeFunctions(ctx)).
(the workmode is divided in 4 functions to make it  more tidy and clear)
*/

var MainCanvas = new p5((p)=>{

p.canvas;
//theese valuse will be scaled properly in setup
//X and Y in the phrase have placeholder=4
p.Scale = 4;  //pixels per mm

p.fps = 60;

//letters->phrase.size, phrase[0] is the first letter
p.phrase = [];
p.pletters = 0;
p.PhraseName="";

p.config={
  showphrase: true, //show the phrase in the main canvas
  showbefore: true, //draw the phrase before or after the ModeDraw function
  opacity: 255,  //8bit opacity value for p5 fill function
  colork: 1, //0-1 multiplier for color argument of p5 fill function
}

//---------------------------------------------------------------------------//
//put local variables here
ModeVariables(p);
//---------------------------------------------------------------------------//



p.setup=()=>{
  //FocusCanvas.js
  SetCanvasSize(p);

  //SETUP THE CANVAS AND THE SCALE
  p.canvas = p.createCanvas(p.canvaswidth,p.canvasheight);
  p.canvas.id("main-canvas");
  p.canvas.addClass("main-canvas");

  FocusCanvas(p, 0,0,1);

  //navsettings.js
  setupnavsettings();

  //phrasesettings.js
  Linkcontrolbuttons(p);
  ResetControlButtons();
  LoadPhrase(p, "CurrentPhrase");
  UpdateMiniGallery(p);


  p.frameRate(p.fps);

  setTimeout(()=>{
    navtoggle(1,true);
    navtoggle(1,false);
  }, 700);


  //disable touch movements events on the canvas
  document.getElementsByClassName('main-canvas')[0].addEventListener('touchstart', (e)=>{
    e.preventDefault();
  }, false);


  //-------------------------------------------------------------------------//
  //put setup code here
  ModeSetup(p);
  //-------------------------------------------------------------------------//



}//setup

p.draw=()=>{
  p.background(255);


  if(p.config.showphrase && p.config.showbefore){
    for(let i=0; i<p.phrase.length; i++){
      p.phrase[i].display(p,p.config.opacity,p.config.colork);
    }
  }


  //-------------------------------------------------------------------------//
  //put loop code here
  ModeDraw(p);
  //-------------------------------------------------------------------------//



  if(p.config.showphrase && p.config.showbefore==false){
    for(let i=0; i<p.phrase.length; i++){
      p.phrase[i].display(p,p.config.opacity,p.config.colork);
    }
  }


  //when the current phrase changes, reactivate the buttons
  //the phrase needs to change letters and be finished (to not count single point letters)
  if(p.pletters!=p.phrase.length){
  if((p.phrase.length==0 && p.pletters!=0) || (p.phrase.length>0 && p.phrase[p.phrase.length-1].finished)){
    if(p.phrase.length>0){
      EraseButtonActivate();
    }
    if($("#projectname-input").val().length>0){
      SaveButtonActivate();
      if(p.phrase.length>0){SendButtonActivate();}
    }
    p.pletters=p.phrase.length;
  }}

  //option in the move nav
  if(ShowCartesianReference){ CartesianReference(p,FocusX,FocusY,Zoom);}
  //global variables generated in MoveJoystick.js
  FocusCanvas(p, FocusX,FocusY,Zoom);


}//draw



//---------------------------------------------------------------------------//
//put local functions here
ModeFunctions(p);
//---------------------------------------------------------------------------//



},"body-div");//new p5 object
