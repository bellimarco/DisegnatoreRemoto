let img;
let imgnew;

function ModeVariables(p){
  p.config.showbefore=false;

  p.fps=30;

  p.plchldrImg="/images/icon-imageNF.png";

  //placeholder values for the image
  p.imgx=0;
  p.imgy=0;
  p.imgw=200;
  p.imgh=200;
  p.imgrat=1; //width/height
  p.centered=false;

  p.doing=0; //0 to 1 of the current scan
  p.scantime=0.1; //how much does it take to scan

  //the mode that is currently running (grayscale, discrete, unres
  p.ActiveMode=0;

  p.PenActive=false;
  p.PenColor=0;
  p.tracing=false; //if the mouse is being dragged to color

  p.DiscreteColorstep=51;
  p.ResRadius=7;
  p.ResThresh=0.7;
  p.smallblbslimit=50;
  p.colorblobs=0;

  p.chosen={X:-10,Y:-10}
  p.LastSelected={X:-10,Y:-10};

  p.paths=[];
  p.shapes=[];
}
//---------------------------------------------------------------------------//
function ModeSetup(p){
  p.noSmooth();
  p.noStroke();
  p.config.opacity=153;

  for(let k=-3; k<=3; k++){
    for(let w=-3; w<=3; w++){
      if(k!=0 && w!=0){
        p.SmoothRadTot+=1/Math.sqrt(k*k+w*w);
      }
    }
  }p.SmoothRadTot++;

  //set the file-button to transfer a click to the input field
  $('#file-button').click(function(){
    $('#file-input').click();
  });

  //load a placeholder image
  img=p.loadImage(p.plchldrImg);
  imgnew=p.loadImage(p.plchldrImg, p.CenterImage);
  $("#image-view").css("height",$("#image-view").css("width"));
  $("#scan-button").click(()=>{
    if($("#image-link").val().length>0){
      $("#image-view").css("background-image",'url('+$("#image-link").val()+')');
      img=p.loadImage($("#image-link").val());
      imgnew=p.loadImage($("#image-link").val(), p.CenterImage);
      console.log("clnt/Searched image by URL")
    }
    else{
      $("#image-view").css("background-image",'url("/images/icon-imageNF.png")');
    }
  });
  //set different buttons
  $("#downl-button").click(()=>{
    img.save("downl","png");
    console.log("clnt/downloaded image");
  });
  $("#file-input").change(()=>{
    var file    = document.getElementById('file-input').files[0];
    var reader  = new FileReader();

    if(file){ reader.readAsDataURL(file); }
    reader.addEventListener("load", function () {
      $("#image-view").css("background-image",'url('+reader.result+')');
      img=p.loadImage(reader.result);
      imgnew=p.loadImage(reader.result, p.CenterImage);
      console.log("clnt/Uploaded image from filesystem");
    }, false);
  });

  $("#reset-button").click(()=>{
    p.doneGrayscale=false;
    p.doneDiscrete=false;
    p.doneUnres=false;
    p.doneRemnoise=false;
    p.paths=[];
  });

  //image manipulation
  $("#grayscale-button").click(()=>{
    p.doing=0;
    p.ActiveMode=1;
    p.scantime=1;
  });
  $("#discrete-button").click(()=>{
    p.doing=0;
    p.ActiveMode=2;
    p.scantime=2;
  });
  $("#unres-button").click(()=>{
    p.doing=0;
    p.ActiveMode=3;
    p.scantime=4;
  });
  $("#smallblbs-button").click(()=>{
    PD.UpdateBlobPxls();
    let count=0;
    for(let x=0; x<PD.pxw; x++){
      for(let y=0; y<PD.pxh; y++){
        if(PD.blobpxls[x+y*PD.pxw].X.length<p.smallblbslimit){
          let c=PD.ClosestColor(x,y,PD.pxls[x+y*PD.pxw]);
          PD.pxls[x+y*PD.pxw]=c;
          count++;
        }
      }
    }
    console.log("clnt/removed small blobs: "+count);
    p.UpdateImg();
  });
  $("#smallblbs-limit").on("change",()=>{
    if($("#smallblbs-limit").val()!=0){
      p.smallblbslimit=$("#smallblbs-limit").val();
    }
  });
  $("#remnoise-button").click(()=>{
    let count=0;
    for(let x=0; x<PD.pxw; x++){
      for(let y=0; y<PD.pxh; y++){
        let c=PD.Connections(x,y);
        if(c.dir.w.length>=3){
          PD.pxls[x+y*PD.pxw]=PD.pxls[c.dir.w[0].X+c.dir.w[0].Y*PD.pxw];
          count++;
        }
      }
    }
    console.log("clnt/removed single noise pixel: "+count);
    p.UpdateImg();
  });
  $("#colorblobs-button").click(()=>{
    console.log("clnt/colored blob "+(p.chosen.X-p.imgx)+","+(p.chosen.Y-p.imgy));
    PD.ColorBlob(p.chosen.X-p.imgx,p.chosen.Y-p.imgy,p.colorblobs);
    p.UpdateImg();
  });
  $("#colorblobs-color").on("change",()=>{
    if($("#colorblobs-color").val()>=0 && $("#colorblobs-color").val()<=p.DiscreteColorstep
    && $("#colorblobs-color").val()%1==0){
      p.colorblobs=Math.round($("#colorblobs-color").val()*p.DiscreteColorstep);
      $("#colorblobs-preview").css("background-color","rgba("+p.colorblobs+","+p.colorblobs+","+p.colorblobs+",1)");
    }
  });
  $("#widenblob-button").click(()=>{
    PD.WidenBlob(p.chosen.X-p.imgx, p.chosen.Y-p.imgy);
    p.UpdateImg();
    console.log("clnt/widen blob");
  })
  $("#pen-button").click(()=>{
    if(!p.PenActive){
      p.PenActive=true;
      $("#pen-button").css("background-color","rgba(130,255,0,0.8)");
      console.log("clnt/pen activated, color: "+p.PenColor);
    }
    else{
      p.PenActive=false;
      $("#pen-button").css("background-color","rgba(255,255,255,1)");
      console.log("clnt/pen deactivated");
    }
  });
  $("#pen-color").on("change",()=>{
    if($("#pen-color").val()>=0 && $("#pen-color").val()<=p.DiscreteColorstep
    && $("#pen-color").val()%1==0){
      p.PenColor=Math.round($("#pen-color").val()*p.DiscreteColorstep);
      $("#pen-preview").css("background-color","rgba("+p.PenColor+","+p.PenColor+","+p.PenColor+",1)");
    }
  });

  $("#updatePD-button").click(()=>{
    p.UpdatePD();
    p.UpdateImg();
  });

  //create frase
  $("#testpath-button").click(()=>{
    //only if new point has been chosen
    if(p.LastSelected.X!=p.chosen.X && p.LastSelected.Y!=p.chosen.Y){
      $("#testpath-button").css("background-color","rgba(130,255,0,0.8)");
      p.LastSelected={X: p.chosen.X, Y: p.chosen.Y};
      let point=PD.ClosestBorder(p.chosen.X-p.imgx, p.chosen.Y-p.imgy);
      let path=PD.DiscoverPath(point.X,point.Y,false);
      p.UpdateImg();
      p.paths=[];
      p.paths[0]=path;
      console.log("clnt/test path");
    }
    //else if didnt choose new point, erase the shape
    else{
      $("#testpath-button").css("background-color","rgba(255,255,255,1)");
      p.paths=[];
      console.log("clnt/erased test path");
    }
  });
  $("#findshape-button").click(()=>{
    //only if new point has been chosen
    if(p.LastSelected.X!=p.chosen.X && p.LastSelected.Y!=p.chosen.Y){
      $("#findshape-button").css("background-color","rgba(130,255,0,0.8)");
      let shape=PD.DiscoverShape(p.chosen.X-p.imgx, p.chosen.Y-p.imgy);
      p.LastSelected={X: p.chosen.X, Y: p.chosen.Y};
      p.UpdateImg();
      p.shapes=[];
      p.shapes[0]=shape;
      console.log("clnt/find shape, shapes: "+p.shapes.length);
    }
    //else if didnt choose new point, erase the shape
    else{
      $("#findshape-button").css("background-color","rgba(255,255,255,1)");
      p.shapes=[];
      console.log("clnt/erased shapes");
    }
  });
  $("#addshape-button").click(()=>{
    //push a new letter in the phrase array
    p.phrase.push(new letter(true, 1-p.shapes[0].c/255));
    for(let i=0; i<p.shapes[0].ext.X.length; i++){
      p.phrase[p.phrase.length-1].write((p.shapes[0].ext.X[i]+p.imgx)/p.Scale,(p.shapes[0].ext.Y[i]+p.imgy)/p.Scale);
    }
    for(let i=0; i<p.shapes[0].int.length; i++){
      p.phrase[p.phrase.length-1].holes[i]={X:[], Y:[]};
      for(let j=0; j<p.shapes[0].int[i].X.length; j++){
        p.phrase[p.phrase.length-1].holes[i].X[j]=(p.shapes[0].int[i].X[j]+p.imgx)/p.Scale;
        p.phrase[p.phrase.length-1].holes[i].Y[j]=(p.shapes[0].int[i].Y[j]+p.imgy)/p.Scale;
      }
    }
    p.phrase[p.phrase.length-1].finished=true;
    AddLetter(p);
    PD.ColorBlob(p.shapes[0].ext.X[0],p.shapes[0].ext.Y[0],PD.Added);
    p.shapes=[];
    p.UpdateImg();
    console.log("clnt/added selected shape");
  });

  //opzioni
  $("#showphrase-button").click(()=>{
    if(p.config.showphrase){
      p.config.showphrase=false;
      $("#showphrase-button").css("background-color","rgba(255,255,255,1)");
    }
    else{
      p.config.showphrase=true;
      $("#showphrase-button").css("background-color","rgba(130,255,0,0.8)");
    }
    console.log("clnt/toggled config showphrase");
  });
  $("#showphrase-opacity").on("change",()=>{
    if($("#showphrase-opacity").val()>=1 && $("#showphrase-opacity").val()<=10){
      p.config.opacity=$("#showphrase-opacity").val()/10*255;
    }
  })

  //mousepressed and mousereleased
  $("#main-canvas").on("mousedown",()=>{
    if(!p.PenActive){
      if(img.pixels[(Math.round(p.mouseX-p.imgx)+Math.round(p.mouseY-p.imgy)*p.imgw)*4]!=255){
        p.chosen.X=Math.round(p.mouseX); p.chosen.Y=Math.round(p.mouseY);
      }
      else{
        p.chosen.X=-10; p.chosen.Y=-10;
      }
    }
    if(p.PenActive){ p.tracing=true; }
  });
  $("#main-canvas").on("touchstart",()=>{
    p.chosen.X=Math.round(p.mouseX); p.chosen.Y=Math.round(p.mouseY);
  });

}
//---------------------------------------------------------------------------//
function ModeDraw(p){

  p.background(255);
  if(p.centered){ p.image(imgnew,p.imgx,p.imgy); }
  //paths

  p.stroke(255,0,0);
  p.strokeWeight(2.5);
  for(let i=0; i<p.paths.length; i++){
    for(let j=1; j<p.paths[i].X.length; j++){
      p.line(p.paths[i].X[j-1]+p.imgx,p.paths[i].Y[j-1]+p.imgy, p.paths[i].X[j]+p.imgx,p.paths[i].Y[j]+p.imgy);
    }
  }
  p.noStroke();
  for(let i=0; i<p.paths.length; i++){
    p.fill(0,255,0);
    p.ellipse(p.paths[i].X[0]+p.imgx,p.paths[i].Y[0]+p.imgy,5,5);
    p.fill(0,0,255);
    for(let j=1; j<p.paths[i].X.length; j++){
      p.ellipse(p.paths[i].X[j]+p.imgx,p.paths[i].Y[j]+p.imgy, 3,3);
    }
  }
  //shapes
  for(let i=0; i<p.shapes.length; i++){
    //ext
    p.strokeWeight(2.5);
    p.stroke(0,255,0);
    for(let j=1; j<p.shapes[i].ext.X.length; j++){
      p.line(p.shapes[i].ext.X[j-1]+p.imgx,p.shapes[i].ext.Y[j-1]+p.imgy,
        p.shapes[i].ext.X[j]+p.imgx, p.shapes[i].ext.Y[j]+p.imgy);
    }
    //int
    p.stroke(255,0,0);
    for(let j=0; j<p.shapes[i].int.length; j++){
      for(let k=1; k<p.shapes[i].int[j].X.length; k++){
        p.line(p.shapes[i].int[j].X[k-1]+p.imgx,p.shapes[i].int[j].Y[k-1]+p.imgy,
          p.shapes[i].int[j].X[k]+p.imgx, p.shapes[i].int[j].Y[k]+p.imgy);
      }
    }
    p.noStroke();
    p.fill(0,0,255);
    for(let j=0; j<p.shapes[i].ext.X.length; j++){
      p.ellipse(p.shapes[i].ext.X[j]+p.imgx, p.shapes[i].ext.Y[j]+p.imgy,3,3);
    }
    for(let j=0; j<p.shapes[i].int.length; j++){
      for(let k=0; k<p.shapes[i].int[j].X.length; k++){
        p.ellipse(p.shapes[i].int[j].X[k]+p.imgx, p.shapes[i].int[j].Y[k]+p.imgy,3,3);
      }
    }
  }


  if(p.ActiveMode==1){
    p.ToGrayscale(p.doing,p.doing+1/(p.scantime*p.fps)+0.01);

    p.stroke(255,0,0);
    p.line(p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, 0, p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, p.canvasheight);

    p.doing+=1/(p.scantime*p.fps);
    if(p.doing>=1+1/(p.scantime*p.fps)){
      for(let i=0; i<imgnew.pixels.length; i++){
        img.pixels[i]=imgnew.pixels[i];
      }
      img.updatePixels();
      p.doing=0;
      p.ActiveMode=0;
      console.log("clnt/Done Grayscale");
    }
  }
  else if(p.ActiveMode==2){
    p.ToDiscrete(p.doing,p.doing+1/(p.scantime*p.fps)+0.01);

    p.stroke(255,0,0);
    p.line(p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, 0, p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, p.canvasheight);

    p.doing+=1/(p.scantime*p.fps);
    if(p.doing>=1+1/(p.scantime*p.fps)){
      for(let i=0; i<imgnew.pixels.length; i++){
        img.pixels[i]=imgnew.pixels[i];
      }
      img.updatePixels();
      p.doing=0;
      p.ActiveMode=0;
      console.log("clnt/Done Discrete");
    }
  }
  else if(p.ActiveMode==3){
    p.ToUnres(p.doing,p.doing+1/(p.scantime*p.fps)+0.01);

    p.stroke(255,0,0);
    p.line(p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, 0, p.canvaswidth/2-p.imgw/2+p.doing*p.imgw, p.canvasheight);

    p.doing+=1/(p.scantime*p.fps);
    if(p.doing>=1+1/(p.scantime*p.fps)){
      for(let i=0; i<imgnew.pixels.length; i++){
        img.pixels[i]=imgnew.pixels[i];
      }
      img.updatePixels();
      p.doing=0;
      p.ActiveMode=0;
      console.log("clnt/Done Unres");

      //once Unres has been completed, can proceed with the PD functions
      p.UpdatePD();
    }
  }

  if(p.tracing){
    imgnew.pixels[(Math.round(p.mouseX-p.imgx)+Math.round(p.mouseY-p.imgy)*p.imgw)*4]=p.PenColor;
    imgnew.pixels[(Math.round(p.mouseX-p.imgx)+Math.round(p.mouseY-p.imgy)*p.imgw)*4+1]=p.PenColor;
    imgnew.pixels[(Math.round(p.mouseX-p.imgx)+Math.round(p.mouseY-p.imgy)*p.imgw)*4+2]=p.PenColor;
    imgnew.updatePixels();
  }

  p.fill(0,255,0);
  p.noStroke();
  p.ellipse(p.chosen.X,p.chosen.Y,6,6);

}
//---------------------------------------------------------------------------//
function ModeFunctions(p){

  p.mouseReleased=()=>{
    if(p.tracing){
      p.tracing=false;

      for(let i=0; i<imgnew.pixels.length; i++){
        img.pixels[i]=imgnew.pixels[i];
      }
      img.updatePixels();

      p.UpdatePD();
    }
  }

  p.CenterImage=()=>{
    p.centered=true;

    p.imgrat=img.width/img.height;
    console.log(p.imgrat);
    if(p.imgrat>1.4142){
      p.imgw=Math.round(p.canvaswidth*0.95);
      p.imgh=Math.round(p.imgw/p.imgrat);}
    else{
      p.imgh=Math.round(p.canvasheight*0.95);
      p.imgw=Math.round(p.imgh*p.imgrat);
    }
    img.resize(p.imgw,p.imgh);
    imgnew.resize(p.imgw,p.imgh);
    p.imgx=Math.round(p.canvaswidth/2-p.imgw/2);
    p.imgy=Math.round(p.canvasheight/2-p.imgh/2);
    img.loadPixels();
    imgnew.loadPixels();

    $("#image-view").html(p.imgw+"x"+p.imgh+" px");

    console.log(img);
    console.log("centered: "+p.imgx+","+p.imgy+"  "+p.imgw+","+p.imgh);
  }

  //convert image to grayscale
  p.ToGrayscale=(start,end)=>{
    let g=0;
    for(let i=Math.round(start*img.width); i<Math.round(end*img.width); i++){
      for(let j=0; j<img.height; j++){
        g=0.299*img.pixels[(i+j*img.width)*4]
          +0.587*img.pixels[(i+j*img.width)*4+1]
          +0.114*img.pixels[(i+j*img.width)*4+2];
        imgnew.pixels[(i+j*img.width)*4]=g;
        imgnew.pixels[(i+j*img.width)*4+1]=g;
        imgnew.pixels[(i+j*img.width)*4+2]=g;
      }
    }
    imgnew.updatePixels();
  }
  //divede every grayscale color into a discrete set
  p.ToDiscrete=(start,end)=>{
    let g=0;
    for(let i=Math.round(start*img.width); i<Math.round(end*img.width); i++){
      for(let j=0; j<img.height; j++){
        g=Math.round(img.pixels[(i+j*img.width)*4]/p.DiscreteColorstep)*p.DiscreteColorstep;
        imgnew.pixels[(i+j*img.width)*4]=g;
        imgnew.pixels[(i+j*img.width)*4+1]=g;
        imgnew.pixels[(i+j*img.width)*4+2]=g;
      }
    }
    imgnew.updatePixels();
  }
  //smooth the image
  p.ToUnres=(start,end)=>{
    let count=[];
    let tot=0;
    let g=0;
    for(let i=Math.round(start*img.width); i<Math.round(end*img.width); i++){
      for(let j=0; j<img.height; j++){

        for(let k=0; k<=255/p.DiscreteColorstep; k++){
          count[k]=0;
        }
        for(let dx=0; dx<p.ResRadius; dx++){
          for(let dy=0; dy<p.ResRadius; dy++){
            if(dx*dx+dy*dy<=Math.pow(p.ResRadius,2)){
              for(let k=0; k<=255/p.DiscreteColorstep; k++){
                if(img.pixels[((i+dx)+(j+dy)*p.imgw)*4]==k*p.DiscreteColorstep){
                  count[k]++;
                }
                if(img.pixels[((i-dx)+(j+dy)*p.imgw)*4]==k*p.DiscreteColorstep){
                  count[k]++;
                }
                if(img.pixels[((i+dx)+(j-dy)*p.imgw)*4]==k*p.DiscreteColorstep){
                  count[k]++;
                }
                if(img.pixels[((i-dx)+(j-dy)*p.imgw)*4]==k*p.DiscreteColorstep){
                  count[k]++;
                }
              }
            }
          }
        }
        tot=0;
        for(let k=0; k<=255/p.DiscreteColorstep; k++){
          tot+=count[k];
        }
        if(count[img.pixels[(i+j*p.imgw)*4]/p.DiscreteColorstep]<p.ResThresh*tot){
          g=count.indexOf(Math.max(...count))*p.DiscreteColorstep;
          imgnew.pixels[(i+j*p.imgw)*4]=g;
          imgnew.pixels[(i+j*p.imgw)*4+1]=g;
          imgnew.pixels[(i+j*p.imgw)*4+2]=g;
        }

      }
    }
    imgnew.updatePixels();
  }


  p.UpdatePD=()=>{
    let px=[];
    for(let i=0; i<img.pixels.length/4; i++){
      px[i]=img.pixels[i*4];
    }
    PD.UpdatePxls(px,p.imgw,p.imgh,p.DiscreteColorstep);
    PD.UpdateBlobPxls();
    console.log("clnt/Updated PD");
  }
  p.UpdateImg=()=>{
    PD.UpdateBlobPxls();
    for(let x=0; x<p.imgw; x++){
      for(let y=0; y<p.imgh; y++){
        img.pixels[(x+y*p.imgw)*4]=PD.pxls[x+y*PD.pxw];
        img.pixels[(x+y*p.imgw)*4+1]=PD.pxls[x+y*PD.pxw];
        img.pixels[(x+y*p.imgw)*4+2]=PD.pxls[x+y*PD.pxw];
        imgnew.pixels[(x+y*p.imgw)*4]=PD.pxls[x+y*PD.pxw];
        imgnew.pixels[(x+y*p.imgw)*4+1]=PD.pxls[x+y*PD.pxw];
        imgnew.pixels[(x+y*p.imgw)*4+2]=PD.pxls[x+y*PD.pxw];
      }
    }
    img.updatePixels();
    imgnew.updatePixels();
    p.image(img,p.imgx,p.imgy);
    console.log("clnt/PD Updated Image")
  }


}
