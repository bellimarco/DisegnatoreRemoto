/*
everything related to the navigation (animation, style) is set in this file
and in NavStyle.css

to select css of every nav and everything iside, select .main-nav-div
you can see the hierarchy and the structure better in Mockup.html

ultimatly what controls the navs is only the togglenav function,
the other functions defined here are only used by it, and calling them might
break the Sync

every "workstation" page calls in the setup:
//navsettings.js
setupnavsettings(5,1,p.canvaswidth);
setnavfontsize(25,40,300,1000);

the global variables created by this file should be cleaned up and put in a
single object, like "NavController"
*/



//array that holds the string names of the navs
var navLeft=[]; var navRight=[];
var navexpandLeft=[]; var navexpandRight=[];
//array that holds boolean is expanded
var navIsExpandedLeft=[]; var navIsExpandedRight=[];
var navMainIsExpandedLeft=false; var navMainIsExpandedRight=false;

var navAmountLeft=0; var navAmountRight=0;

var navWidth;
var navCloseOffset; //left offset when nav is closed(px)

var navexpandHeightStep = 50;  //the height of nav-expand button(px)

function setupnavsettings(){

  setnavfontsize();

  //scale with the canvas width the properties of the navs
  navCloseOffset = MainCanvasWidth*0.24;
  navWidth = (window.innerWidth-MainCanvasWidth)/2+MainCanvasWidth*0.14;

  navAmountLeft=document.getElementsByClassName("left-nav-expand-div")[0].childElementCount;
  navAmountRight=document.getElementsByClassName("right-nav-expand-div")[0].childElementCount;

  //nav and nav-div have the same width cause they overlap
  //nav is the element moving, nav div is still during navtoggle
  //navdiv only moves inside(relative to) main-nav-div
  $(".nav").css("width", navWidth+"px");
  $(".nav-div").css("width", navWidth+"px");

  //i have to set an offsett bottom here, because height:100% in CSS
  //for some reason works in desktop, but not on mobile
  $(".left-nav-expand-div").css("bottom",(parseInt($(".left-main-nav-div").css("height"),10)-navAmountLeft*navexpandHeightStep)+"px");
  $(".right-nav-expand-div").css("bottom",(parseInt($(".right-main-nav-div").css("height"),10)-navAmountRight*navexpandHeightStep)+"px");

  //in case there are too many buttons, and the just float randomly
  $(".left-nav").css("minHeight",navAmountLeft*navexpandHeightStep+"px");
  $(".right-nav").css("minHeight",navAmountRight*navexpandHeightStep+"px");

  let wordleft = "left";
  let wordright = "right";
  let wordnav = "-nav";
  let wordnavexpand="-nav-expand";
  let temp=0;

  //set the names
  for(let i=1; i<navAmountLeft+1; i++){
    navIsExpandedLeft[i]=false;
    navLeft[i]=[wordleft, i, wordnav].join("");
    navexpandLeft[i]=[wordleft, i, wordnavexpand].join("");}
  for(let i=1; i<navAmountRight+1; i++){
    navIsExpandedRight[i]=false;
    navRight[i]=[wordright, i, wordnav].join("");
    navexpandRight[i]=[wordright, i, wordnavexpand].join("");}

  //icons of the common buttons
  $("#"+navexpandLeft[1]).css("background-image",'url("/images/icon-info.png")');
  $("#"+navexpandLeft[2]).css("background-image",'url("/images/icon-finished.png")');
  $("#"+navexpandLeft[3]).css("background-image",'url("/images/icon-loaddoc.png")');
  $("#"+navexpandLeft[4]).css("background-image",'url("/images/icon-move.png")');
  $("#"+navexpandLeft[5]).css("background-image",'url("/images/icon-settings.png")');
  console.log("clnt/nav settings setup completed?");



  //link the navexpand buttons
  for(let i=1; i<navAmountLeft+1;i++){
      $("#"+navexpandLeft[i]).click(()=>navtoggle(i,true));
  }
  for(let i=1; i<navAmountRight+1;i++){
      $("#"+navexpandRight[i]).click(()=>navtoggle(i,false));
  }
  console.log("clnt/linked nav expand buttons");
}//setupnavsettings

//OPEN CLOSE
function navopen(i, left){
  if(left){
  navIsExpandedLeft[i]=true;
  $("#"+navLeft[i]+" .nav-active").css({"pointer-events":"auto"});
  $("#"+navLeft[i]).css({"left":"0","z-index":9});
  $("#"+navexpandLeft[i]).css("background-color","rgba(200,200,200,0.6)");
  $("#"+navexpandLeft[i]).css("border","1px solid black");}
  else{
  navIsExpandedRight[i]=true;
  $("#"+navRight[i]+" .nav-active").css({"pointer-events":"auto"});
  $("#"+navRight[i]).css({"right":"0","z-index":9});
  $("#"+navexpandRight[i]).css("background-color","rgba(200,200,200,0.6)");
  $("#"+navexpandRight[i]).css("border","1px solid black"); }
}
function navclose(i,left){
  if(left){
  navIsExpandedLeft[i]=false;
  $("#"+navLeft[i]+" .nav-active").css({"pointer-events":"none"});
  $("#"+navLeft[i]).css({"left":-navCloseOffset+"px","z-index":8});
  $("#"+navexpandLeft[i]).css("background-color","rgba(200,200,200,0.3)");
  $("#"+navexpandLeft[i]).css("border","0px solid black"); }
  else{
  navIsExpandedRight[i]=false;
  $("#"+navRight[i]+" .nav-active").css({"pointer-events":"none"});
  $("#"+navRight[i]).css({"right":-navCloseOffset+"px","z-index":8});
  $("#"+navexpandRight[i]).css("background-color","rgba(200,200,200,0.3)");
  $("#"+navexpandRight[i]).css("border","0px solid black");}
}

//TOGGLE MAIN NAV
//no need to toggle it, it is called appropriatly by navtoggle()
function navtogglemain(left){
  if(left){ if(!navMainIsExpandedLeft){ navMainIsExpandedLeft=true;
    $(".left-main-nav-div").css("left","0");}
            else{ navMainIsExpandedLeft=false;
    $(".left-main-nav-div").css("left",-navCloseOffset+"px");
  $("#"+navLeft[1]).css("z-index",9);}
  }
  else{ if(!navMainIsExpandedRight){ navMainIsExpandedRight=true;
    $(".right-main-nav-div").css("right","0");}
        else{ navMainIsExpandedRight=false;
    $(".right-main-nav-div").css("right",-navCloseOffset+"px");
    $("#"+navRight[1]).css("z-index",9);}
  }
}

//TOGGLE
function navtoggle(i, left){
  if(left){
    if(!navIsExpandedLeft[i]){
      navcloseall(true); navopen(i,true);
      if(!navMainIsExpandedLeft){ navtogglemain(true);} }
    else{ navclose(i,true); navtogglemain(true); }
    console.log("clnt/toggled to "+navIsExpandedLeft[i]+" nav: "+i+" left"); }
  else{
    if(!navIsExpandedRight[i]){
      navcloseall(false); navopen(i,false);
      if(!navMainIsExpandedRight){ navtogglemain(false);}}
    else{ navclose(i,false); navtogglemain(false);}
  console.log("clnt/toggled to "+navIsExpandedRight[i]+" nav: "+i+" right"); }
}

//ALL
function navopenall(left){
  if(left){
  for(let i=1; i<navAmountLeft+1; i++){
    navopen(i,true); }}
  else{
  for(let i=1; i<navAmountRight+1; i++){
    navopen(i,false); }}
}
function navcloseall(left){
  if(left){
  for(let i=1; i<navAmountLeft+1; i++){
    navclose(i,true); }}
  else{
  for(let i=1; i<navAmountRight+1; i++){
    navclose(i,false); }}
}


const minbasefont=20;
const maxbasefont=40;
const smallviewport=350;
const largeviewport=1050;
//set scalable font size in nav-content, based on concept CSS Lock
function setnavfontsize(){
  //the font scales with the height, based on the concept CSSlock
  var fontsize=minbasefont+(maxbasefont-minbasefont)*
      (window.innerHeight-smallviewport)/(largeviewport-smallviewport);
  $(".nav-content button").css("font-size", fontsize+"px");
  $(".nav-content").css("font-size", fontsize+"px");
  console.log("clnt/set nav font size");
}
