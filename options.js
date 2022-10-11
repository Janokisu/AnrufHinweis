const red = "red";
const green = "green";
const orange = "orange";
const FBox_URL = "http://fritz.box";

const AccessAllWebsitesPermissionRequest = {
  origins: ["http://*/*","https://*/*","file://*/*"]
};

let GL_alarm;
let GL_login = false;
let GL_password;
let GL_dumiPass = "************"
let GL_accessAllWebsitesPermission = [false, false]; // [0]=http://fritz.box; [1]=telLink


let Language_Array = ["de"];

let username        = document.getElementById("username");
let password        = document.getElementById("password");
let routeurl        = document.getElementById("rout_uri");
let alavoran        = document.getElementById("alarm_volume_range");

let save_button     = document.getElementById("save");
let tes_log_but     = document.getElementById("test_login");
let tes_pyt_but     = document.getElementById("test_python");
let tes_rou_but     = document.getElementById("test_router");
let tes_ala_but     = document.getElementById("test_alarm");
let tes_dia_but     = document.getElementById("test_dial");
let inp_num_but     = document.getElementById("in_num");

let help_link       = document.getElementById("help");
let download_link   = document.getElementById("download");

let lo_test         = document.getElementById("login_test");
let py_test         = document.getElementById("py_test");
let ro_test         = document.getElementById("router_test");
let alvolvi         = document.getElementById("alarm_volume_view");
let di_test         = document.getElementById("dial_test");
let innumer         = document.getElementById("in_num_error");



let check_num_reg   = document.getElementById("nummer_reagieren");
let check_num_anz   = document.getElementById("nummer_anzeigen");
let check_anum_anz  = document.getElementById("ange_nummer_anzeigen");
let check_nachrich  = document.getElementById("benach");
let check_verpasst  = document.getElementById("vpasst");
let check_pho_book  = document.getElementById("pbook");
let check_con_menu  = document.getElementById("contmenu");
let check_tel_link  = document.getElementById("telLink_offnen");

let num_list        = document.getElementById("nummer_liste");


function accessAllWebsites(x){
  return new Promise(function(resolve, reject) {
    if(x == 1){
      browser.permissions.request(AccessAllWebsitesPermissionRequest)
      .then(function(isPermission){
        resolve(isPermission);
      });
    }
    else if(x == 0){
      browser.permissions.contains(AccessAllWebsitesPermissionRequest)
      .then(function(isPermission){
        resolve(isPermission);
      });
    }
    else if(x == -1){
      if(GL_accessAllWebsitesPermission[0] == false && GL_accessAllWebsitesPermission[1] == false){
        //wenn Zugriffsrechte auf alle Webseiten nicht mehr benötigt werden, dann die Rechte entfernen
        browser.permissions.remove(AccessAllWebsitesPermissionRequest)
        .then(resolve(true));
      }
    }
  });
}


function login_test(i = 0){
    
    lo_test.style.background = orange;
    
    let rout_url = routeurl.value;
    let name = username.value.trim();
    let pass = password.value;
    if(pass == GL_dumiPass) pass = GL_password;
    
    if(name == ""){
        lo_test.innerText = browser.i18n.getMessage("ben_fehl");
        lo_test.style.background = red;
        return 1;
    }
    
    lo_test.innerText = browser.i18n.getMessage("send_fbox");
    
    
    let request = new XMLHttpRequest();
    
    request.open("POST", rout_url + ":49000/upnp/control/x_contact", true, name, pass);
    request.setRequestHeader("Content-Type","text/xml; charset=utf-8");
    request.setRequestHeader("SOAPAction", "urn:dslforum-org:service:X_AVM-DE_OnTel:1#GetCallList");
    request.setRequestHeader("Cache-Control", "no-cache");
    
    soapRequest = "<?xml version='1.0' encoding='utf-8'?>"+
        "<s:Envelope xmlns:s='http://schemas.xmlsoap.org/soap/envelope/' s:encodingStyle='http://schemas.xmlsoap.org/soap/encoding/'>"+
            "<s:Body>"+
                "<u:GetExternalIPAddress xmlns:u='urn:schemas-upnp-org:service:WANIPConnection:1' />"+
            "</s:Body>"+
        "</s:Envelope>";
    
    
    
    
    request.onreadystatechange = function(){
        //lo_test.innerText = "Verbindung wird aufgebaut<br>Status: " + request.readyState;
        lo_test.innerText = browser.i18n.getMessage("verb_aufbau");
        if(request.readyState == 4){
            //console.log(request.status);
            if (request.status == 200) {
                //console.info(request.responseText);
                lo_test.innerText = browser.i18n.getMessage("login_ok");
                lo_test.style.background = green;
                GL_login = true;
            } else if(i == 0){
                //console.warn("getLuaUrl", request.statusText, request.responseText);
                login_test(1);
            } else if (request.status == 401) {
                console.warn("getLuaUrl", request.statusText, request.responseText);
                lo_test.innerText = browser.i18n.getMessage("login 401");
                lo_test.style.background = red;
                GL_login = false;
            } else if (request.status == 500) {
                GL_login = false;
                lo_test.style.background = red;
                console.warn("getLuaUrl", request.statusText, request.responseText);
                
                let errorCode = request.responseXML.getElementsByTagName("errorCode")[0].firstChild.data;
                switch(errorCode){
                  case "401":
                    lo_test.innerText = browser.i18n.getMessage("fbox 401");
                    break;
                  case "606":
                    lo_test.innerText = browser.i18n.getMessage("fbox 606");
                    break;
                  default:
                    lo_test.innerText = browser.i18n.getMessage("Fritz!Box error", request.statusText + request.responseText);
                    break;
                }
            } else {
                console.warn("getLuaUrl", request.statusText, request.responseText);
                lo_test.innerText = browser.i18n.getMessage("login error", request.statusText + request.responseText);
                lo_test.style.background = red;
                GL_login = false;
            }
        }
    }
    
    

    request.send(soapRequest);
    
}



function change_volume(x){
    GL_alarm.volume = Number(x)/100;
    alvolvi.innerText = x + "%";
}

ruf_togg = false;
function ruf(){
    if(ruf_togg == false){
        ruf_togg = true;
        GL_alarm.play();
        tes_ala_but.value = "⏹";
    }
    else{
        ruf_togg = false;
        GL_alarm.pause();
        GL_alarm.currentTime = 0;
        tes_ala_but.value = "▶";
    }
}

// ------------------------------- python test ----------------------------------------

function python_test_start(){
    py_test.style.background = orange;
    //init python-Datei
    
    let PyListen = new PythonListen(); // <-- tools.js
    
    
    PyListen.push = function(evt){
      console.log("push: ", evt);
    }


    PyListen.errorEvent = function(evt){
      console.warn("errorEvent: ", evt);
      
      PyListen.stop();
      
      py_test.style.background = red;
      
      switch(evt.code){
        case 0:
          console.warn("diskontet:\n", evt.message);
          py_test.innerText = browser.i18n.getMessage("py_error", evt.message);
        break;
        
        case 3:
          py_test.innerText =  browser.i18n.getMessage("CallMon_gai_error");
        break;
        
        case 5:
          py_test.innerText = browser.i18n.getMessage("CallMon_port_error");
        break;
        
        default:
          py_test.innerText = browser.i18n.getMessage("sonstige_fehler") + ":\n" + evt.message;
      }
    }
    
    
    PyListen.statechange = function(evt){
      console.log("statechange: ", evt);
      
      if(evt == 5){
        py_test.innerText = browser.i18n.getMessage("CallMon_aktiv", [PyListen.getPyVer(), PyListen.getCallMonVer()]);
            
        if(PyListen.getCallMonVer() == CallMon_Version){
          py_test.style.background = green;
        }
        else{
          py_test.style.background = orange;
          alert(browser.i18n.getMessage("CallMon_alt", [CallMon_Version, PyListen.getCallMonVer()]))
        }
        
        PyListen.stop();
      }
    }
    

    
    console.log("Verbinde zur Pythondatei");
    py_test.innerText = browser.i18n.getMessage("py_verb");
    
    PyListen.start();
    
    console.log("Sending:  ping");
    PyListen.send("ping");
    
    py_test.innerText = browser.i18n.getMessage("test_CallMon");
    let FBox = routeurl.value.split("//")[1];
    console.log("Sending: listen_" + FBox);
    PyListen.send("listen_" + FBox);
}



//------------------------------------------- dial test ----------------------------------------

function dialTestStart(){
	
	di_test.innerText = "???";
	di_test.style.background = orange;
	
	if(GL_login == true){
        di_test.innerText = "";
        
        let pass = password.value;
        if(pass == GL_dumiPass) pass = GL_password;
		
		
		SoapClient({
			"location": routeurl.value.trim() + ":49000" + "/upnp/control/x_voip",
			"uri":      "urn:dslforum-org:service:X_VoIP:1",
			"login":    username.value.trim(),
			"password": pass,
			"methode":  "X_AVM-DE_DialGetConfig"
		}).then(getDialConfig, onError);
	}
	else di_test.innerText = browser.i18n.getMessage( "first_logintest" ) //"Zuerst erfolgreichen <br>Logintest durchführen"
}


function getDialConfig(request){
    //console.log(request);
    
    if(request.responseXML.getElementsByTagName("NewX_AVM-DE_PhoneName")[0].firstChild){
        let data = request.responseXML.getElementsByTagName("NewX_AVM-DE_PhoneName")[0].firstChild.data
        console.warn(data);
		
		
		if(data == "unconfigured"){
			di_test.innerText = browser.i18n.getMessage("pop_dialError");
			di_test.style.background = red;
		}
		else{
			di_test.innerText = data;
			di_test.style.background = green;
		}
    }
}




function router_connection(){

    ro_test.style.background = orange;
    
    let rout_url = routeurl.value.trim();
    
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        //console.log(request.readyState);
        //ro_test.innerText = "Verbindung wird aufgebaut<br>Status: " + request.readyState;
        ro_test.innerText = browser.i18n.getMessage("router_verb");
        if(request.readyState == 4){
            //console.info(request.status);
            if(request.status == 200){
                console.log(request.responseText);
                let text = request.responseText.split("<body>")[1].split("</body>")[0];
                let tags = text.split("-");
                ro_test.innerText = tags[0]+"\n"+tags[7].slice(-4,-2)+"."+tags[7].slice(-2);
                ro_test.style.background = green;
                
            } 
            else{
                ro_test.innerText = browser.i18n.getMessage("router_error", [rout_url, request.statusText+request.responseText]);
                ro_test.style.background = red;
            }
        }
    }
    console.info(rout_url + "/cgi-bin/system_status")
    request.open("GET", rout_url + "/cgi-bin/system_status", true);
    request.send();
}


// ---------------------------------------------------------------------------------------------------------------------

tes_ala_but.addEventListener("click", function(){
    ruf();
});

alavoran.addEventListener("input", function(range){
    change_volume(range.target.valueAsNumber);
});


check_nachrich.addEventListener("change", function(check){
    if(check.target.checked == true){
        browser.permissions.request({permissions: ["notifications"]})
        .then(function(isPermission) {
            if(!isPermission) check.target.checked = false;
        });
    }
    else{
        browser.permissions.remove({permissions: ["notifications"]});
    }
});




document.getElementById("telLink_offnen_error").addEventListener("click", function(evt){
  if(document.getElementById("telLink_offnen_error").innerText != ""){
    accessAllWebsites(1)
    .then(function(isPermission) {
      if(isPermission == true){
        telLink_show_break(0);
        browser.runtime.sendMessage({
          "settings_change": true
        });
      }
    });
  }
});

function telLink_show_break(x){
  if(x == 1){
    document.getElementById("telLink_offnen_error").innerText = browser.i18n.getMessage("erl_verw");
    document.getElementById("telLink_offnen_error").className = "telLink_offnen_error_vis";
  }
  else{
    document.getElementById("telLink_offnen_error").innerText = "";
    document.getElementById("telLink_offnen_error").className = "";
  }
}

check_tel_link.addEventListener("change", function(check){


    
    GL_accessAllWebsitesPermission[1] = check_tel_link.checked;
    
    telLink_show_break(0);
    
    
    
    if(check.target.checked == true){
      accessAllWebsites(1)
      .then(function(isPermission) {
        if(isPermission == false){
          telLink_show_break(1);
        }
      });
    }
});


browser.permissions.onAdded.addListener((result) => {permissions_listener(true, result)});
browser.permissions.onRemoved.addListener((result) => {permissions_listener(false, result)})
function permissions_listener(state, result) {
    //console.warn("change: ", state, result);
    
    switch(result.permissions[0] || result.origins[0]){
        case "notifications":
            check_nachrich.checked = state;
        break;
        case "http://*/*":
        case "https://*/*":
            if(state == false){
              //Rechte "auf alle Seiten zugreifen" wurden über die Rechteeinstellung geändert
              if(check_tel_link.checked == true){
                // Telefonnummer-Links
                telLink_show_break(1);
              }
              
              if(check_url_Fbox() == false){
                // Fritzbox Verbindung
                //console.warn("web", state);
                alert( browser.i18n.getMessage("keine_http_rechte") );
              }
            }
        break;
    }
}


function check_url_Fbox(){
    let prot = routeurl.value.trim().split("://");
    let rout_url = prot[1].split("/")[0];
    routeurl.value = prot[0] + "://" + rout_url; //http://xyz.de/text/texttext => http://xyz.de
    
    if(rout_url == "fritz.box") return true;
    else return false;
}


function http_check(funct, element, py=false){
    
    let check_url = check_url_Fbox();
    
    let fritz = [FBox_URL+"/*"];
    if(check_url == false){
      fritz = ["http://*/*","https://*/*"];
      GL_accessAllWebsitesPermission[0] = true;
    }
    else{
      GL_accessAllWebsitesPermission[0] = false;
    }

    let permissionsToRequest;
    if(py === true){
        permissionsToRequest = {
          permissions: ["nativeMessaging"],
          origins: fritz
        }
    }
    else{
        permissionsToRequest = {
          origins: fritz
        }
    }
     
     
    browser.permissions.request(permissionsToRequest)
    .then(function(isPermission) {
        if(isPermission){
          if(check_url == false){
            GL_accessAllWebsitesPermission[0] = true;
            
            telLink_show_break(0);
          } else {
            GL_accessAllWebsitesPermission[0] = false;
          }
          
          funct();
        }
        else{
            element.innerText = browser.i18n.getMessage("erl_verw");
            element.style.background = red;
        }
    });
}





// testfunction 
document.getElementById("test_ring").addEventListener("click", function(){
	//browser.browserAction.getPopup({}).then(console.info);
	console.info( browser.browserAction.getPopup({}) )
});

// testfunction 
document.getElementById("test_disc").addEventListener("click", function(){

});

// testfunction 
document.getElementById("test_conn").addEventListener("click", function(){

});

// testfunction 
document.getElementById("test_call").addEventListener("click", function(){

});



tes_log_but.addEventListener("click", function(){
    http_check(login_test, lo_test);
});

tes_pyt_but.addEventListener("click", function(){
    http_check(python_test_start, py_test, true);
});

tes_rou_but.addEventListener("click", function(){
    http_check(router_connection, ro_test);
});


tes_dia_but.addEventListener("click", function(){
    dialTestStart();
});





save_button.addEventListener("click", function(){
    
    let pas = password.value
    if(pas == GL_dumiPass) pas = GL_password;
    
    let num_reg_ch = check_num_reg.checked;
    let num_anz_ch = check_num_anz.checked;
    if(num_list.value.trim() == "" && (num_reg_ch == true || num_anz_ch == true)){
        num_list.style.borderColor = "red";
        num_reg_ch = false;
        num_anz_ch = false;
    }
    else num_list.style.borderColor = "";
    
    
    let option = {
        "name": username.value.trim(),
        "pass": pas,
        "FUrl": routeurl.value,
        "num_reg": num_reg_ch,
        "num_anz": num_anz_ch,
        "anum_anz": check_anum_anz.checked,
        "num_list": num_list.value.trim().split("\n"),
        "alarm_vol": GL_alarm.volume,
        "verpa_anz": check_verpasst.checked,
        "phbonu_anz": check_pho_book.checked,
        "conmenu_ok": check_con_menu.checked,
        "telLink_ok": check_tel_link.checked,
    }
    
    browser.storage.local.set({
        "option": option
    });
    


    browser.runtime.sendMessage({
        "settings_change": true
    });
        
    /*
    browser.storage.local.remove(
      "option"
    );
    */
    
     GL_accessAllWebsitesPermission[0] != check_url_Fbox();
     GL_accessAllWebsitesPermission[1] = check_tel_link.checked;
    accessAllWebsites(-1);
    
});


inp_num_but.addEventListener("click", function(){
    if(GL_login == true){
        innumer.innerText = "";
        
        let pass = password.value;
        if(pass == GL_dumiPass) pass = GL_password;
    
        SoapClient({
            "location": routeurl.value.trim() + ":49000" + "/upnp/control/x_voip",
            "uri":      "urn:dslforum-org:service:X_VoIP:1",
            "login":    username.value.trim(),
            "password": pass,
            "methode":  "X_AVM-DE_GetNumbers"
        }).then(getTelNummern, onError);
    }
    else innumer.innerText = browser.i18n.getMessage( "first_logintest" ) //"Zuerst erfolgreichen <br>Logintest durchführen"
});






/*

document.getElementById("testi").addEventListener("click", function(){
    console.log("start");
    accessAllWebsites(1)
});

document.getElementById("testi2").addEventListener("click", function(){
    console.log("stop");
    accessAllWebsites(-1)
});

document.getElementById("testi3").addEventListener("click", function(){
    console.log("los");
    XXX.send("listen_fritz.box");
});

//*/



function init(x){
  
  //browser.tabs.query( {} , console.log);
  
    if(x == "start"){
		
		username.placeholder = browser.i18n.getMessage("username");
		password.placeholder = browser.i18n.getMessage("password");
		
        GL_alarm = new Audio("sound/telefon.ogg");
        GL_alarm.loop = true;
        
        browser.permissions.contains({permissions: ["notifications"]})
        .then(function(result){
            check_nachrich.checked = result;
            
        });
        
        
        let langu = browser.i18n.getUILanguage().split("-")[0];
        //console.log(langu)
        let tmp = -1;
        for(i in Language_Array){
            if(Language_Array[i] == langu){
                tmp = i;
                break;
            }
        }
		let lang = Language_Array[ tmp ];
        
        if(tmp == -1 || lang == "en"){
			help_link.href = "help/help.html";
		}
        else{
			help_link.href = "help/help_" + lang + ".html";
		}
		
        help_link.title = browser.i18n.getMessage( "help" )
        
        
        if(navigator.platform.indexOf("Win") > -1){
            //Windows
            download_link.href = "CallMonitor_win.zip";
        }
        else if(navigator.platform.indexOf("Mac") > -1){
            //Macsystem
            download_link.href = "CallMonitor_unix.zip";
        }
        else{
            //evtl. Linux
            download_link.href = "CallMonitor_unix.zip";
        }
        
        browser.storage.local.get("option").then(init, onError);
    }
    else if( x.hasOwnProperty("option") ){
        let opt = x["option"];
        username.value = opt["name"];
        
        if(opt["name"] != "") password.value = GL_dumiPass;
        GL_password = opt["pass"];
        
        routeurl.value = opt["FUrl"];
        
        check_num_reg.checked = opt["num_reg"];
        check_num_anz.checked = opt["num_anz"];
        check_anum_anz.checked = opt["anum_anz"];
        check_verpasst.checked = opt["verpa_anz"];
        check_pho_book.checked = opt["phbonu_anz"];
        check_con_menu.checked = opt["conmenu_ok"];
        
        check_tel_link.checked = opt["telLink_ok"];
        GL_accessAllWebsitesPermission[1] = opt["telLink_ok"];
        if(opt["telLink_ok"] == true){
           accessAllWebsites(0)
          .then(function(result){
            if(result == false){
              telLink_show_break(1);
            }
          });
        }
        
        num_list.value = opt["num_list"].join("\n");
        
        let tmp = opt["alarm_vol"] * 100;
        alavoran.value =  tmp;
        change_volume(tmp);
        
        //Rechte für alle Seiten entfernen, wenn es nicht mehr gebruacht wird
        GL_accessAllWebsitesPermission[0] != check_url_Fbox();
        GL_accessAllWebsitesPermission[1] = check_tel_link.checked;
        accessAllWebsites(-1);
    }
}


function getTelNummern(request){
    console.log(request);
    
    if(request.responseXML.getElementsByTagName("NewNumberList")[0].firstChild){
        let data = request.responseXML.getElementsByTagName("NewNumberList")[0].firstChild.data
        
        let parser = new DOMParser();
        let xmlDoc = parser.parseFromString(data,"text/xml");
        //console.warn(xmlDoc);
        
        let tmp = "";
        for(nummer of xmlDoc.getElementsByTagName("Number")){
            tmp += nummer.childNodes[0].nodeValue + "\n";
        }
        
        if(num_list.value.trim() == "") num_list.value = tmp;
        else num_list.value += "\n" + tmp;
    }
}



init("start");
