const red = "red";
const green = "green";
const ora = "orange";

let GL_alarm;
let GL_login = false;
let GL_py_ver;
let GL_password;
let GL_dumiPass = "************"

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

let num_list        = document.getElementById("nummer_liste");




function login_test(i = 0){
    
    lo_test.style.background = ora;
    
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



/*
 * 
 * python_test_start() -> python_testsignal() -> py_port_listener() -> (OK)
 *                                                                     (x) ->   python_timeout()
 *
*/

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

let port="";
let py_ok = false;
let py_timeout=0;
function python_test_start(){
    py_ok = true;
    py_test.style.background = ora;
    //init python-Datei
    if(port.onMessage && port.onMessage.hasListener(py_port_listener) ){
        port.onMessage.removeListener(py_port_listener) 
    }
    console.log("Verbinde zur Pythondatei");
    py_test.innerText = browser.i18n.getMessage("py_verb");
    
    if(port) port.disconnect();
    port = browser.runtime.connectNative("CallMonitor"); // <--- pythonverweis
    port.onDisconnect.addListener(function(e){
      py_ok = false;
      console.warn("diskontet:\n", e.error);
      py_test.innerText = browser.i18n.getMessage("py_error", e.error);
      py_test.style.background = red;
    });
    port.onMessage.addListener(py_port_listener);
    
    
    clearTimeout(py_timeout);
    python_testsignal();
}



function python_testsignal(){
    console.log("Sende Testsignal");
    py_test.innerText = browser.i18n.getMessage("testsignal");
    console.log("Sending:  ping");
    port.postMessage("ping");
    console.log("Sending:  version");
    port.postMessage("version");
    
    
    py_timeout = setTimeout(() => {
        if(py_ok == true) python_timeout();
    }, 2000);
}


function py_port_listener(response){
    console.log("Received: " + response);
    
    if(response == "pong"){
        clearTimeout(py_timeout);
        
        py_ok = true;
        py_test.innerText = browser.i18n.getMessage("test_CallMon");
        let FBox = routeurl.value.split("//")[1];
        console.log("Sending: listen_" + FBox);
        port.postMessage("listen_" + FBox);
        //py_test.style.background = green;
        
    }
    else{
        let info = response.split(";");
        if(info[0] == "version"){
            GL_py_ver = info[1];
        }
        else if(info[0] == "error"){
            if(port) port.disconnect();
            
            py_test.style.background = red;
            if(info[1].indexOf("socket.error:") > -1) py_test.innerText = browser.i18n.getMessage("CallMon_port_error");
            else py_test.innerText = "Fehler:\n" + info[1];
        }
        else if(response == "Warte auf Ereignis ..."){
            if(port) port.disconnect();
            py_test.innerText = browser.i18n.getMessage("CallMon_aktiv", GL_py_ver);
            py_test.style.background = green;
            
            browser.runtime.sendMessage({
                "python erreichbar": true
            });
        }
        else py_test.innerText = response;
    }
}


function python_timeout(){
    if(py_ok == false){
        py_test.innerText = browser.i18n.getMessage("no_signal");
        py_test.style.background = red;
    }
}


//------------------------------------------- dial test ----------------------------------------

function dialTestStart(){
	
	di_test.innerText = "???";
	di_test.style.background = ora;
	
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

    ro_test.style.background = ora;
    
    let rout_url = routeurl.value.trim();
    
    let request = new XMLHttpRequest();
    request.onreadystatechange = function(){
        //console.log(request.readyState);
        //ro_test.innerText = "Verbindung wird aufgebaut<br>Status: " + request.readyState;
        ro_test.innerText = browser.i18n.getMessage("router_verb");
        if(request.readyState == 4){
            //console.info(request.status);
            if(request.status == 200){
                //console.log(request.responseText);
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
            if(state == false && check_url_Fbox() == false){
                //console.warn("web", state);
                alert( browser.i18n.getMessage("keine_http_rechte") );
            }
        break;
    }
}


function check_url_Fbox(){
    let prot = routeurl.value.trim().split("://");
    let rout_url = prot[1].split("/")[0];
    routeurl.value = prot[0] + "://" + rout_url;
    
    if(rout_url == "fritz.box") return true;
    else return false;
}


function http_check(funct, element, py=false){
    
    let fritz = "http://fritz.box/*"
    if(!check_url_Fbox()) fritz = "http://*/*";

    let permissionsToRequest;
    if(py === true){
        permissionsToRequest = {
          permissions: ["nativeMessaging"],
          origins: [fritz]
        }
    }
    else{
        permissionsToRequest = {
          origins: [fritz]
        }
    }
    
    browser.permissions.request(permissionsToRequest)
    .then(function(isPermission) {
        if(isPermission) funct();
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
    
    check_url_Fbox();
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


function init(x){
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
        num_list.value = opt["num_list"].join("\n");
        
        let tmp = opt["alarm_vol"]* 100;
        alavoran.value =  tmp;
        change_volume(tmp);
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
