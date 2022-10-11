
//source: https://github.com/mdn/webextensions-examples/tree/master/native-messaging

/*
On startup, connect to the "CallMonitor" app.
*/

// ----------------------- background ----------------------------------

const PhonebookList_typ = {
		"home" : "🏠",
		"mobile" : "📱",
		"work" : "💼",
		"fax" : "📠"
}



let port="";
let GL_username;
let GL_password;
let GL_Fritz_URL;

let GL_check_num_reg;
let GL_check_num_anz;
let GL_check_anum_anz;

let GL_only_num_reg;

let GL_modi = 0;
let GL_modi_check = false;

let GL_alarm = new Audio("sound/telefon.ogg");
GL_alarm.loop = true;

GL_verpa_anz = false;
GL_executeScript = false;

GL_phone_book = false;
GL_phone_book_list = {};
GL_phone_book_list2 = {};

GL_call_list = [];
GL_call_list_popup = "loading";
GL_call_list_popup_raw = [];
GL_phone_list_popup = "loading";
GL_phone_list_popup_raw = [];



let GL_permission_note = false;
let GL_permission_nati = false;
let GL_permission_webs = false;
browser.permissions.getAll().then((result) => {
    for(permission of result.permissions){
        if(permission == "notifications") GL_permission_note = true;
        else if(permission == "nativeMessaging") GL_permission_nati = true;
    }
    
    for(origin of result.origins){
        if(origin == "http://*/*" || origin == "http://*/*") GL_permission_webs = true;
    }
});

browser.permissions.onAdded.addListener((result) => {permissions_listener(true, result)});
browser.permissions.onRemoved.addListener((result) => {permissions_listener(false, result)})
function permissions_listener(state, result) {
    //console.warn("change: ", state, result);
    
    switch(result.permissions[0] || result.origins[0]){
        case "notifications":
            GL_permission_note = state;
        break;
        case "nativeMessaging":
            GL_permission_nati = state;
        break;
        case "http://*/*":
        case "https://*/*":
            GL_permission_webs = state;
        break;
    }
}


function tab_executeScript(tabID, changeInfo="none"){
  
  if(changeInfo == "none" || changeInfo.status && changeInfo.status == "complete"){
    //console.log(tabID, changeInfo)
    browser.permissions.contains({origins: ["http://*/*","https://*/*"]})
    .then(function(result){
      if(result == true){
        browser.tabs.executeScript(tabID, {
          file: "/telLink.js",
          allFrames: true
        });
      }
    });
  }
}


function init(x){
    
    GL_username = "";
    GL_password = "";
    GL_Fritz_URL= "http://fritz.box";
    
    GL_check_num_reg = false;
    GL_check_num_anz = false;
    GL_check_anum_anz = false;

    GL_only_num_reg = new Array();
    
    
    
    if(x == "start"){
        browser.storage.local.get(["option","modi"]).then(init, onError);
    }
    else{
        //console.log("test", x);
        if( x.hasOwnProperty("option") ){
            let opt = x["option"];
            
            if( opt.hasOwnProperty("name") ) GL_username = opt["name"];
            if( opt.hasOwnProperty("pass") ) GL_password = opt["pass"];
            if( opt.hasOwnProperty("FUrl") ) GL_Fritz_URL= opt["FUrl"];
            
            if( opt.hasOwnProperty("num_reg") ) GL_check_num_reg  = opt["num_reg"];
            if( opt.hasOwnProperty("num_anz") ) GL_check_num_anz  = opt["num_anz"];
            if( opt.hasOwnProperty("anum_anz") ) GL_check_anum_anz = opt["anum_anz"];
            
            if( opt.hasOwnProperty("num_list") ) {
                GL_only_num_reg = {};
                for(num of opt["num_list"]){
                    //console.warn(num);
                    GL_only_num_reg[num] = true;
                }
            }
            
            if( opt.hasOwnProperty("alarm_vol") ) GL_alarm.volume = Number(opt["alarm_vol"]);
            if( opt.hasOwnProperty("verpa_anz") ) GL_verpa_anz = opt["verpa_anz"];
            
            GL_phone_book = false;
            if( opt.hasOwnProperty("phbonu_anz") && opt["phbonu_anz"] == true && GL_username != "" ){
                GL_phone_book = true;
            }

            if( opt.hasOwnProperty("conmenu_ok") && opt["conmenu_ok"] == true ){
              browser.menus.create( global_contexMenu );
            }
            else {
              browser.menus.remove("call_selection")
            }

            if( opt.hasOwnProperty("telLink_ok") && opt["telLink_ok"] == true ){
              if(GL_permission_webs == true && GL_executeScript == false){
                GL_executeScript = true;
                
                //browser.tabs.query( {}, console.log);

                browser.tabs.query( {}, function (tabs) { // alle Tabs-IDs auslesen
                  //console.log(tabs)
                  for (tab of tabs) { // alle Tabs durchgehen
                    //script in allen Tabs einbinden
                    if(tab.width > 0){
                      //nur bei geladenen Tabs einbinden (zuletzt geöffnete Tabs nach Neustart, die noch nicht aktiv waren, sind noch nicht geladen)
                      tab_executeScript(tab.id)
                    }
                  }
                });
                
                browser.tabs.onUpdated.addListener(tab_executeScript, {properties: ["status"]});
              }
            }
            else {
              GL_executeScript = false;
              
              browser.tabs.query( {}, function (tabs) { // alle Tabs-IDs auslesen
                for (tab of tabs){ // alle Tabs durchgehen
                  //script in allen Tabs einbinden
                  if(tab.width > 0){
                    //nur bei geladenen Tabs einbinden (zuletzt geöffnete Tabs nach Neustart, die noch nicht aktiv waren, sind noch nicht geladen)
                    try{
                      browser.tabs.sendMessage(tab.id, {
                        "telLink_func_destroy": true
                      });
                    } catch(e){}
                    
                  }
                }
              });
              
              browser.tabs.onUpdated.removeListener(tab_executeScript);
            }
        }
        else{
            //first start
            console.info("first start")
            browser.runtime.openOptionsPage();

            let option = {
                "name": GL_username,
                "pass": GL_password,
                "FUrl": GL_Fritz_URL,
                "num_reg": GL_check_num_reg,
                "num_anz": GL_check_num_anz,
                "anum_anz": GL_check_anum_anz,
                "num_list": GL_only_num_reg,
                "alarm_vol": 1,
                "verpa_anz": false,
                "phbonu_anz": false,
                "conmenu_ok": false,
                "telLink_ok": false,
            }
            
            
            browser.storage.local.set({
                "option": option
            });
            
        }
        
        if( x.hasOwnProperty("modi") ) GL_modi = Number(x["modi"]);
        else GL_modi = -1;
        
        CallMonitor_connnect();
        start();
    }
}

function phoneList_start() {
	if(GL_username != ""){
		console.info("phoneList aktuallisieren");
		
		SoapClient({
			"location": GL_Fritz_URL + ":49000" + "/upnp/control/x_contact",
			"uri":      "urn:dslforum-org:service:X_AVM-DE_OnTel:1",
			"login":    GL_username,
			"password": GL_password,
			"methode":  "GetPhonebook",
			"insert":   {"NewPhonebookID": 0}
		}).then(GetPhonebookList, onError);
	}
}

start_inter=0
function start(){
    console.log("start background");
    
    callList_start();
	setTimeout(() => {
		//phoneList aktuallisieren
        phoneList_start();
    }, 1.5*1000);
	
    console.info("callList aktuallisieren");
    //callList jede Stunde aktuallisieren
    clearInterval(start_inter);
    start_inter = setInterval(() => {
        callList_start();
        console.info("callList aktuallisieren");
    }, 1*60*60*1000);
}


// ------------------------- context menu --------------------------

global_contexMenu = {
	id: "call_selection",
	title: browser.i18n.getMessage("call_selection_number", ["%s"]),
	contexts: ["selection"],
	onclick(info, tab){
		//console.log(info.selectionText);
		
		let telNumber = info.selectionText.replace(/[^0-9()+*]/g, "")
		//console.log(telNumber);
		
		Listener_SelectionNumber = telNumber;
		if(telNumber != "") browser.browserAction.openPopup()
	},
}



// ------------------------- settings changed --------------------------

function settings_changed(){
  init("start");
  console.info("Einstellung geändert")
  pop();
}





// ----------------------- Python --------------------------------------




let GL_PythonListen = new PythonListen(); // <-- tools.js

GL_PythonListen.errorEvent = function(evt){
  console.warn("errorEvent: ", evt);
  
  browser.browserAction.setBadgeBackgroundColor({color: "#CC0000"});
  browser.browserAction.setBadgeText({text: "!"});
  
  switch(evt.state){
    case 0:
      console.warn("diskontet:\n", evt.message);
      note(browser.i18n.getMessage("py_setting_erro"), evt.message);
    break;
    
  }
}

GL_PythonListen.statechange = function(evt){
  console.log("statechange: ", evt);
  
  if(evt == 5){
    console.info("Fbox connected");
    browser.browserAction.setBadgeText({text: ""});
  }
}

GL_PythonListen.callMon = function(evt){
  console.info("callMon: ", evt);
  
  work(evt)
}

GL_PythonListen.push = function(evt){
  console.log("push: ", evt);
}





function CallMonitor_connnect(){    
    
  GL_PythonListen.stop();
  
  GL_PythonListen.start();


  let FBox = GL_Fritz_URL.split("//")[1];
  console.log("Sending: listen_" + FBox);

  GL_PythonListen.send("listen_" + FBox)


}




//~ /*
//~ On a click on the browser action, send the app a message.
//~ */
//~ browser.browserAction.onClicked.addListener(() => {
    //~ console.log("Sending:  ping");
    //~ //port.postMessage("ping");
    //~ //note("hm")
    //~ //ruf(true);
//~ });



let WORK_anummer = [];
function work(info){
    
    switch(info[2]){
        
        case "RING": 
            /*
            * [0](select) call
            * [1](time) 28.03.21 00:34:55
            * [2](event) RING
            * [3](connID) 0
            * [4](comefrom) 0152xxxxxx
            * [5](goto) 45xxxxx
            * [6](typ) SIP0
            */
            
            WORK_anummer[ info[3] ] = info[5];
            if(GL_check_num_reg == true && GL_only_num_reg[ WORK_anummer[ info[3] ] ] != true) WORK_anummer[ info[3] ] = "";
                
            if(WORK_anummer[ info[3] ] != ""){
                let extra = "";
                let wer = info[4];
				if(wer == "") wer = browser.i18n.getMessage("caller_verb"); //Nr. verborgen
				
				let tmp = returnNumberName(wer);
                if(tmp != "") wer = tmp;
                
                //if(GL_check_anum_anz == true) extra = " auf der Nummer " + WORK_anummer[ info[3] ];
                if(GL_check_anum_anz == true) extra = browser.i18n.getMessage("ring_extra", WORK_anummer[ info[3] ]);
                
                console.log(wer + " ruft" + extra + " an");
                //note(wer + " ruft" + extra + " an");
                note( browser.i18n.getMessage("ring_text", [wer, extra]) );
                ruf(true);
                Listener_Dial = [2, info[4]];
                blink_connecting("on", 2);
            }
        break;
        
        case "CALL": 
            /*
            * [0](select) call
            * [1](time) 28.03.21 00:34:55
            * [2](event) CALL
            * [3](connID) 0
            * [4](local extention) 10
            * [5](comefrom) 45xxxxx
            * [6](goto) 0152xxxxxx
            * [7](typ) SIP0
            */
            if(Listener_Dial != ""){
				//Falls momentan Wählhilfe läufte, mitteilen, dass eine Verbindung zustande kam
				try{
					browser.runtime.sendMessage({
						"CALL": true
					});
				}catch(e){};
				
				Listener_Dial[0] = 1;
			}
			
			
			callNumber_check = false; //anstehnder check, falls wahlhilfe deaktiviert ist
			
            WORK_anummer[ info[3] ] = info[5];
            if(GL_check_num_reg == true && GL_only_num_reg[ WORK_anummer[ info[3] ] ] != true) WORK_anummer[ info[3] ] = "";
        break;
            
        case "CONNECT": 
            /*
            * [0](select) call
            * [1](time) 28.03.21 00:34:55
            * [2](event) CONNECT
            * [3](connID) 0
            * [4](local extention) 10
            * [5](theOtherSide) 015xxxxxx
            */
            if(Listener_Dial != ""){
				//Falls momentan Wählhilfe läufte, mitteilen, dass der Anruf angenommen wurde
				try{
					browser.runtime.sendMessage({
						"CONNECT": true
					});
				}catch(e){};
				
				Listener_Dial = "";
				
				connectingStopped();
			}
			
			
            if(WORK_anummer[ info[3] ] != ""){
                let extra = "";
                let wer = info[5];
                
				let tmp = returnNumberName(wer);
                if(tmp != "") wer = tmp;
                
                //if(GL_check_anum_anz == true) extra = " auf der Nummer " + WORK_anummer[ info[3] ];
                if(GL_check_anum_anz == true) extra = browser.i18n.getMessage("connect_extra", WORK_anummer[ info[3] ]);
                
                console.log("Du bist mit " + wer + extra + " verbunden");
                //note("Du bist mit " + wer + extra + " verbunden");
                note( browser.i18n.getMessage("connect_text", [wer, extra]) );
                ruf(false);
            }
        break;
            
        case "DISCONNECT": 
            /*
            * [0](select) call
            * [1](time) 28.03.21 00:34:55
            * [2](event) DISCONNECT
            * [3](connID) 0
            * [4](dauer s) 3
            */
            if(Listener_Dial != ""){
				//Falls momentan Wählhilfe läufte, mitteilen, dass aufgelegt wurde
				try{
					browser.runtime.sendMessage({
						"DISCONNECT": true
					});
				}catch(e){};
				
				Listener_Dial = "";
				
				connectingStopped();
			}
			
			if(WORK_anummer[ info[3] ] != ""){
                let extra = "";
                //if(GL_check_anum_anz == true) extra = " auf der Nummer " + WORK_anummer[ info[3] ];
                if(GL_check_anum_anz == true) extra = browser.i18n.getMessage("disconnect_extra", WORK_anummer[ info[3] ]);
                WORK_anummer[ info[3] ] = "";
                
                let dauer = sektozeit(info[4])
                console.log("Der Anruf wurde" + extra + " beendet\n" + dauer);
                //note("Der Anruf wurde" + extra + " beendet\n" + dauer);
                note( browser.i18n.getMessage("disconnect_text", [dauer, extra]) );
                ruf(false);
                callList_start();
            }
        break;
        
    }
        
    
}



// ------------------------- interaktion -------------------------------

let callNumber_check = false;
let Listener_Dial = "";
let Listener_SelectionNumber = "";
browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    //console.log("request",request)
    
    if ( request.hasOwnProperty("settings_change") ) {
       settings_changed();
    }
    
    /*
    if ( request.hasOwnProperty("python erreichbar") ) {
       CallMonitor_connnect();
    }
    */
    if( request.hasOwnProperty("callListTransfer") ){
        blink_missed("off");
        sendResponse({
            callList: GL_call_list_popup,
            callList_raw: GL_call_list_popup_raw
        });
    }
	
	if( request.hasOwnProperty("phoneListTransfer") ){
        sendResponse({
            phoneList: GL_phone_list_popup,
            phoneList_raw: GL_phone_list_popup_raw
        });
    }
    
    if ( request.hasOwnProperty("call_test") ) {
       let info = request["call_test"].split(";")
       //console.warn(info);
       work(info);
    }
    
	if ( request.hasOwnProperty("Call_Number") ) {
    //Nummer anrufen
    callNumber( request["Call_Number"], sendResponse );
    callNumber_check = true;
    
    //wenn nach 3 sek callNumber_check noch true ist, ist alles gut. Anstonsten gabe es probleme 
    setTimeout(() => {
      if(callNumber_check == true){
        startGetDialConfig();
      }
    }, 3000);
  }
	
	if ( request.hasOwnProperty("HangUp") ) {
       hangup(sendResponse);
    }
	
	if ( request.hasOwnProperty("checkCalling") ) {
		if(Listener_Dial == ""){
			sendResponse({
				"Listener_Dial": ""
			});
		}
		else{
			sendResponse({
				"Listener_Dial": Listener_Dial.concat( returnNumberName(Listener_Dial[1]) )
			});
		}
	}
	
	if ( request.hasOwnProperty("checkSelectionNumber") ) {	
		sendResponse({
			"callSelectionNumber": [Listener_SelectionNumber, returnNumberName(Listener_SelectionNumber)]
		});
		
		Listener_SelectionNumber = "";
    }
	
	if ( request.hasOwnProperty("refresh_phonebook") ) {
		phoneList_start();
    }
	
	if ( request.hasOwnProperty("checkPython") ) {	
		sendResponse({
			"pythonCheck": GL_PythonListen.isRunning()
		});
    }
})


function returnNumberName(number){
	if(GL_phone_book == true && !(Object.keys( GL_phone_book_list ).length === 0 && GL_phone_book_list.constructor === Object)){
		let name = GL_phone_book_list[number];
		if (name == undefined) name = "";
		return name;
	}
	else return "";
}


function callNumber(number, sendResponse){	
	SoapClient({
		"location": GL_Fritz_URL + ":49000" + "/upnp/control/x_voip",
		"uri":      "urn:dslforum-org:service:X_VoIP:1",
		"login":    GL_username,
		"password": GL_password,
		"methode":  "X_AVM-DE_DialNumber",
		"insert":   {"NewX_AVM-DE_PhoneNumber": number}
	}).then(function(){
		console.info("Calling number: " + number);
		Listener_Dial = [0, number];
		blink_connecting("on", 1);
		
		if(GL_PythonListen.isRunning() == false){
			//console.log("set Time connectingStopped");
			setTimeout(() => {
				connectingStopped();
			}, 2*60*1000);
		} 
		
		sendResponse({
			Calling: [number, returnNumberName(number)]
		});
	}, onError);
}



function hangup(sendResponse=""){	
	SoapClient({
		"location": GL_Fritz_URL + ":49000" + "/upnp/control/x_voip",
		"uri":      "urn:dslforum-org:service:X_VoIP:1",
		"login":    GL_username,
		"password": GL_password,
		"methode":  "X_AVM-DE_DialHangup"
	}).then(function(){
		console.info("Aufgelegt");
		connectingStopped();
		if(sendResponse != ""){
			sendResponse({
				Out: true
			});
		}
	}, onError);
}

function connectingStopped(x){
	//console.log("connectingStopped");
	
	Listener_Dial = "";
	blink_connecting("off");
	
	if(x != 1){
		try{
			browser.runtime.sendMessage({
				"DISCONNECT": true
			});
		}catch(e){};
	}
}


// ----------------------- Benachrichten -------------------------------

function note(info){
    if(GL_permission_note == true){
        browser.notifications.create("cake-notification", {
            "type": "basic",
            "iconUrl": browser.runtime.getURL("icons/telefonliste.svg"),
            "title": browser.i18n.getMessage("note_title"),
            "message": info
        });
    }
}


function ruf(x){
    if(x == true) GL_alarm.play();
    else{
        GL_alarm.pause();
        GL_alarm.currentTime = 0;
    }
}


let blink_missed_toggle = 0;
let blink_missed_interval = 0;
function blink_missed(x){
    
    if(blink_missed_toggle){
        browser.browserAction.setBadgeBackgroundColor({color: "#CC0000"});
		browser.browserAction.setBadgeText({text: "📞"});
        blink_missed_toggle = 0;
    }
    else{
        browser.browserAction.setBadgeText({text: ""});
        blink_missed_toggle = 1;
    }
    
    
    if(x != ""){
        if(x == "on"){
            clearInterval(blink_missed_interval);
            blink_missed_interval = setInterval(() => {
                blink_missed();
            }, 1000);
        }
        else if(x == "off"){
            clearInterval(blink_missed_interval);
			blink_missed_toggle = 0;
			blink_missed();
        }
    }
}

let blink_connecting_toggle = 0;
let blink_connecting_interval = 0;
function blink_connecting(x, out_in){
  //out_in 1=du rufst an; 2=du wirst angerufen
  
    if(blink_connecting_toggle){
        if(out_in == 1) browser.browserAction.setBadgeBackgroundColor({color: "#00CC00"});
        else if(out_in == 2) browser.browserAction.setBadgeBackgroundColor({color: "#0000CC"});
        console.info("out_in", out_in)
        
		browser.browserAction.setBadgeText({text: "📞"});
        blink_connecting_toggle = 0;
    }
    else{
        browser.browserAction.setBadgeText({text: ""});
        blink_connecting_toggle = 1;
    }
    
    
    if(x != ""){
        if(x == "on"){
        
            clearInterval(blink_connecting_interval);
            blink_connecting_interval = setInterval(() => {
                blink_connecting("", out_in);
            }, 1000);
        }
        else if(x == "off"){
            clearInterval(blink_connecting_interval);
            blink_connecting_toggle = 0;
			blink_connecting();
        }
    }
}

// -------------------------- Telefonbuch ------------------------------

function GetPhonebookList(request){
    
    //console.warn(request);
    let lua_url = "";
    if(request.responseXML.getElementsByTagName("NewPhonebookURL")[0].firstChild){
        lua_url = request.responseXML.getElementsByTagName("NewPhonebookURL")[0].firstChild.data;
        lua_url = GL_Fritz_URL + ":49000" + lua_url.split(":49000")[1];
		
		console.info(lua_url);
		console.info("phoneList aktuallisiert");
		
        PhonebookList(lua_url);
    }
}


function PhonebookList(lua_URL){
    XHttpRequest(lua_URL).then(prepareViewPhonebookList, onError);
}



function prepareViewPhonebookList(request){
    //console.log(request);
    let xml = request.responseXML;
    
    let calls = xml.getElementsByTagName('contact');
    //console.log(calls.length)  
    
    let name = "";
    //console.log(calls) 
	GL_phone_book_list2 = {};
	
	
    for(call of calls){
        //console.log(call) 
        
        name = call.getElementsByTagName("realName")[0].textContent;
		//console.log(name)
		
		GL_phone_book_list2[name] = {
			"phonenumber": [],
			"type": []
		};
		
        for(number of call.getElementsByTagName("number")){
			let tmp = number.attributes.type.textContent
			if(tmp == "" || tmp == "intern" || tmp == "memo") continue; //interne Nummern überspringen
			
			GL_phone_book_list2[name].phonenumber.push(number.textContent);
			GL_phone_book_list2[name].type.push("<span title='"+number.attributes.type.textContent+"'>" + PhonebookList_typ[number.attributes.type.textContent] + "</span>");
			GL_phone_book_list[number.textContent] = name;
        }
		
		if(GL_phone_book_list2[name].phonenumber.length == 0) delete GL_phone_book_list2[name];
    }
    
    //console.info(GL_phone_book_list);
    //console.info(GL_phone_book_list2);
	pop();
}


// ---------------------- popup -------------------------------------





function pop(){
  //type: 1 =>Angenommen; 2 => Verpasst; 3 => Angerufen; 10 => Blockiert;
  let pop_typ_object = {
      1:  browser.i18n.getMessage("con_typ_on"),
      2:  browser.i18n.getMessage("con_typ_missed"),
      3:  browser.i18n.getMessage("con_typ_call"),
      10: browser.i18n.getMessage("con_typ_block")
  }
    
	//Anrufliste erstellen
	//GL_call_list: Daten kommen von prepareViewCallList() und wird hier mit callList_start(); ausgeführt
  //console.warn(GL_call_list)
  GL_call_list_popup = "";
  GL_call_list_popup_raw = [];
  for(call of GL_call_list){
    //console.warn(call["CallederNumber"])
    if(GL_check_num_anz == true && GL_only_num_reg[ call["CallederNumber"] ] != true) continue;
    
    let typ = Number(call["Type"])
    let num = "";
    let num_title = "";
    
    if(typ == 3) num = call["Called"]; //angerufen
    else num = call["Caller"];

    num_title = num;

    if(num == "") num = browser.i18n.getMessage("caller_verb"); //Nr. verborgen
    else{
      let tmp = returnNumberName(num); //Eintrag statt Nr
      if(tmp != "") num = tmp;
    }



    GL_call_list_popup += "<tr><td>" + pop_typ_object[typ] + "</td><td><span class='link_font' title='"+num_title+"'>" + num + "</span></td><td>" + call["Duration"] + "</td><td>" + call["Date"] + "</td></tr>";

    GL_call_list_popup_raw.push({
      "typ": pop_typ_object[typ],
      "title": num_title,
      "nummer": num,
      "dauer": call["Duration"],
      "datum": call["Date"]
    }) 
  }
  //console.error(GL_call_list_popup)
	
	//console.error(GL_phone_book_list2)
	GL_phone_list_popup = "";
	GL_phone_list_popup_raw = [];
	for(name in GL_phone_book_list2){
		GL_phone_list_popup += "<tr><td>" + name + "</td><td>" + GL_phone_book_list2[name].type.join("<br>") + "</td><td><span class='link_font'>" + GL_phone_book_list2[name].phonenumber.join("</span><br><span class='link_font'>") + "<span></td></tr>";
    
    GL_phone_list_popup_raw.push({
      "name": name,
      "typ": GL_phone_book_list2[name].type,
      "nummer": GL_phone_book_list2[name].phonenumber
    })
  }
	//console.info(GL_phone_list_popup)
	
	try{
		browser.runtime.sendMessage({
			"popUpRefresh": true
		});
	}catch(e){};
}

// ------------------- check wahlhilfe-Einstellung ----------------------


function startGetDialConfig(){
	if(GL_username != ""){
		SoapClient({
			"location": GL_Fritz_URL + ":49000" + "/upnp/control/x_voip",
			"uri":      "urn:dslforum-org:service:X_VoIP:1",
			"login":    GL_username,
			"password": GL_password,
			"methode":  "X_AVM-DE_DialGetConfig"
		}).then(getDialConfig, onError);
	}
}


function getDialConfig(request){
    //console.log(request);
    
    if(request.responseXML.getElementsByTagName("NewX_AVM-DE_PhoneName")[0].firstChild){
        let data = request.responseXML.getElementsByTagName("NewX_AVM-DE_PhoneName")[0].firstChild.data
        console.warn(data);
		
		if(data == "unconfigured"){
			try{
				browser.runtime.sendMessage({
					"errorDialConfig": true
				});
				
				connectingStopped(1);
			}catch(e){};
		}
    }
}

// ---------------------------- calllist -------------------------------

function callList_start() {
    if(GL_username != ""){
        SoapClient({
            "location": GL_Fritz_URL + ":49000" + "/upnp/control/x_contact",
            "uri":      "urn:dslforum-org:service:X_AVM-DE_OnTel:1",
            "login":    GL_username,
            "password": GL_password,
            "methode":  "GetCallList",
            "insert":   {"NewPhonebookID": 0}
        }).then(getLuaUrl, onError);
    }
    //else note("Keine Logindaten angegeben\nAnrufliste konnte nicht geladen werden")
}

//getLuaUrl (ok)-> anrufliste() (ok)-> prepareViewCallList() -------> set/get --------> popup.js#viewcalllist()

function getLuaUrl(request){
    if(request.responseXML.getElementsByTagName("NewCallListURL")[0].firstChild){
        let lua_url = request.responseXML.getElementsByTagName("NewCallListURL")[0].firstChild.data;
        lua_url = GL_Fritz_URL + ":49000" + lua_url.split(":49000")[1];
		
		console.info(lua_url);
        console.info("callList aktuallisiert");
		
        calllist(lua_url);
    }
}


function calllist(lua_URL){
    XHttpRequest(lua_URL).then(prepareViewCallList, onError);
}


function prepareViewCallList(request){
    //console.log(request);
    let xml = request.responseXML;
    
    let calls = xml.getElementsByTagName('Call');
    //console.log(calls.length)  
    
    let tmp = 0; 
    let list = [];
    //console.log(calls) 
    for(call of calls){
        //console.log(call) 
        //console.log(call.childNodes) 
        //console.log(call.childNodes.item(2)) 
        //console.log(call.getElementsByTagName('Date')[0]) 
        //console.log(call.getElementsByTagName('CalledNumber'))
        
        //type: 1 =>Angenommen; 2 => Verpasst; 3 => Angerufen; 10 => Blockiert;
        
        let CallederNumber = "";
        if(call.getElementsByTagName("CalledNumber").length > 0) CallederNumber = call.getElementsByTagName("CalledNumber")[0].textContent;
        else if(call.getElementsByTagName("CallerNumber").length > 0) CallederNumber = call.getElementsByTagName("CallerNumber")[0].textContent;
        
        let obj = {
            "Id": call.getElementsByTagName("Id")[0].textContent,
            "Type": call.getElementsByTagName("Type")[0].textContent,
            "Caller": call.getElementsByTagName("Caller")[0].textContent,
            "Called": call.getElementsByTagName("Called")[0].textContent,
            "CallederNumber": CallederNumber,
            "Name": call.getElementsByTagName("Name")[0].textContent,
            "Date": call.getElementsByTagName("Date")[0].textContent,
            "Duration": call.getElementsByTagName("Duration")[0].textContent,
            
            /*
            <Call>
                <Id>93</Id>
                <Type>1</Type>
                <Caller>0152xxxxxx</Caller>
                <Called>SIP: 45xxxxx</Called>
                <CalledNumber>45xxxxx</CalledNumber>
                <Name>Max Mustermann</Name>
                <Numbertype>sip</Numbertype>
                <Device>Mobilteil 1</Device>
                <Port>10</Port>
                <Date>28.03.21 11:30</Date>
                <Duration>0:42</Duration>
                <Count></Count>
                <Path />
            </Call>
            */


        }

        list.push(obj);
        
        if(tmp == 0 && Number(obj["Type"]) == 2) tmp = obj["Date"];
    }
    
    tmp = tmp.split(" ")
    let dat = tmp[0].split(".");
    let tim = tmp[1];
    
    dat[2] = new Date().getFullYear().toString().slice(0,2) + "" + dat[2];
    dat = dat.reverse().join("-");
    
    tmp = new Date(dat+"T"+tim).getTime();
    
    if(GL_modi_check == false){
        //GL_modi_check = true;
        if(GL_verpa_anz == true && GL_modi > -1 && GL_modi < tmp){
            GL_modi = tmp;
            note( browser.i18n.getMessage("nicht_da") )
            blink_missed("on");
        }
    }
    
    //"callList": JSON.stringify({"list":list, "modi": new Date().getTime()})
    
    GL_call_list = list;
    
    browser.storage.local.set({
        "modi": tmp
    });
    
    pop();
}







// --------------------- start -----------------------------------------

init("start")




