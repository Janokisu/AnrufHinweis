const CallMon_Version = "0.2";


// Error
function onError(error) {
  console.error("Error: ", error);
}


//insert Language 

function treeWalk(node){
  do{
    //console.log("node: ", node.tagName);
    if( node.dataset.hasOwnProperty("i18n") ){
      let data_i18n = node.dataset["i18n"];
      //console.log("data_i18n: ", data_i18n);
      
      if(node.tagName == "INPUT"){
        node.value = browser.i18n.getMessage( data_i18n );
      }
      else{
        node.innerText = browser.i18n.getMessage( data_i18n );
      }
    }
    
    
    if(node.firstElementChild != null){
      treeWalk(node.firstElementChild);
    }
    node = node.nextElementSibling;
    
  } while(node != null);
}


function set_language(){
  let main_node = document.body.firstChild.nextElementSibling;
  treeWalk(main_node);
}

//start setting
set_language();




function insertXML(value){
  let tmp = ""
  for(xml in value){
    tmp += "<" + xml + ">" + value[xml] + "</" + xml + ">";
  }
  
  return tmp;
}


function SoapClient(obj, i = 0){
  return new Promise(function(resolve, reject) {
    
    let location = "";
    let uri = "";
    let login = "";
    let password = "";
    let methode = "";
    let insert = "";
    
    if(obj.hasOwnProperty("location") ){
      location  = obj["location"];
    }
    
    if(obj.hasOwnProperty("uri") ){
      uri     = obj["uri"];
    }
    
    if(obj.hasOwnProperty("login") ){
      login     = obj["login"];
    }
    
    if(obj.hasOwnProperty("password") ){
      password  = obj["password"];
    }
    
    if(obj.hasOwnProperty("methode") ){
      methode   = obj["methode"];
    }
    
    if(obj.hasOwnProperty("insert") ){
      insert    = obj["insert"];
    }
    
    // --------------------------------------------------
    
      
    let request = new XMLHttpRequest();
    
    request.open("POST", location, true, login, password);
    request.setRequestHeader("Content-Type","text/xml; charset=utf-8");
    request.setRequestHeader("SOAPAction", uri + "#" + methode);
    request.setRequestHeader("Cache-Control", "no-cache");
    
    
    
    soapRequest = "<?xml version='1.0' encoding='UTF-8'?>"+
      "<SOAP-ENV:Envelope xmlns:SOAP-ENV='http://schemas.xmlsoap.org/soap/envelope/' "+
      "xmlns:ns1='" + uri + "' "+
      "xmlns:xsd='http://www.w3.org/2001/XMLSchema' "+
      "xmlns:xsi='http://www.w3.org/2001/XMLSchema-instance' "+
      "xmlns:SOAP-ENC='http://schemas.xmlsoap.org/soap/encoding/' "+
      "SOAP-ENV:encodingStyle='http://schemas.xmlsoap.org/soap/encoding/'>"+
        "<SOAP-ENV:Body>"+
            "<ns1:" + methode + ">"+
               insertXML(insert) +
            "</ns1:" + methode + ">"+
        "</SOAP-ENV:Body>"+
      "</SOAP-ENV:Envelope>";


    request.onreadystatechange = function(){
      if(request.readyState == 4){
        //console.log(request.status);
        if(request.status == 200){
          //console.warn(request.responseText);
          resolve( request );
        } 
        else if(request.status == 401 && i == 0){
          //console.warn("getLuaUrl 401", request.statusText, request.responseText);
          /*
          SoapClient(obj, 1).then(
            (res) => { resolve( res ); },
            (rej) => { reject( rej ); }
          );
          */
          SoapClient(obj, 1)
          .then(resolve, reject);
        } 
        else{
          //console.warn("getLuaUrl", request.statusText, request.responseText);
          reject({
            location: location,
            status: request.status,
            statusText: request.statusText,
            responseText: request.responseText
          });
        }
      } 
    }

    request.send(soapRequest);
  });
}



function XHttpRequest(url){
  return new Promise(function(resolve, reject) {
      
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    
    request.onreadystatechange = function(){
        
      if(request.readyState == 4){
        //console.log(request.status);
        if(request.status == 200){
          //console.log(request.responseText);
          resolve( request );
        }
        else{
          reject({
            url: url,
            status: request.status,
            statusText: request.statusText,
            responseText: request.responseText
          });
        }
      }
    }
    
    request.send();
  });
}


function put0(x){
  if(x < 10){
    return "0"+x;
  }
  else{
    return x;
  }
}


function sektozeit(sek){
  

  let s = put0(sek % 60);
  let m = put0(Math.floor( (sek % 3600) / 60 ));
  let h = put0(Math.floor(sek / 3600));
  
  return h+":"+m+":"+s;
}


class PythonListen{
  
  #port = null;
  #state = 0;
  #running = false;
  #thisTimeout = 0;
  
  #PyVer = "?.?";
  #CallMonVer = "?.?";
   
  
  isRunning(){
    return this.#running;
  }
  
  getPyVer(){
    return this.#PyVer;
  }
  
  getCallMonVer(){
    return this.#CallMonVer;
  }
   
  getState(){
    return this.#state;
  }
  
  
  connect(){
  const self = this; //damit die Lister einen Bezug haben
  
  
  if(this.#running == true){
    console.warn("Verbindung besteht bereits")
    return 0;
  }
  
  let ok = true;
  
  this.#running = true;
  
  try{
    this.#port = browser.runtime.connectNative("CallMonitor"); // <--- pythonverweis
    
    this.#port.onDisconnect.addListener(function(e){
    
      self.stop();
      
      self.errorEvent({
        "state": 0,
        "code": 0,
        "message": e.error
      });
    });
    
    
    this.#port.onMessage.addListener(function(response){
      self.#messageHandle(self, response);
    }); 
  }
  catch(e){
    this.stop();
    ok = false;
  }
  
    return ok;
  }
  
  start(){
    if(this.connect() == true){
      if(this.send("version") == true){
      
        const self = this; //Bezug herstellen
        this.#thisTimeout = setTimeout(() => {
          //es dauert aufällig lange. evtl noch ne alte Version
          self.errorEvent({
          "state": 0,
          "code": 0,
          "message": "\n" + browser.i18n.getMessage("CallMon_alt", [CallMon_Version, self.getCallMonVer()])
          });
        }, 2*1000);
      
        return true;
      }
      else{
        return false;
      }
    } 
    else{
      return false;
    }
  }
  
  stop(){
    if(this.#port){
      this.#port.disconnect();
      this.#port = null;
    }
    
    this.#running = false;
    return true;
  }
  
  send(value){
    if(this.#port){
      this.#port.postMessage(value+"");
      return true;
    }
    else{
      return false;
    }
  }
  
  errorEvent = function(object){};
  
  statechange = function(object){};
  
  callMon = function(object){};
  
  push = function(object){};
  
  #messageHandle(self, response){
    //console.log("Received: " + response);
    
    let info = response.split(";");
    
    switch(info[0]){
      case "error":
        let tmp = info.concat();
        tmp.splice(0,2);
        self.errorEvent({
          "state": self.#state,
          "code": Number(info[1]),
          "message": tmp.join(";")
        });
      break;
      
      case "state":
        clearTimeout(self.#thisTimeout);
        
        if(info[1]){
          self.#state = Number(info[1]);
        }
        
        self.statechange(self.#state);
      break;
      
      case "version":
        if(info[1]){
          self.#PyVer = info[1];
        }
        
        if(info[2]){
          self.#CallMonVer = info[2];
        }
      break;
      
      case "call":
        self.callMon(info);
      break;
      
      default:
        self.push(info);
    }
  }
  
}