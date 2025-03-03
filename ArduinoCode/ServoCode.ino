#define pinIn1 6
#define pinIn2 5
#define pinIn3 4
#define pinIn4 3
#define pinInSgn 2
#define servopin 11

#define LogSerial true
#define ServoToggleDelay 1500
#define StallUpdateTime 300

int pinVal=0;

void setup() {
  if(LogSerial){ Serial.begin(9600); }
  
  pinMode(pinIn1,INPUT);
  pinMode(pinIn2,INPUT);
  pinMode(pinIn3,INPUT);
  pinMode(pinIn4,INPUT);
  pinMode(pinInSgn,INPUT);
  pinMode(servopin,OUTPUT);
  analogWrite(servopin,100);
}

void loop() {
  delay(StallUpdateTime);
  if(!digitalRead(pinInSgn)){
    pinVal=0;
    if(digitalRead(pinIn1)){
      pinVal+=1;
    }
    if(digitalRead(pinIn2)){
      pinVal+=2;
    }
    if(digitalRead(pinIn3)){
      pinVal+=4;
    }
    if(digitalRead(pinIn4)){
      pinVal+=8;
    }
    if(LogSerial){
      Serial.println(pinVal);
      Serial.println(String(digitalRead(pinIn1))+", "+String(digitalRead(pinIn2))+", "+String(digitalRead(pinIn3))+", "+String(digitalRead(pinIn4)));
    }
    analogWrite(servopin,75+pinVal*7);
    delay(ServoToggleDelay);
  }
  
}
