console.clear();
console.log();
console.log();
console.log("--------SERVER STARTING--------");
console.log("--------loading modules--------");


const fs = require("fs");
const http = require("http");
const express = require("express");
const WS = require("./server-files/LocalModules/WritingSoftware");

var CurrentPhrase;

var app = express();
var port= "192.168.1.23";
var portNum=8080;
app.listen(portNum, port, () => {
  console.log("srvr/listening on port: "+port+":"+portNum);
  //once the server is started, WS setup
  //start by loading the currentphrase and setting the transmissionphrase
  CurrentPhrase = JSON.parse(fs.readFileSync("server-files/gallery/CurrentPhrase.json"));

  WS.SetupHttpRequests(app);
  WS.Setup(JSON.parse(fs.readFileSync("server-files/Objects/TransmissionPhrase.json")));
});

app.use(express.static("./Website"));
app.get('/', (req, res) => {
  res.render(__dirname + '/Website/index.html');
});

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());


//phrase manipulation
app.post("/AddLetterCurrent", (req, res) => {
  //push the received points in CurrentPhrase
  CurrentPhrase.X.push(req.body.X);
  CurrentPhrase.Y.push(req.body.Y);
  CurrentPhrase.shape.push(req.body.shape);
  CurrentPhrase.press.push(req.body.press);
  CurrentPhrase.holes.push(req.body.holes);
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  console.log("srvr/Added Letter, CurrentPhrase letters: " + CurrentPhrase.X.length);
  res.send("srvr/Added Letter, CurrentPhrase letters: " + CurrentPhrase.X.length);
});
app.get("/DeleteLetterCurrent/:lett", (req, res) => {
  //push the received points in CurrentPhrase
  CurrentPhrase.X.splice(parseInt(req.params.lett),1);
  CurrentPhrase.Y.splice(parseInt(req.params.lett),1);
  CurrentPhrase.shape.splice(parseInt(req.params.lett),1);
  CurrentPhrase.press.splice(parseInt(req.params.lett),1);
  CurrentPhrase.holes.splice(parseInt(req.params.lett),1);
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  console.log("srvr/Deleted Letter, CurrentPhrase letters: " + CurrentPhrase.X.length);
  res.send("srvr/Deleted Letter, CurrentPhrase letters: " + CurrentPhrase.X.length);
});
app.post("/OverwriteLetterCurrent/:lett", (req, res) => {
  //overwrite the received points in CurrentPhrase
  CurrentPhrase.X[parseInt(req.params.lett)] = req.body.X;
  CurrentPhrase.Y[parseInt(req.params.lett)] = req.body.Y;
  CurrentPhrase.shape[parseInt(req.params.lett)] = req.body.shape;
  CurrentPhrase.press[parseInt(req.params.lett)] = req.body.press;
  CurrentPhrase.holes[parseInt(req.params.lett)] = req.body.holes;
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  console.log("srvr/overwritten letter "+req.params.lett);
  res.send("srvr/overwritten letter "+req.params.lett);
});
app.post("/OverwriteCurrent", (req, res) => {
  //overwrite the received points in CurrentPhrase
  CurrentPhrase.X = req.body.X;
  CurrentPhrase.Y = req.body.Y;
  CurrentPhrase.shape = req.body.shape;
  CurrentPhrase.press = req.body.press;
  CurrentPhrase.holes = req.body.holes;
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  console.log("srvr/overwritten CurrentPhrase");
  res.send("srvr/overwritten CurrentPhrase");
});
app.post("/SaveCurrent/:name", (req, res) => {
  var temp = JSON.parse(fs.readFileSync("server-files/Objects/BlankPhrase.json"));
  temp.name = req.params.name;
  temp.X = CurrentPhrase.X;
  temp.Y = CurrentPhrase.Y;
  temp.shape = CurrentPhrase.shape;
  temp.press = CurrentPhrase.press;
  temp.holes = CurrentPhrase.holes;
  var d = new Date();
  temp.time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + "    " +
    d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
  temp.timeint = (d.getMonth() + 1) * 2628000 + d.getDate() * 86400 +
    d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  fs.writeFileSync("server-files/gallery/" + temp.name + ".json", JSON.stringify(temp, null, 2));
  fs.writeFileSync("server-files/gallery-previews/" + temp.name + ".json", JSON.stringify(req.body, null, 2));
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(temp, null, 2));
  console.log("srvr/saved phrase: " + temp.name);
  res.send("srvr/saved phrase: " + temp.name);
});
app.get("/EraseCurrent", (req, res) => {
  CurrentPhrase.X = [];
  CurrentPhrase.Y = [];
  CurrentPhrase.shape = [];
  CurrentPhrase.press = [];
  CurrentPhrase.holes = [];
  CurrentPhrase.name="";
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  console.log("srvr/erased CurrentPhrase");
  res.send("srvr/erased CurrentPhrase");
});
//request to load on the page a gallery phrase
app.get("/GalleryPhrase/:name", (req, res) => {
  console.log("clnt/requested phrase: " + req.params.name);
  let p = JSON.parse(fs.readFileSync("server-files/gallery/" + req.params.name + ".json"));
  CurrentPhrase.X = p.X;
  CurrentPhrase.Y = p.Y;
  CurrentPhrase.shape = p.shape;
  CurrentPhrase.press = p.press;
  CurrentPhrase.holes = p.holes;
  CurrentPhrase.name = p.name;
  fs.writeFileSync("server-files/gallery/CurrentPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  res.send(CurrentPhrase);
});
//request array with names of every gallery phrase
app.get("/GalleryPhrasesList", (req, res) => {
  var data = [];
  fs.readdir("server-files/gallery", (err, files) => {
    if (err) { console.log("srvr/error while reading gallery phrases"); }
    files.forEach((file) => {
      //prevent reading of trash DS_Store files
      if (file.localeCompare("_DS_Store") != 0 && file.localeCompare(".DS_Store") != 0 && file.localeCompare("CurrentPhrase.json") != 0) {
        var obj = {};
        var phrase = JSON.parse(fs.readFileSync("server-files/gallery/" + file));
        obj.name = phrase.name;
        obj.time = phrase.time;
        obj.timeint = phrase.timeint;
        data.push(obj);
      }
    });
    res.send(data);
  });
});
//request base64 encoding of the preview image
app.get("/GalleryPreview/:name", (req, res) => {
  res.send(JSON.parse(fs.readFileSync("server-files/gallery-previews/" + req.params.name + ".json")));
});
//request to erase a specific phrase from the gallery
app.get("/EraseGallery/:name", (req,res)=>{
  console.log("srvr/erased "+req.params.name);
  fs.unlinkSync("server-files/gallery/"+req.params.name+".json");
  fs.unlinkSync("server-files/gallery-previews/"+req.params.name+".json");
  res.send("srvr/erased "+req.params.name);
})

//set the phrase that is in queue of transmission
app.get("/TransmitCurrent", (req, res) => {
  console.log("\n------New Transmission------");
  //recalculate the writing software and save the new transmissionphrase
  fs.writeFileSync("server-files/Objects/TransmissionPhrase.json", JSON.stringify(CurrentPhrase, null, 2));
  WS.Setup(JSON.parse(fs.readFileSync("server-files/Objects/TransmissionPhrase.json")));

  console.log("----Transmission Phrase Saved----\n");
  res.send("srvr/transmitted phrase: " + CurrentPhrase.name);
});


//PrintMonitor request for regular update info
app.get("/WSUpdatePoint", (req,res)=>{
  let data={};
  //only send the target,
  //  if the aruino has signaled that it has requested it,
  //  and if the client hasn't already received it
  if(WS.CurrTargArdSent && !WS.CurrTargClntSent){
    //only sen the important data
    data = {
      new: true,//there is a new target
      IsPrinting: WS.IsPrinting,
      label: WS.TargetQueue[0].Label,
      letter:WS.TargetQueue[0].Letter,
      filler:WS.TargetQueue[0].Fill,
      X: WS.TargetQueue[0].X,
      Y: WS.TargetQueue[0].Y,
      XSpeed: WS.TargetQueue[0].XSpeed,
      YSpeed: WS.TargetQueue[0].YSpeed,
      dT: WS.TargetQueue[0].T,
      isup: WS.TargetQueue[0].isup,
      Ttot: WS.TargetQueueT(),
    };
    WS.CurrTargClntSent=true;
  }
  //just send that it is not a new target
  else{
    data.new=false;
    data.IsPrinting=WS.IsPrinting;
  }

  res.send(data);
});
//PrintMonitor request for the entire targetqueue
app.get("/WSUpdateQueue", (req,res)=>{
  let data=[];
  for(let i=0; i<WS.TargetQueue.length; i++){
    if(WS.TargetQueue[i].Label==0){
      data.push({
        letter:WS.TargetQueue[i].Letter,
        filler:WS.TargetQueue[i].Filler,
        isup:WS.TargetQueue[i].isup,
        X:WS.TargetQueue[i].Xtarg,
        Y:WS.TargetQueue[i].Ytarg,
      });
    }else{
      data.push({
        letter:-1,
        filler:-1,
        isup:WS.TargetQueue[i].isup,
        X:WS.TargetQueue[i].Xtarg,
        Y:WS.TargetQueue[i].Ytarg,
      });
    }
  }
  res.send(data);
});

//when arduino queue is empty, request new set
app.get("/ArdQueueUpdate", (req, res) => {
  //check wether to shift the target queue
  //  needs to be int this request too, cause we have to shift the queue before
  //  we send a new set to the arduino
  if(WS.CurrTargArdSent){
    WS.TargetQueue.shift();
    WS.CurrTargArdSent=false;
  }
  let data={
    totsize: 0,
    FastMode: WS.FastMode
  };
  if(WS.IsPrinting){
    data={
      totsize:0,
      FastMode: WS.FastMode,
      Letter:[],
      Point:[],
      Rtarg:[],
      Atarg:[],
      R:[],
      A:[],
      dtR:[],
      dtA:[],
      Label:[],
      isup:[],
      press:[],
    };
    //get how many targets are in the set
    data.totsize=WS.TargetQueueSetSize();
    //only copy in data the targets in the set
    for(let i=0; i<data.totsize; i++){
      data.Letter[i]= WS.TargetQueue[i].Letter;
      data.Point[i]= WS.TargetQueue[i].Point;
      data.Rtarg[i]= WS.TargetQueue[i].Rtarg;
      data.Atarg[i]= WS.TargetQueue[i].Atarg;
      data.R[i]= WS.TargetQueue[i].R;
      data.A[i]= WS.TargetQueue[i].A;
      data.dtR[i]= WS.TargetQueue[i].dtR;
      data.dtA[i]= WS.TargetQueue[i].dtA;
      data.Label[i]= WS.TargetQueue[i].Label;
      data.isup[i]= WS.TargetQueue[i].isup;
      if(WS.ServoTestMode){
        data.press[i]=Math.round(WS.TargetQueue[i].press*15);
        WS.ServoTestMode=false;
      }
      else if(WS.TargetQueue[i].isup){ data.press[i]=WS.ServoUp; }
      else if(!WS.PenMode){ data.press[i]=WS.ServoMin+Math.round((WS.ServoMax-WS.ServoMin)*WS.TargetQueue[i].press); }
      else{ data.press[i]=WS.ServoMid; }
    }
    console.log("Ard/QueueUpdate, SetSize: "+data.totsize);
  }

  res.send(data);
});
//when the arduino reaches a target (FastMoe off)
app.get("/ArdFastUpdate", (req,res)=>{
  //first of all, the arduino is connected
  ArdCheck=true;

  //when the arduino requests this link, means he has finished the target,
  //  so the WS can understand that the current target has moved
  //check wether to shift the target queue
  if(WS.CurrTargArdSent){
    WS.TargetQueue.shift();
    WS.CurrTargArdSent=false;
  }
  //control that is printing is deactivated if there are no targets
  if(WS.TargetQueue.length==0 && WS.IsPrinting){
    WS.IsPrinting=false;
    console.log("WS/TargetQueue empty, set IsPrinting to false");
    console.log("WS/------FINISHED PRINTING------\n");
  }
  //if IsPrinting && QueueLength>0 update the current target
  //unless the arduino is going to reupdate->skip this request
  if(WS.IsPrinting && !WS.ArdReupdate){
    //a new Currenttarget is set (the new TargetQueue[0]),
    WS.CurrTargArdSent=true;
    //it must be sent to the PrintMonitor
    WS.CurrTargClntSent=false;

    console.log("WS/set CurrentTarget: "+WS.TargetQueue[0].Point+","
      +WS.TargetQueue[0].Letter+","+WS.TargetQueue[0].Label
      +"   SetSize: "+WS.TargetQueueSetSize()+"  QueueLength: "+WS.TargetQueue.length);
  }

  //sending the right message: or off, or on, or off with reupdate
  let msg=0
  if(WS.ArdReupdate){
    msg=2;
    //untrigger the bool
    WS.ArdReupdate=false;
    console.log("WS/Sent ArdShoulReupdate")
  }
  else if(WS.IsPrinting){
    msg=1;
  }

  res.send(""+msg);
});
//shift the WS queue
app.get("/ArdQueueShift/:n", (req,res)=>{
  let n=parseInt(req.params.n);
  for(let i=1; i<=n; i++){
    WS.TargetQueue.shift();
  }
  WS.CurrTargArdSent=false;
  WS.CurrTargClntSent=false;

  res.send("");
});

//check arduino connection
var ArdConnected=false;
var ArdCheck=false;
setInterval(()=>{
  if(ArdCheck && !ArdConnected){
    ArdConnected=true;
    console.log("-----ARDUINO CONNECTED-----");
  }
  else if(!ArdCheck && ArdConnected && !WS.IsPrinting){
    ArdConnected=false;
    console.log("------LOST CONNECTION------");
  }
  ArdCheck=false;
},3100);
