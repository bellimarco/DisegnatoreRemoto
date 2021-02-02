
function ModeVariables(ctx){

  //wich editing mode is activated
  ctx.PhraseEditMode=false;
  ctx.LetterEditMode=true;//default
  ctx.PointEditMode=false;

  //if an object has been clicked, and it is now selected for editing
  ctx.Chosen=false;
  //wich point has been chosen
  ctx.LetterChosen=-1;
  ctx.PointChosen=-1;

  //history of every change, array of phrases
  ctx.EditPhrase=[];

  //joystick
  //focus offset component that gets added in each swipe
  ctx.fx=0;
  ctx.fy=0;
  //where the mouse is pressed and the pivot point forms
  ctx.PivotX=-1;
  ctx.PivotY=-1;
  ctx.PivotPressed=false;

  //info about the circle that surrounds the edited object
  ctx.ShowResizeGrid=false;
  ctx.ResizeX=[];
  ctx.ResizeY=[];
  ctx.ResizeR=[];
  ctx.ResizePhraseR=0;
  ctx.ResizePhraseX=-1;
  ctx.ResizePhraseY=-1;

  //if the last phrase in EditPhrase has been in someway modified,
  //  and so if we have to add a new pjhrase
  ctx.modified=false;
}
//---------------------------------------------------------------------------//
function ModeSetup(ctx){
  //nav expand icons
  $("#right1-nav-expand").css("background-image",'url("/images/icon-cursor.png")');
  $("#right2-nav-expand").css("background-image",'url("/images/icon-doc1.png")');

  //right1 nav buttons
  $("#erasegallery-button").click(()=>{
    if(confirm("Sei sicuro di voler cancellare: "+ctx.PhraseName)==true){
      EraseGalleryPhrase(ctx,ctx.PhraseName);
      ErasePhrase(ctx);
      UpdateMiniGallery(ctx);
    }
  });
  $("#rename-button").click(()=>{
    var inp = prompt("new name: ", "");
    let previous=ctx.PhraseName;
    if (inp != null && inp != ""){
      EraseGalleryPhrase(ctx,previous);
      SavePhrase(ctx,inp);
    }
  });
  $("#eraseselected-button").click(()=>{
    if(ctx.Chosen){
      if(ctx.LetterEditMode){
        ctx.phrase.splice(ctx.LetterChosen,1);
        ctx.ResetAll();
        DeleteLetter(ctx,ctx.LetterChosen);
        SavePhrase(ctx,ctx.PhraseName);
      }
      else if(ctx.PointEditMode){
        ctx.phrase.splice(ctx.LetterChosen,1,new letter(
          ctx.phrase[ctx.LetterChosen].shape,ctx.phrase[ctx.LetterChosen].press));
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X.length; j++){
          if(j!=ctx.PointChosen){
          ctx.phrase[ctx.LetterChosen].write(
            ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[j],
            ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[j]);
        }}
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes.length; j++){
          ctx.phrase[ctx.LetterChosen].holes[j]={X:[],Y:[]};
          for(let k=0; k<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X.length; k++){
            ctx.phrase[ctx.LetterChosen].holes[j].X[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k];
            ctx.phrase[ctx.LetterChosen].holes[j].Y[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k];
        }}
        ctx.phrase[ctx.LetterChosen].finished=true;
        ctx.ResetAll();
        OverwriteLetter(ctx,ctx.LetterChosen);
        SavePhrase(ctx,ctx.PhraseName);
      }
      else if(ctx.PhraseEditMode){
        if(confirm("Sei sicuro di voler cancellare: "+ctx.PhraseName)==true){
          ctx.ResetAll();
          EraseGalleryPhrase(ctx,ctx.PhraseName);
          ErasePhrase(ctx);
          UpdateMiniGallery(ctx);
        }
      }
    }
  });
  $("#shapeselected-button").click(()=>{
    if(ctx.Chosen){
      if(ctx.LetterEditMode){
        ctx.phrase[ctx.LetterChosen].shape=!ctx.phrase[ctx.LetterChosen].shape;
        ctx.ResetAll();
        OverwriteLetter(ctx,ctx.LetterChosen);
        SavePhrase(ctx,ctx.PhraseName);
      }
      else if(ctx.PhraseEditMode){
        let n=0;
        for(let i=0; i<ctx.phrase.length; i++){
          if(ctx.phrase[i].shape){
            n+=1/ctx.phrase.length;
          }
        }
        for(let i=0; i<ctx.phrase.length; i++){
          ctx.phrase[i].shape=(n<0.5);
          OverwriteLetter(ctx,i);
        }
        ctx.ResetAll();
        SavePhrase(ctx,ctx.PhraseName);
      }
    }
  });
  $("#pressselected-button").click(()=>{
    if(ctx.Chosen && $("#setpress").val()>0 && $("#setpress").val()<=100){
      if(ctx.LetterEditMode){
        ctx.phrase[ctx.LetterChosen].press=Math.round($("#setpress").val())/100;
        ctx.ResetAll();
        OverwriteLetter(ctx,ctx.LetterChosen);
        SavePhrase(ctx,ctx.PhraseName);
      }
    }
  });

  //resize and rotate buttons
  ctx.DeactivateAllButtons();
  $("#PointEdit-button").click(()=>{
    ctx.DeactivateAllButtons();
    ctx.ResetAll();
    if(ctx.PointEditMode){
      ctx.PointEditMode=false;
    }
    else{
      $("#PointEdit-button").css({"background-color":"rgba(130,255,0,0.8)","border":"1px"});
      ctx.PointEditMode=true;
      ctx.LetterEditMode=false;
      ctx.PhraseEditMode=false;
    }
    console.log("clnt/set PointEditMode to: "+ctx.PointEditMode);
  });
  $("#LetterEdit-button").click(()=>{
    ctx.DeactivateAllButtons();
    ctx.ResetAll();
    if(ctx.LetterEditMode){
      ctx.LetterEditMode=false;
    }
    else{
      $("#LetterEdit-button").css({"background-color":"rgba(130,255,0,0.8)","border":"1px"});
      ctx.PointEditMode=false;
      ctx.LetterEditMode=true;
      ctx.PhraseEditMode=false;
    }
    console.log("clnt/set LetterEditMode to: "+ctx.LetterEditMode);
  });
  $("#LetterEdit-button").css({"background-color":"rgba(130,255,0,0.8)","border":"1px"});
  $("#PhraseEdit-button").click(()=>{
    ctx.DeactivateAllButtons();
    ctx.ResetAll();
    if(ctx.PhraseEditMode){
      ctx.PhraseEditMode=false;
      ctx.ResetAll();
    }
    else{
      $("#PhraseEdit-button").css({"background-color":"rgba(130,255,0,0.8)","border":"1px"});
      ctx.PointEditMode=false;
      ctx.LetterEditMode=false;
      ctx.PhraseEditMode=true;
    }
    console.log("clnt/set PhraseEditMode to: "+ctx.PhraseEditMode);
  });
  //resize bow buttons
  $("#confirm-button").click(()=>{
    if(ctx.PhraseEditMode){
      for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-1].length; i++){
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length; j++){
          ctx.phrase[i].X[j]=ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j];
          ctx.phrase[i].Y[j]=ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j];
        }
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes.length; j++){
          for(let k=0; k<ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X.length; k++){
            ctx.phrase[i].holes[j].X[k]=ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X[k];
            ctx.phrase[i].holes[j].Y[k]=ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].Y[k];
          }
        }
      }
      OverwritePhrase(ctx);
    }
    else if(ctx.LetterEditMode || ctx.PointEditMode){
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X.length; j++){
        ctx.phrase[ctx.LetterChosen].X[j]=ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[j];
        ctx.phrase[ctx.LetterChosen].Y[j]=ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[j];
      }
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes.length; j++){
        for(let k=0; k<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X.length; k++){
          ctx.phrase[ctx.LetterChosen].holes[j].X[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k];
          ctx.phrase[ctx.LetterChosen].holes[j].Y[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k];
        }
      }
      OverwriteLetter(ctx,ctx.LetterChosen);
    }
    ctx.ResetAll();
    SavePhrase(ctx,ctx.PhraseName);
  });
  $("#undo-button").click(()=>{
    if(ctx.EditPhrase.length>2){
      ctx.EditPhrase.pop();
      ctx.FindResizeXY();
      ctx.FindResizeR();
      ctx.MoveResizeBox();
    }
    else{
      ctx.ResetAll();
    }
  });
  //sliders
  $("#rotation-slider").on("input",()=>{
    ctx.RotateObject(-1*$("#rotation-slider").val());
    $("#angleval").html($("#rotation-slider").val()+"°");
  });
  $("#rotation-slider").on("mousedown",()=>{
    if(ctx.modified){ ctx.PushEditHistory(); }
  });
  $("#rotation-slider").on("touchstart",()=>{
    if(ctx.modified){ ctx.PushEditHistory(); }
  });
  $("#scale-slider").on("input",()=>{
    let z=$("#scale-slider").val();
    if(z>=400){
      ctx.ScaleObject(z/400);
      $("#scaleval").html(Math.round(z/40)/10+"x");
    }else{
      ctx.ScaleObject(400/(1200-2*z));
      $("#scaleval").html(Math.round(4000/(1200-2*z))/10+"x");
    }
  });
  $("#scale-slider").on("mousedown",()=>{
    if(ctx.modified){ ctx.PushEditHistory(); }
  });
  $("#scale-slider").on("touchstart",()=>{
    if(ctx.modified){ ctx.PushEditHistory(); }
  });

  //mousepressed and mousereleased
  $("#main-canvas").on("mousedown",()=>{
    if(ctx.PointEditMode||ctx.LetterEditMode||ctx.PhraseEditMode){
      if(!ctx.Chosen){
        ctx.Choose();
      }
    }
    if(ctx.Chosen){
      if(ctx.modified){
        ctx.PushEditHistory();
      }

      ctx.PivotPressed=true;
      ctx.PivotX=ctx.mouseX/ctx.Scale;
      ctx.PivotY=ctx.mouseY/ctx.Scale;

      ctx.MoveResizeBox();
      ctx.AppearResizeBox();
    }
  });
  $("#main-canvas").on("touchstart",()=>{
    //for touch, it has to be delayed cause time is needed for p5 to setup mouse variables
    setTimeout(()=>{
      if(ctx.PointEditMode||ctx.LetterEditMode||ctx.PhraseEditMode){
        if(!ctx.Chosen){
          ctx.Choose();}}

      if(ctx.Chosen){
        if(ctx.modified){
          ctx.PushEditHistory();
        }

        ctx.PivotPressed=true;
        ctx.PivotX=ctx.mouseX/ctx.Scale;
        ctx.PivotY=ctx.mouseY/ctx.Scale;

        ctx.MoveResizeBox();
        ctx.AppearResizeBox();
      }
    },2);
  });

}
//---------------------------------------------------------------------------//
function ModeDraw(ctx){

  //display the most recent changed phrase
  if((ctx.PointEditMode||ctx.LetterEditMode||ctx.PhraseEditMode) && ctx.Chosen){
    //show the last phrase
    for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-1].length; i++){
      ctx.EditPhrase[ctx.EditPhrase.length-1][i].display(ctx,200,);
    }
  }

  if(ctx.Chosen){
    if(ctx.PivotPressed){
      ctx.fx=ctx.mouseX/ctx.Scale-ctx.PivotX;
      ctx.fy=ctx.mouseY/ctx.Scale-ctx.PivotY;
      ctx.TranslateObject(ctx.fx,ctx.fy);

      ctx.fill(200,180);
      ctx.noStroke();
      ctx.ellipse(ctx.PivotX*ctx.Scale,ctx.PivotY*ctx.Scale,40);
      ctx.stroke(0);
      ctx.ellipse(ctx.mouseX,ctx.mouseY,60);
    }
    ctx.ShowResizeGrid();
  }

  ctx.MoveResizeBox();
}
//---------------------------------------------------------------------------//
function ModeFunctions(ctx){

  //when mousereleased(even if not on canvas) reset, the change has surely ended,
  //  but anyway create new history phrase only on click of new change
  ctx.mouseReleased=()=>{
    if(ctx.PivotPressed){
      ctx.PivotPressed=false;
      ctx.PivotX=-1;
      ctx.PivotY=-1;
    }
    //reset the sliders
    $("#angleval").html("0°");
    $("#rotation-slider").val(0);
    $("#scaleval").html("1x");
    $("#scale-slider").val(400);
  }

  //a new change is happening->create a new history phrase
  ctx.PushEditHistory=()=>{
    ctx.EditPhrase.push([]);
    //create a new EditPhrase, and copy in it the relevant elements from the previous one
    if(ctx.PhraseEditMode){
      //copy the entire previous editphrase into the new one
      //for every letter
      for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-2].length; i++){
        //push a new letter in the phrase
        ctx.EditPhrase[ctx.EditPhrase.length-1].push(new letter(
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].shape,
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].press));
        //write in the letter all the points
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-2][i].X.length; j++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].write(
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].X[j],
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].Y[j]);
        }
        //if the letter has holes (useful only if it is a shape), copy them
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes.length; j++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j]={X:[],Y:[]};
          for(let k=0; k<ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X.length; k++){
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X[k];
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].Y[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].Y[k];
          }
        }
        ctx.EditPhrase[ctx.EditPhrase.length-1][i].finished = true;
      }
    }
    else if(ctx.LetterEditMode || ctx.PointEditMode){
      //of the previous editphrase, copy just the selected letter
      //for every letter, create anyway a phrase with same number of letters
      for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-2].length; i++){
        ctx.EditPhrase[ctx.EditPhrase.length-1].push(new letter(
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].shape,
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].press));
      }
      //write only the selected letter, the other ones will remain empty
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X.length; j++){
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].write(
          ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[j],
          ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[j]);
      }
      //if the selected letter has holes (useful only if it is a shape), copy them
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes.length; j++){
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j]={X:[],Y:[]};
        for(let k=0; k<ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X.length; k++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X[k];
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].Y[k];
        }
      }
      ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].finished = true;
    }
    ctx.modified=false;
  }
  //when a new mode is selected, an object must be selected
  ctx.Choose=()=>{
    if(ctx.PhraseEditMode||ctx.LetterEditMode||ctx.PointEditMode){
      let c=ClosestPoint(ctx);
      ctx.LetterChosen=c.letter;
      ctx.PointChosen=c.point;
      if(c.letter!=-1){
        setTimeout(()=>ctx.Chosen=true,100);
      }
    }
    if(ctx.LetterChosen!=-1){
    //when object is selected, create 2 new history phrases
    //  needed cause the way that changes are calculated, is: (length-1)-(length-2)
    ctx.EditPhrase.push([]);
    if(ctx.PhraseEditMode){
      //copy the entire phrase into editphrase
      for(let i=0; i<ctx.phrase.length; i++){
        ctx.EditPhrase[0].push(new letter(ctx.phrase[i].shape,ctx.phrase[i].press));
        for(let j=0; j<ctx.phrase[i].X.length; j++){
          ctx.EditPhrase[0][i].write(ctx.phrase[i].X[j],ctx.phrase[i].Y[j]);
        }
        for(let j=0; j<ctx.phrase[i].holes.length; j++){
          ctx.EditPhrase[0][i].holes[j]={X:[],Y:[]};
          for(let k=0; k<ctx.phrase[i].holes[j].X.length; k++){
            ctx.EditPhrase[0][i].holes[j].X[k]=ctx.phrase[i].holes[j].X[k];
            ctx.EditPhrase[0][i].holes[j].Y[k]=ctx.phrase[i].holes[j].Y[k];
          }
        }
        ctx.EditPhrase[0][i].finished = true;
      }
    }
    else if(ctx.LetterEditMode || ctx.PointEditMode){
      //of the phrase, copy only the selected letter
      for(let i=0; i<ctx.phrase.length; i++){
        ctx.EditPhrase[0].push(new letter(ctx.phrase[i].shape,ctx.phrase[i].press));
      }
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].X.length; j++){
        ctx.EditPhrase[0][ctx.LetterChosen].write(ctx.phrase[ctx.LetterChosen].X[j],ctx.phrase[ctx.LetterChosen].Y[j]);
      }
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].holes.length; j++){
        ctx.EditPhrase[0][ctx.LetterChosen].holes[j]={X:[],Y:[]};
        for(let k=0; k<ctx.phrase[ctx.LetterChosen].holes[j].X.length; k++){
          ctx.EditPhrase[0][ctx.LetterChosen].holes[j].X[k]=ctx.phrase[ctx.LetterChosen].holes[j].X[k];
          ctx.EditPhrase[0][ctx.LetterChosen].holes[j].Y[k]=ctx.phrase[ctx.LetterChosen].holes[j].Y[k];
        }
      }
      ctx.EditPhrase[0][ctx.LetterChosen].finished = true;
    }
    ctx.PushEditHistory();

    ctx.FindResizeXY();
    ctx.FindResizeR();
    ctx.MoveResizeBox();
    ctx.AppearResizeBox();
    }
  }

  //move the object on the canvas
  ctx.TranslateObject=(x,y)=>{
    ctx.modified=true;
    if(ctx.PointEditMode){
      ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[ctx.PointChosen]=
        ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[ctx.PointChosen]+ctx.fx;
      ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[ctx.PointChosen]=
        ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[ctx.PointChosen]+ctx.fy;
    }
    else if(ctx.LetterEditMode){
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].X.length; j++){
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[j]=
          ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[j]+ctx.fx;
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[j]=
          ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[j]+ctx.fy;
      }
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].holes.length; j++){
        for(let k=0; k<ctx.phrase[ctx.LetterChosen].holes[j].X.length; k++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X[k]+ctx.fx;
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].Y[k]+ctx.fy;
        }
      }
    }
    else if(ctx.PhraseEditMode){
      for(let i=0; i<ctx.phrase.length; i++){
        for(let j=0; j<ctx.phrase[i].X.length; j++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].X[j]+ctx.fx;
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]=
            ctx.EditPhrase[ctx.EditPhrase.length-2][i].Y[j]+ctx.fy;
        }
        for(let j=0; j<ctx.phrase[i].holes.length; j++){
          for(let k=0; k<ctx.phrase[i].holes[j].X.length; k++){
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X[k]+ctx.fx;
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].Y[k]=
              ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].Y[k]+ctx.fy;
          }
        }
      }
    }
    ctx.FindResizeXY();
    ctx.FindResizeR();

    ctx.MoveResizeBox();
  }
  //rotate the object around ResizeXY
  ctx.RotateObject=(a)=>{
    ctx.FindResizeXY();
    ctx.FindResizeR();
    ctx.modified=true;
    if(ctx.LetterEditMode){
      let o={x: ctx.ResizeX[ctx.LetterChosen], y: ctx.ResizeY[ctx.LetterChosen]}
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].X.length; j++){
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[j]=
          +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[j]-o.x)*Math.cos(a*3.1415/180)
          -(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[j]-o.y)*Math.sin(a*3.1415/180)
          +o.x;
        ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[j]=
          +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[j]-o.x)*Math.sin(a*3.1415/180)
          +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[j]-o.y)*Math.cos(a*3.1415/180)
          +o.y;
      }
      for(let j=0; j<ctx.phrase[ctx.LetterChosen].holes.length; j++){
        for(let k=0; k<ctx.phrase[ctx.LetterChosen].holes[j].X.length; k++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X[k]-o.x)*Math.cos(a*3.1415/180)
            -(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].Y[k]-o.y)*Math.sin(a*3.1415/180)
            +o.x;
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X[k]-o.x)*Math.sin(a*3.1415/180)
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].Y[k]-o.y)*Math.cos(a*3.1415/180)
            +o.y;
        }
      }
    }
    else if(ctx.PhraseEditMode){
      for(let i=0; i<ctx.phrase.length; i++){
        for(let j=0; j<ctx.phrase[i].X.length; j++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].X[j]-ctx.ResizePhraseX)*Math.cos(a*3.1415/180)
            -(ctx.EditPhrase[ctx.EditPhrase.length-2][i].Y[j]-ctx.ResizePhraseY)*Math.sin(a*3.1415/180)
            +ctx.ResizePhraseX;
          ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].X[j]-ctx.ResizePhraseX)*Math.sin(a*3.1415/180)
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].Y[j]-ctx.ResizePhraseY)*Math.cos(a*3.1415/180)
            +ctx.ResizePhraseY;
        }
        for(let j=0; j<ctx.phrase[i].holes.length; j++){
          for(let k=0; k<ctx.phrase[i].holes[j].X.length; k++){
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X[k]=
              +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X[k]-ctx.ResizePhraseX)*Math.cos(a*3.1415/180)
              -(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].Y[k]-ctx.ResizePhraseY)*Math.sin(a*3.1415/180)
              +ctx.ResizePhraseX;
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].Y[k]=
              +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X[k]-ctx.ResizePhraseX)*Math.sin(a*3.1415/180)
              +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].Y[k]-ctx.ResizePhraseY)*Math.cos(a*3.1415/180)
              +ctx.ResizePhraseY;
          }
        }
      }
    }
  }
  //Scale the object around ResizeXY
  ctx.ScaleObject=(z)=>{
    ctx.FindResizeXY();
    ctx.FindResizeR();
    ctx.modified=true;
      if(ctx.LetterEditMode){
        let o={x: ctx.ResizeX[ctx.LetterChosen], y: ctx.ResizeY[ctx.LetterChosen]}
        for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X.length; j++){
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[j]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].X[j]-o.x)*z
            +o.x;
          ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[j]=
            +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].Y[j]-o.y)*z
            +o.y;
       }
       for(let j=0; j<ctx.phrase[ctx.LetterChosen].holes.length; j++){
         for(let k=0; k<ctx.phrase[ctx.LetterChosen].holes[j].X.length; k++){
           ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].X[k]=
             +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].X[k]-o.x)*z
             +o.x;
           ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].holes[j].Y[k]=
             +(ctx.EditPhrase[ctx.EditPhrase.length-2][ctx.LetterChosen].holes[j].Y[k]-o.y)*z
             +o.y;
         }
       }
     }
     else if(ctx.PhraseEditMode){
       for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-1].length; i++){
         for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length; j++){
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]=
              +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].X[j]-ctx.ResizePhraseX)*z
              +ctx.ResizePhraseX;
            ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]=
              +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].Y[j]-ctx.ResizePhraseY)*z
              +ctx.ResizePhraseY;
         }
         for(let j=0; j<ctx.phrase[i].holes.length; j++){
           for(let k=0; k<ctx.phrase[i].holes[j].X.length; k++){
             ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].X[k]=
               +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].X[k]-ctx.ResizePhraseX)*z
               +ctx.ResizePhraseX;
             ctx.EditPhrase[ctx.EditPhrase.length-1][i].holes[j].Y[k]=
               +(ctx.EditPhrase[ctx.EditPhrase.length-2][i].holes[j].Y[k]-ctx.ResizePhraseY)*z
               +ctx.ResizePhraseY;
           }
         }
       }
     }
  }

  //go back to initial conditions
  ctx.ResetAll=()=>{
    ctx.EditPhrase=[];
    ctx.modified=true;
    ctx.Chosen=false;
    ctx.ChosenLetter=-1;
    ctx.ChosenPoint=-1;
    ctx.PivotPressed=false;
    ctx.fx=0; ctx.fy=0;
    ctx.DisappearResizeBox();
  }

  //the center of the circle
  ctx.FindResizeXY=()=>{
    let Avgx=0;
    let Avgy=0;
    for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-1].length; i++){
      let avgx=0;
      let avgy=0;
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length; j++){
        avgx+=ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]
          /ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length;
        avgy+=ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]
          /ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length;
      }
      ctx.ResizeX[i]=avgx;
      ctx.ResizeY[i]=avgy;
      Avgx+=avgx/ctx.EditPhrase[ctx.EditPhrase.length-1].length;
      Avgy+=avgy/ctx.EditPhrase[ctx.EditPhrase.length-1].length;
    }
    ctx.ResizePhraseX=Avgx;
    ctx.ResizePhraseY=Avgy;
  }
  ctx.FindResizeR=()=>{
    let R=0;
    for(let i=0; i<ctx.EditPhrase[ctx.EditPhrase.length-1].length; i++){
      let r=0;
      for(let j=0; j<ctx.EditPhrase[ctx.EditPhrase.length-1][i].X.length; j++){
        let t=Math.pow(ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]-ctx.ResizeX[i],2)
          +Math.pow(ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]-ctx.ResizeY[i],2);
        if(t>r){ r=t; }
        t=Math.pow(ctx.EditPhrase[ctx.EditPhrase.length-1][i].X[j]-ctx.ResizePhraseX,2)
         +Math.pow(ctx.EditPhrase[ctx.EditPhrase.length-1][i].Y[j]-ctx.ResizePhraseY,2);
        if(t>R){ R=t; }
      }
      ctx.ResizeR[i]=Math.sqrt(r)+10;
    }
    ctx.ResizePhraseR=Math.sqrt(R)+10;

  }

  ctx.MoveResizeBox=()=>{
    if(ctx.Chosen){
    let dx=0;
    let dy=0;
    if(ctx.PointEditMode){
      dx=ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].X[ctx.PointChosen]
        *ctx.Scale*Zoom+ctx.canvasX;
      dy=ctx.EditPhrase[ctx.EditPhrase.length-1][ctx.LetterChosen].Y[ctx.PointChosen]
        *ctx.Scale*Zoom+ctx.canvasY;
    }
    else if(ctx.LetterEditMode){
      dx=ctx.ResizeX[ctx.LetterChosen]*ctx.Scale*Zoom+ctx.canvasX;
      dy=ctx.ResizeY[ctx.LetterChosen]*ctx.Scale*Zoom+ctx.canvasY;
    }
    else if(ctx.PhraseEditMode){
      dx=ctx.ResizePhraseX*ctx.Scale+ctx.dxWindowCanvas;
      dy=ctx.ResizePhraseY*ctx.Scale+ctx.dyWindowCanvas;
    }
    $("#resize-div").css("left",dx+"px");
    $("#resize-div").css("top",dy+"px");
    $("#resize-div").css("transform","translate(-50%,30%)");
    }
  }
  ctx.ShowResizeGrid=()=>{
    ctx.stroke(0);
    ctx.strokeWeight(1);
    ctx.noFill();
    if(ctx.PhraseEditMode){
      ctx.ellipse(ctx.ResizePhraseX*ctx.Scale,ctx.ResizePhraseY*ctx.Scale
        ,ctx.ResizePhraseR*2*ctx.Scale,ctx.ResizePhraseR*2*ctx.Scale);
    }
    else if(ctx.LetterEditMode){
      ctx.ellipse(ctx.ResizeX[ctx.LetterChosen]*ctx.Scale
        ,ctx.ResizeY[ctx.LetterChosen]*ctx.Scale
        ,ctx.ResizeR[ctx.LetterChosen]*2*ctx.Scale,ctx.ResizeR[ctx.LetterChosen]*2*ctx.Scale);
    }
  }

  ctx.AppearResizeBox=()=>{
    $("#resize-div").css("opacity","1");
    $("#resize-div").css("pointer-events","auto");
  }
  ctx.DisappearResizeBox=()=>{
    $("#resize-div").css("opacity","0");
    $("#resize-div").css("pointer-events","none");
  }

  ctx.DeactivateAllButtons=()=>{
    ctx.Chosen=false;
    ctx.PivotPressed=false;
    $("#PointEdit-button").css({"background-color":"rgba(255,0,0,0.7)","border":"0px"});
    $("#LetterEdit-button").css({"background-color":"rgba(255,0,0,0.7)","border":"0px"});
    $("#PhraseEdit-button").css({"background-color":"rgba(255,0,0,0.7)","border":"0px"});
  }

}
