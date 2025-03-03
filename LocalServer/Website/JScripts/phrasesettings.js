/*
set of funcions that include any standard and common operation with phrases,
and the communication of theese with the server

every "workstation" page calls in the setup:
linkcontrolbuttons(p);
LoadPhrase(p, "CurrentPhrase");
UpdateGallery(p);

*/

var EraseButtonActive=false;
var SaveButtonActive=false;
var SendButtonActive=false;

function AddLetter(ctx){
  let data = {
    X: ctx.phrase[ctx.phrase.length-1].X,
    Y: ctx.phrase[ctx.phrase.length-1].Y,
    shape: ctx.phrase[ctx.phrase.length-1].shape,
    press: ctx.phrase[ctx.phrase.length-1].press,
    holes: ctx.phrase[ctx.phrase.length-1].holes,
  };
  ctx.httpPost("/AddLetterCurrent","txt",data,(res)=>console.log(res));
}
function DeleteLetter(ctx,i){
  ctx.httpGet("/DeleteLetterCurrent/"+i,(res)=>console.log(res));
}
function OverwriteLetter(ctx,i){
  let data = {
    X: ctx.phrase[i].X,
    Y: ctx.phrase[i].Y,
    shape: ctx.phrase[i].shape,
    press: ctx.phrase[i].press,
    holes: ctx.phrase[i].holes,
  };
  ctx.httpPost("/OverwriteLetterCurrent/"+i,"txt",data,(res)=>console.log(res));
}
function OverwritePhrase(ctx){
  let data={
    X: [],
    Y: [],
    shape: [],
    press: [],
    holes: [],
  };
  for(let i=0; i<ctx.phrase.length; i++){
    let data={
      X: [],
      Y: [],
      shape: ctx.phrase[i].shape,
      press: ctx.phrase[i].press,
      holes: [],
    };
    for(let j=0; j<ctx.phrase[i].X.length;j++){
      data.X[j]=ctx.phrase[i].X[j];
      data.Y[j]=ctx.phrase[i].Y[j];
    }
    for(let j=0; j<ctx.phrase[i].holes.length; j++){
      data.holes[j]={X:[],Y:[]};
      for(let k=0; k<ctx.phrase[i].holes[j].X.length; k++){
        data.holes[j].X[k]=ctx.phrase[i].holes[j].X[k];
        data.holes[j].Y[k]=ctx.phrase[i].holes[j].Y[k];
      }
    }
    ctx.httpPost("/OverwriteLetterCurrent/"+i,"txt",data,(res)=>console.log(res));
  }
}
function ErasePhrase(ctx){
  ctx.httpGet("/EraseCurrent",(res)=>console.log(res));
  ctx.phrase.splice(0,ctx.phrase.length);
  ctx.PhraseName="";
  $("#projectname-input").val("");
}
function EraseGalleryPhrase(ctx, name){
  ctx.httpGet("/EraseGallery/"+name,(res)=>console.log(res));
}
function SavePhrase(ctx, name){
  ctx.background(255);
  for(let i=0; i<ctx.phrase.length; i++){
    ctx.phrase[i].display(ctx);
  }
  ctx.PhraseName=name;
  let img=ctx.createImage(297,210);
  img=ctx.get();
  let data={
    preview:img.canvas.toDataURL("image/jpeg",0.01)
  };
  ctx.httpPost("/SaveCurrent/"+name,"txt",data,(res)=>console.log(res));
  UpdateMiniGallery(ctx);
}
function LoadPhrase(ctx, name){
  ctx.phrase=[];
  ctx.httpGet("/GalleryPhrase/"+name, (res)=>{
    let a=JSON.parse(res);
    for(let i=0; i<a.X.length; i++){
      ctx.phrase.push(new letter(a.shape[i],a.press[i]));
      for(let j=0; j<a.X[i].length; j++){
        ctx.phrase[i].write(a.X[i][j],a.Y[i][j]);
      }
      for(let j=0; j<a.holes[i].length; j++){
        ctx.phrase[i].holes[j]={X:[], Y:[]};
        for(let k=0; k<a.holes[i][j].X.length; k++){
          ctx.phrase[i].holes[j].X[k]=a.holes[i][j].X[k];
          ctx.phrase[i].holes[j].Y[k]=a.holes[i][j].Y[k];
        }
      }
      ctx.phrase[i].finished = true;
    }
    $("#projectname-input").val(a.name);
    ctx.PhraseName=a.name;
    ctx.pletters=ctx.phrase.length;
    if(ctx.phrase.length>0){ EraseButtonActivate(); SendButtonActivate();}
    console.log("clnt/loaded phrase: "+ctx.PhraseName);
  });
}

function SendPhrase(ctx){
  ctx.httpGet("/TransmitCurrent",(res)=>console.log(res));
}

function ClosestPoint(ctx){
  let d=800;
  let I=-1; let J=-1;
  let td=800;
  for(let i=0; i<ctx.phrase.length; i++){
    for(let j=0; j<ctx.phrase[i].points; j++){
      td=Math.pow(ctx.mouseX/ctx.Scale-ctx.phrase[i].X[j],2)+
        Math.pow(ctx.mouseY/ctx.Scale-ctx.phrase[i].Y[j],2);
      if(td<d){
        d=td;
        J=j;
        I=i;
      }
    }
  }
  let data={
    letter: I,
    point: J,
  };
  console.log("clnt/point chosen: "+data.letter+","+data.point);
  return data;
}


//the buttons are deactivated when they are clicked (or other special cases)
function Linkcontrolbuttons(ctx){
  $("#projectname-input").change(function(){
    if($("#projectname-input").val().length>0){
      SavePhrase(ctx,$("#projectname-input").val());
      SaveButtonDeactivate(); }
  });
  $("#projectname-input").on("input", function(){
    if($("#projectname-input").val().length>0){
    if(ctx.PhraseName!=$("#projectname-input").val()){
      SaveButtonActivate();
      if(ctx.phrase.length>0){SendButtonActivate();}}
    else{
      SaveButtonDeactivate();}
    }else{
      SaveButtonDeactivate();
      SendButtonDeactivate();
    }
  });
  $("#save-button").click(function(){
    if(SaveButtonActive){
      SavePhrase(ctx,$("#projectname-input").val());
      SaveButtonDeactivate(); }
  });
  $("#erase-button").click(function(){
    if(EraseButtonActive){
      ErasePhrase(ctx);
      EraseButtonDeactivate();
      SendButtonDeactivate(); }
  });
  $("#send-button").click(function(){
    if(SendButtonActive){
      SavePhrase(ctx, $("#projectname-input").val());
      SaveButtonDeactivate();
      SendPhrase(ctx);
      SendButtonDeactivate(); }
  });
}
function ResetControlButtons(){
  SaveButtonDeactivate();
  EraseButtonDeactivate();
  SendButtonDeactivate();
}

function SaveButtonDeactivate(){SaveButtonActive=false;
    $("#save-button").css({"cursor":"not-allowed","background-color":"rgba(130,255,0,0.25)","border":"0px"});}
function SaveButtonActivate(){SaveButtonActive=true;
    $("#save-button").css({"cursor":"pointer","background-color":"rgba(130,255,0,0.8)","border":"1px"});}
function EraseButtonDeactivate(){EraseButtonActive=false;
    $("#erase-button").css({"cursor":"not-allowed","background-color":"rgba(255,0,0,0.25)","border":"0px"});}
function EraseButtonActivate(){EraseButtonActive=true;
    $("#erase-button").css({"cursor":"pointer","background-color":"rgba(255,0,0,0.8)","border":"1px"});}
function SendButtonDeactivate(){SendButtonActive=false;
    $("#send-button").css({"cursor":"not-allowed","background-color":"rgba(100,180,255,0.25)","border":"0px"});}
function SendButtonActivate(){SendButtonActive=true;
    $("#send-button").css({"cursor":"pointer","background-color":"rgba(100,180,255,0.8)","border":"1px"});}

//MINI GALLERY SETUP
//it needs the main context so ian bind the buttons to the right canvas
function UpdateMiniGallery(ctx){
//erase the current gallery
$('.gallery').empty();
//adds to the gallery div, the cansvaspreview-div for each phrase
ctx.httpGet("/GalleryPhrasesList",(res)=>{
  //sort for the most recent
  var arr=JSON.parse(res);
  arr.sort((a,b)=>{return b.timeint-a.timeint; });
  arr.forEach((s)=>{
    //add a canvaspreview-div for each phrase
    $('.gallery').append('<div class="canvaspreview-div"</div>');
    $('.gallery .canvaspreview-div:last-child').append('<button id="'+s.name+'-preview"></button>');
    $('#'+s.name+'-preview').css("height",parseInt($('#'+s.name+'-preview').css("width"))*0.7071+"px");
    $('.gallery .canvaspreview-div:last-child').append('<p>'+s.name+'</p>');
    $('.gallery .canvaspreview-div:last-child').append('<p>'+s.time+'</p>');
    $('#'+s.name+'-preview').click(()=>{LoadPhrase(ctx, s.name); $("#projectname-input").val(s.name);});
    //$('#'+s.name+'-preview').css("background-image","url('http://192.168.1.30:8080/GalleryPreview/"+s.name+"')");
    ctx.httpGet("/GalleryPreview/"+s.name,(res2)=>{
      $('#'+s.name+'-preview').css("background-image","url("+JSON.parse(res2).preview+")");
    });
  });
});
}
