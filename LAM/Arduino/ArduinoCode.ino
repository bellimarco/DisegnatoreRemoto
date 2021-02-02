#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
HTTPClient http;

#define wifi "Sunrise_2.4GHz_232A19"
#define wifipass "2jqf22tpVqt5"
#define srvradress "http://192.168.1.23:8080"

#include <ArduinoJson.h>
//capacity gueassed with trial and error
DynamicJsonDocument QueueJson(9500);

#define dirpinY 14
#define steppinY 12
#define dirpinX 13
#define steppinX 15

#define servopin1 2
#define servopin2 0
#define servopin3 4
#define servopin4 5
#define servopinsend 16

//general setup variables
bool IsPrinting=false;
#define LogSerial true
#define WritePins true
#define WriteServo true
bool FastMode=false;
#define StallUpdateDelay 3000
#define ServoToggleDelay 1500
#define ServoUp 0
#define microstepX 8
#define microstepY 8

//variables specific to the current target
int Xtarg=0; int Ytarg=0;
int X=0; int Y=0;
int Label=1;
int letter = -1; int point = -1; //the target point being written
bool isup=true; //if the pen is up
bool Shouldisup=true; //if the pen should be up, received by WS
int ispress=130;//the press value that the pen has
int Shouldpress=130; //the press value the pen should have

//just variables needed to handle the steppers
double dtX=100000; double dtY=100000; //delay time for one toggle cycle
double TX = 0; double TY = 0;//reset to =micros() when new target is received
int LogT=0; int Logdt=200;//timer for the print of x,y while writing
bool toggleX = false; bool toggleY = false; //track digital HIGH/LOW
int microstepcountX = 0; int microstepcountY = 0; //trigger step increase

//if the X,Y have reached Xtarg,Ytarg, false when updated new current target
bool TargetReached=true;
//how many targets are left in the current Queue
int remaining=0;
int totsize=0;
int current=-1;


void setup() {  if(LogSerial){Serial.begin(115200);}
  
  WiFi.begin(wifi, wifipass);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    if(LogSerial){Serial.println("Connecting...");}
  }
  if(LogSerial){Serial.println("Connected!");}

  if(WritePins){
    pinMode(dirpinX,OUTPUT);
    pinMode(steppinX,OUTPUT);
    pinMode(dirpinY,OUTPUT);
    pinMode(steppinY,OUTPUT);
  }
  if(WriteServo){
    pinMode(servopin1,OUTPUT);
    pinMode(servopin2,OUTPUT);
    pinMode(servopin3,OUTPUT);
    pinMode(servopin4,OUTPUT);
    pinMode(servopinsend,OUTPUT);
    digitalWrite(16,HIGH);
    digitalWrite(2,HIGH);
    ServoSend(ServoUp);
  }

}//setup


void loop() {
  if(TargetReached){
    //if a new target is needed, but the queue is empty, request new queue
    //if the WSTargetQueue will be empty, a IsPrinting=false will be returned
    //must come before ArdFastUpdate because we need the queue, before it shifts of 1
    if(remaining==0){
      ArdQueueUpdate();
    }
    
    //when ready to go to next target, this function checks for
    //  early update signal, updates new target, or requests new update
    //works if fastmode off, if on only fastupdate during queueupdate
    if(!FastMode){ ArdFastUpdate(); }

    //makes the arduino stall in a loop(by not setting TargetReached=false)
    // IsPrinting=false triggers the delay of this stall loop in loop()
    if(!IsPrinting){
      if(LogSerial){Serial.println("\nReceived Not Printing Signal");}
      delay(StallUpdateDelay);
      //if fastmode on, check fastupdate also during stall
      if(FastMode){ ArdFastUpdate(); }
    }
    //if IsPrinting, check if there are more targets in the queue from
    //  the previous ArduinoUpdate, if yes update the new current target
    else if(remaining>0){
      SetNewTarget();
    }

  }
  else{
    GoTarget();
  }
    
  delayMicroseconds(10);
}//loop

void PenAscend(){
  if(WriteServo){ ServoSend(ServoUp); }
  isup=true;
  if(LogSerial){Serial.println("Pen Ascended!");}
}
void PenDescend(){
  if(WriteServo){ ServoSend(Shouldpress); }
  ispress=Shouldpress;
  isup=false;
  if(LogSerial){Serial.println("Pen Descended!, press: "+String(Shouldpress));}
}

//just updates the Queue of targets
void ArdQueueUpdate(){
  if(FastMode && totsize>0){
    //tell WS to shift the previous set from the queue
    ArdQueueShift(totsize);
  }
  while(true){
    http.begin(String(srvradress)+String("/ArdQueueUpdate"));
    int code = http.GET();
    if(code>0){
      const char* payload = const_cast<char*>(http.getString().c_str());
      deserializeJson(QueueJson, payload);
      JsonObject obj = QueueJson.as<JsonObject>();
      FastMode=obj[String("FastMode")];
      totsize=obj[String("totsize")];
      remaining=totsize;
      current=-1;
      if(remaining>0 && LogSerial){Serial.println("\nReceived Queue, remaining: "+String(remaining));}
      break;
    }
    else{if(LogSerial){Serial.println("\nGet ArdQueueUpdate Failed...");} delay(1000);}
    http.end();
  }
  //if fastmode on, fastupdate after queueupdate
  if(FastMode){ ArdFastUpdate(); }
}
//this function is called when a target is reached
void ArdFastUpdate(){
  while(true){
    http.begin(String(srvradress)+String("/ArdFastUpdate"));
    int code = http.GET();
    if(code>0){
      String payload = http.getString();
      int msg=payload.toInt();
      if(LogSerial){
        Serial.println("\nReceived FastUpdate, msg: "+String(msg));
      }
      //interpret the respone
      if(msg==0){IsPrinting=false;}
      else if(msg==1){IsPrinting=true;}
      //only call early ArdQueueUpdate if this msg comes
      else if(msg==2){ArdQueueUpdate(); IsPrinting=false; ArdFastUpdate();}

      break;
    }
    else{if(LogSerial){Serial.println("\nGet ArdFastUpdate Failed...");} delay(2000);}
    http.end();
  }
}
//shift n targets from the WS target queue
void ArdQueueShift(int n){
  while(true){
    http.begin(String(srvradress)+String("/ArdQueueShift/")+String(n));
    int code = http.GET();
    if(code>0){
      if(LogSerial){ Serial.println("\nShifted Queue, n: "+String(n)); }
      break;
    }
  }
}

void SetNewTarget(){
  TargetReached=false;
  current=totsize-remaining;
  remaining--;
  //set new target
  letter= QueueJson["Letter"][current];
  point= QueueJson["Point"][current];
  Label= QueueJson["Label"][current];
  Xtarg= QueueJson["Rtarg"][current];
  Ytarg= QueueJson["Atarg"][current];
  X= QueueJson["R"][current];
  Y= QueueJson["A"][current];
  dtX= QueueJson["dtR"][current];
  dtY= QueueJson["dtA"][current];
  Shouldisup= QueueJson["isup"][current];
  Shouldpress= QueueJson["press"][current];
  if(WritePins){
    if(Xtarg>X){ digitalWrite(dirpinX,LOW); }
    else{ digitalWrite(dirpinX, HIGH); }
    if(Ytarg>Y){ digitalWrite(dirpinY,LOW); }
    else{ digitalWrite(dirpinY, HIGH); }
  }
  if(LogSerial){
    Serial.println("CurrentTarget: "+String(letter)+","+String(point)+","+String(Label));
    Serial.println("Remaining: "+String(remaining)+"/"+String(totsize)); }
  if(Shouldisup && !isup){ PenAscend(); }
  else if((!Shouldisup && isup) || (Shouldpress!=ispress)){ PenDescend(); }
  if(LogSerial){
    Serial.println("dtx: "+String(dtX)+"  dty: "+String(dtY));
    Serial.println("Xtarg: "+String(Xtarg)+"  Ytarg: "+String(Ytarg));}
  TX = micros(); TY = micros();//if there is a target reset the timers
}

//moves the steppers to the target, and checks if the target is hit
void GoTarget(){
  if(X != Xtarg && micros()>=TX+dtX){
    TX += dtX;
    if(!toggleX){ toggleX = true; if(WritePins){digitalWrite(steppinX,HIGH);} }
    else{ toggleX = false; if(WritePins){digitalWrite(steppinX,LOW);}
      microstepcountX++;
      if(microstepcountX>=microstepX){
        microstepcountX=0;
        if(Xtarg-X>=0){ X++; } else{ X--; }
      }
    }
  }
  if(Y != Ytarg && micros()>=TY+dtY){
    TY += dtY;
    if(!toggleY){ toggleY = true; if(WritePins){digitalWrite(steppinY,HIGH);} }
    else{ toggleY = false; if(WritePins){digitalWrite(steppinY,LOW);}
      microstepcountY++;
      if(microstepcountY>=microstepY){
        microstepcountY=0;
        if(Ytarg-Y>0){ Y++; } else{ Y--; }
      }
    }
  }
  if(LogSerial && millis()>=LogT+Logdt){ LogT=millis();
    Serial.println("X: "+String(X)+"  Y: "+String(Y));
  }
  if(X==Xtarg && Y==Ytarg){
    TargetReached=true;
    if(LogSerial){Serial.println("TargetReached"); }
  }
}

void ServoSend(int x){
  digitalWrite(servopin1,x%2);
  digitalWrite(servopin2,int(x/2)%2);
  digitalWrite(servopin3,int(x/4)%2);
  digitalWrite(servopin4,int(x/8)%2);
  digitalWrite(servopinsend,LOW);
  delay(ServoToggleDelay);
  digitalWrite(servopin1,LOW);
  digitalWrite(servopin2,LOW);
  digitalWrite(servopin3,LOW);
  digitalWrite(servopin4,LOW);
  digitalWrite(servopinsend,HIGH);
  digitalWrite(2,HIGH);
}
