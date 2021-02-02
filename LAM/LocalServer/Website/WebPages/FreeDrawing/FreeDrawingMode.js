function ModeVariables(p){

  //the page is in drawing mode
  p.isdrawing = false;
  //to capture mousedown event on the canvas using html,
  p.istracing=false;
  //complicate temp bool variable
  p.endedletter = false;
  //temporary boolean to capture doubleclick
  p.t=false;

  //if the letter is a shape
  p.shapeness=false;
  //how much is the pen wide
  p.sharpness=0;
  //how much the value for press for the next letter should be
  p.pressness=1;

  //the path of the shape letter being written
  p.ShapePath={
    X:[],
    Y:[],
  }
}
//---------------------------------------------------------------------------//
function ModeSetup(p){

  $("#draw-button").click(()=>{
    if(!p.isdrawing){
      p.isdrawing=true;
      $("#draw-button").html("ON");
      $("#draw-button").css("background-color","rgba(130,255,0,0.8)");
    }
    else{
      p.isdrawing=false;
      $("#draw-button").html("OFF");
      $("#draw-button").css("background-color","rgba(255,0,0,0.8)");
    }
  });
  $("#sharp-slider").on("input",()=>{
    if($("#sharp-slider").val()>0){
      p.shapeness=true;
      p.sharpness=$("#sharp-slider").val()/5;
    }
    else{
      p.shapeness=false;
      p.sharpness=0;
    }
    $("#sharpness").html("diametro: "+p.sharpness+"mm");
    $("#penpreview").css({"width":(p.sharpness+3)*2+"px","height":(p.sharpness+3)*2+"px"});
  });
  $("#press-slider").on("input",()=>{
    if($("#press-slider").val()>0){
      p.pressness=1-$("#press-slider").val()/100;
    }
    else{
      p.pressness=1;
    }
    $("#pressness").html("pressione: "+Math.round(p.pressness*100)+"%");
    $("#penpreview").css("opacity",p.pressness);
  });

  $('#main-canvas').on('mousedown',()=>{
    p.istracing=true;  //capture mousedown event

    setTimeout(()=>p.t=true,2); //double click algorithm
    setTimeout(()=>p.t=false,300);
    if(p.t && p.isdrawing){
      p.CreatePointLetter(); }  });
  $('#main-canvas').on('touchstart',()=>{
    p.istracing=true; //capture mousedown event

    setTimeout(()=>p.t=true,2); //double click algorithm
    setTimeout(()=>p.t=false,300);
    if(p.t && p.isdrawing){
      p.CreatePointLetter(); }  });

}
//---------------------------------------------------------------------------//
function ModeDraw(p){

  if(!p.onCanvas()){ p.EndLetter(); }

  if(p.mouseIsPressed && p.isdrawing && p.onCanvas() && p.istracing){
    //if EndLetter was executed(or lett=0), phrase.push and reset endedletter
    if(p.phrase.length==0){ p.phrase.push(new letter(p.shapeness,p.pressness)); p.endedletter=false;}
    if(p.phrase[p.phrase.length-1].finished){ p.phrase.push(new letter(p.shapeness,p.pressness)); p.endedletter=false;}

    if(p.phrase.length>0){
      //if its a normal path
      if(!p.shapeness){
        if(p.dist(p.phrase[p.phrase.length - 1].LastX, p.phrase[p.phrase.length - 1].LastY,
          p.mouseX/p.Scale, p.mouseY/p.Scale)>3){
            p.phrase[p.phrase.length - 1].write(p.mouseX/p.Scale, p.mouseY/p.Scale);
      }}
      else{
        //console.log("shapeness, ShapePath length: "+p.ShapePath.X.length);
        //console.log("dist: "+p.ShapePath.X[p.ShapePath.X.length - 1]+","+p.ShapePath.Y[p.ShapePath.X.length - 1]
        //  +"->"+p.mouseX/p.Scale, p.mouseY/p.Scale);
        if(p.ShapePath.X.length>0 && p.dist(p.ShapePath.X[p.ShapePath.X.length - 1],
        p.ShapePath.Y[p.ShapePath.X.length - 1],p.mouseX/p.Scale, p.mouseY/p.Scale)>4){
          p.ShapePath.X.push(p.mouseX/p.Scale);
          p.ShapePath.Y.push(p.mouseY/p.Scale);
          let shap=PathToShape(p,p.ShapePath,p.sharpness);
          p.phrase[p.phrase.length - 1].X=shap.X;
          p.phrase[p.phrase.length - 1].Y=shap.Y;
          p.phrase[p.phrase.length - 1].points=p.phrase[p.phrase.length - 1].X.length;
        }
        else if(p.ShapePath.X.length==0){
          p.ShapePath.X.push(p.mouseX/p.Scale);
          p.ShapePath.Y.push(p.mouseY/p.Scale);
          let shap=PathToShape(p,p.ShapePath,p.sharpness);
          p.phrase[p.phrase.length - 1].X=shap.X;
          p.phrase[p.phrase.length - 1].Y=shap.Y;
          p.phrase[p.phrase.length - 1].points=p.phrase[p.phrase.length - 1].X.length;
        }
      }
    }
  }


}
//---------------------------------------------------------------------------//
function ModeFunctions(p){

  p.mouseReleased = ()=>{
    //reset canvas click variable
    p.istracing=false;
    p.EndLetter();
  }

  //executed when mouse is released, or if exited canvas boundries
  //since !onCanvas is executed in loop, failsafe endedletter mechanism is needed
  p.EndLetter = ()=>{
    p.ShapePath.X=[];
    p.ShapePath.Y=[];
    if(p.isdrawing && !p.endedletter && p.phrase.length>0){
    p.endedletter=true;

    if(!p.phrase[p.phrase.length-1].shape && p.phrase[p.phrase.length-1].points<=2){
      p.phrase.pop();}
    else if(p.phrase[p.phrase.length-1].shape && p.phrase[p.phrase.length-1].points<=8){
      p.phrase.pop();}
    else{
      p.phrase[p.phrase.length-1].finished=true;
      AddLetter(p); }
    }
  }
  p.CreatePointLetter=()=>{
    p.phrase.push(new letter(p.shapeness,p.pressness));
    if(!p.shapeness){
      p.phrase[p.phrase.length-1].write(p.mouseX/p.Scale, p.mouseY/p.Scale);
    }else{
      p.ShapePath.X.push(p.mouseX/p.Scale);
      p.ShapePath.Y.push(p.mouseY/p.Scale);
      let shap=PathToShape(p,p.ShapePath,p.sharpness);
      p.phrase[p.phrase.length - 1].X=shap.X;
      p.phrase[p.phrase.length - 1].Y=shap.Y;
      p.phrase[p.phrase.length - 1].points=p.phrase[p.phrase.length - 1].X.length;
    }
    p.phrase[p.phrase.length-1].finished=true;
    AddLetter(p);
  }

  p.onCanvas = ()=>{//with a margin of 3 px for precaution
    if(p.mouseX>4 && p.mouseX<p.canvaswidth-3 && p.mouseY>3 && p.mouseY<p.canvasheight-4){
      return true; }
    else{ return false; }
  }

}
