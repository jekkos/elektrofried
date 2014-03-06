#include <Bounce.h>
#include <TimerOne.h>

Bounce buttonLinks = Bounce(0,10);  // knop links op pin0
Bounce buttonRechts = Bounce(1,10); // knop rechts op pin 1
int links = 0;  // status knop links
int rechts = 0;  // status knop rechts
int shock = 0;  // status shock
char mode = 'd';   // mode van de teensy
char oldMode;   // mode change checker
int ledLinks = 5;   // knop links led
int ledRechts = 9;  // knop rechts led
int fadeLinks, fadeRechts; // fade parameters voor links en rechts
int fadeState = HIGH;

static unsigned char exp_map[256]={
  0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,1,1,1,1,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,
  3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,4,4,4,4,4,4,4,5,5,5,
  5,5,5,5,5,6,6,6,6,6,6,6,7,7,7,7,7,7,8,8,8,8,8,8,9,9,
  9,9,10,10,10,10,10,11,11,11,11,12,12,12,13,13,13,13,
  14,14,14,15,15,15,16,16,16,17,17,18,18,18,19,19,20,
  20,20,21,21,22,22,23,23,24,24,25,26,26,27,27,28,29,
  29,30,31,31,32,33,33,34,35,36,36,37,38,39,40,41,42,
  42,43,44,45,46,47,48,50,51,52,53,54,55,57,58,59,60,
  62,63,64,66,67,69,70,72,74,75,77,79,80,82,84,86,88,
  90,91,94,96,98,100,102,104,107,109,111,114,116,119,
  122,124,127,130,133,136,139,142,145,148,151,155,158,
  161,165,169,172,176,180,184,188,192,196,201,205,210,
  214,219,224,229,234,239,244,250,255
};

void setup() {
    pinMode(0, INPUT_PULLUP);
    pinMode(1, INPUT_PULLUP);
    pinMode(ledLinks, OUTPUT);
    pinMode(ledRechts, OUTPUT);
    Serial.begin(9600);
    delay(1000);
    Timer1.initialize(4000); //elke 0.06 sec
    Timer1.attachInterrupt(ledFader); // calls ledFader function
}

/* ledFader function */
/* fades led in out if in demo mode */
void ledFader(){
  if (mode == 'd'){
    if (fadeLinks > 254 && fadeRechts > 254) {
      fadeState = LOW;
    } else if (fadeLinks < 1 && fadeRechts < 1){
      fadeState = HIGH;
    }
    
    analogWrite(ledLinks, 255-exp_map[fadeLinks]);
    analogWrite(ledRechts, 255-exp_map[fadeRechts]);
    
    if (fadeState == HIGH) {
      fadeLinks++;
      fadeRechts++;
    } else {
      fadeLinks--;
      fadeRechts--;
    }
    
  }
}

/* ledController function */
/* switches leds on or off depending on mode */
/* keeps track of mode and only switches on change*/
void ledController (){
  if (oldMode != mode){
    if (mode == 'b'){
      digitalWrite(ledLinks, HIGH);
      digitalWrite(ledRechts, HIGH);
    } else {
      digitalWrite(ledLinks, LOW);
      digitalWrite(ledRechts, LOW);
    }
    oldMode = mode;
  }
}

/* sendStatus function */
/* send the status of the buttons & shock status & mode */ 
void sendStatus (){
  Serial.print(links);
  Serial.print(rechts);
  Serial.print(shock);
  Serial.println(mode);
}


void loop() {
  buttonLinks.update();
  buttonRechts.update();
  
  if (buttonLinks.fallingEdge()){
    Keyboard.set_modifier(MODIFIERKEY_SHIFT);
    Keyboard.set_key1(KEY_LEFT);
    Keyboard.send_now();
    Keyboard.set_modifier(0);
    Keyboard.set_key1(0);
    Keyboard.send_now();
    links = 1;
    sendStatus();
  }
  
  if (buttonRechts.fallingEdge()){
    Keyboard.set_modifier(MODIFIERKEY_SHIFT);
    Keyboard.set_key1(KEY_RIGHT);
    Keyboard.send_now();
    Keyboard.set_modifier(0);
    Keyboard.set_key1(0);
    Keyboard.send_now();
    rechts = 1;
    sendStatus();
  }
  
  if(buttonLinks.risingEdge()){
    Keyboard.set_key1(KEY_LEFT);
    Keyboard.send_now();
    Keyboard.set_key1(0);
    Keyboard.send_now();
    links = 0;
    sendStatus();
  }
  
  if(buttonRechts.risingEdge()){
    Keyboard.set_key1(KEY_RIGHT);
    Keyboard.send_now();
    Keyboard.set_key1(0);
    Keyboard.send_now();
    rechts = 0;
    sendStatus();
  }
  
  if (Serial.available() > 0){
    switch(Serial.read()){
      case 's':
        // allow shocks
        shock = 1;
        sendStatus();
      break;
      case 'e':
        // disallow shocks
        shock = 0;
        sendStatus();
      break;
      case 'x':
        if (shock == 1) {
          // zet shocks op pin10
          tone(10,38000,80);
        }
      break;
      case 'y':
        if (shock == 1) {
          // zet shocks op pin12
          tone(12,5000,300);
        }
      break;
      case 'd':
        // demo mode
        mode = 'd';
        sendStatus();
      break;
      case 'l':
        // light mode
        mode = 'l';
        ledController ();
        sendStatus();
      break;
      case 'b':
        // black mode
        mode = 'b';
        ledController ();
        sendStatus();
      break;
    }
  }   
}


