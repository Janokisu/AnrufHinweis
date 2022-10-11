const REG_NAME = new Array("Anrufliste", "Telefonbuch", "Telefon");
const REG_REG = new Array("Register_Anruf", "Register_Telefonbuch", "Register_Telefon");

let PYTHON_OK = false;
let CALLING_BUSSY = false;
let BUCH_RELOAD = false;

let CALL_list = "";
let CALL_list_raw = [];

let PHONE_list = "";
let PHONE_list_raw = [];


let callingName = document.getElementById("callingName");
let callingNumber = document.getElementById("callingNumber");


document.getElementById("Register_Anruf").addEventListener("click", function(){
    change_Register(0);
});

document.getElementById("Register_Telefonbuch").addEventListener("click", function(){
  if(BUCH_RELOAD == false){
    BUCH_RELOAD = true;
    browser.runtime.sendMessage({
      "refresh_phonebook": true
    });
  }
  
  change_Register(1);
});

document.getElementById("Register_Telefon").addEventListener("click", function(){
    change_Register(2);
});


document.getElementById("settings_link").addEventListener("click", function(){
    browser.runtime.openOptionsPage()
});


function change_Window(x){
	let div = new Array("buch", "sonder");
	
	for(id of div){
		document.getElementById( id ).style.display = "none"
	}
	
	document.getElementById( div[x] ).style.display = "flex"
}


function change_Register(x){

	
  document.getElementById("Eintrag_suchen_text").style.display = "none";
  document.getElementById("Eintrag_suchen_text").value = "";
  
  document.getElementById( "Eintrag_suchen" ).style.display = "inline-block"
	
	for(id of REG_NAME){
		document.getElementById( id ).style.display = "none"
	}
	
	for(id of REG_REG){
		document.getElementById( id ).style.backgroundColor = "#eee"
	}
	
	document.getElementById( REG_NAME[x] ).style.display = "inline-table" 
	document.getElementById( REG_REG[x] ).style.backgroundColor = "#fff"
  
  if(x == 2){
    document.getElementById( "Eintrag_suchen" ).style.display = "none"
  }
}


function change_sonder(x){
	let div = new Array("Anrufen", "Anruf", "DialError");
	
	for(id of div){
		document.getElementById( id ).style.display = "none"
	}
	
	document.getElementById( div[x] ).style.display = "inline-table"
}


document.getElementById("calllist").addEventListener("click", function(x){
	//wenn auf eine Nummer/Name geklickt wurde -> nachfragen, ob die Nummer angerufen werden soll
    //console.log(x)
	if(x.target.title && x.target.title != "" && x.target.title.length >= 3){
		if(x.target.title == x.target.innerText){
			askCallingNumber(x.target.title)
		}
		else{
			askCallingNumber(x.target.title, x.target.innerText)
		}
	}
});

document.getElementById("phonelist").addEventListener("click", function(x){
	//wenn auf eine Nummer doppelt geklickt wurde -> nachfragen, ob die Nummer angerufen werden soll
    if(x.target.nodeName == "SPAN" && x.target.textContent != "" && x.target.textContent.length >= 3){
		askCallingNumber(x.target.textContent)
	}
});


function askCallingNumber(number, name=""){
	if(name == ""){
		document.getElementById("askNumberText").innerText = browser.i18n.getMessage("pop_askNumberText_Number", [number]);
	}
	else{
		document.getElementById("askNumberText").innerText = browser.i18n.getMessage("pop_askNumberText_Name", [number, name]);
	}
	
	callingName.innerText = name;
	callingNumber.innerText = number;
	
	
	change_Window(1);
	change_sonder(0);
}

document.getElementById("yes").addEventListener("click", function(x){
	//wenn der Button "yes" geklickt wurde -> wähle die angezeigte Nummer
	browser.runtime.sendMessage({
		"Call_Number": callingNumber.innerText
	}).then(connecting, onError);
});

document.getElementById("no").addEventListener("click", function(x){
	//wenn der Button "no" geklickt wurde -> zurück zur Übersicht
	change_Window(0);
});

document.getElementById("telNumberEnterCall").addEventListener("click", function(x){
	//wenn der Button "✆" geklickt wurde -> wähle die angezeigte Nummer
	
	let nummer = document.getElementById("telNumberEnter").value.replace(/[^0-9()+*]/g, "")
	
	//leere Klammer entfernen
	nummer = nummer.replace("()", "");
	
	if(nummer == ""){
		//Abbrechen, wenn der String leer ist 
		return 0;
	}
	
	//wenn "+" vorhanden ist
	if(nummer.indexOf("+") > -1){
		if(nummer.indexOf("+") > 0){
			//Abbrechen, wenn "+" nicht an 1. Stelle steht & Fehlermeldung
			document.getElementById("telError").innerText = browser.i18n.getMessage("pop_telError_+Anfang");
			return 1;
		}
		
		if(nummer.match(/[+]/g).length > 1){
			//Abbrechen, wenn mehr als ein "+" vorhanden sind & Fehlermeldung
			document.getElementById("telError").innerText = browser.i18n.getMessage("pop_telError_nur1+");
			return 1;
		}
	}
	
	
	
	
	let KA = nummer.indexOf("(");
	let KB = nummer.indexOf(")")
	
	// "(" oder ")" ist vorhanden
	if(KA > -1 || KB > -1){
		//sind beide Klammern vorhanden?
		if(KA > -1 && KB > -1){
			if(KA <= 1){
				//wenn die Klammer am Anfang steht, dann kann man die Klammern auflösen
				nummer = nummer.replace(/[()]/g, "");
			}
			else{
				//wenn die Klammer in der Zahl steht, muss die Klammer und dessen Inhalt entfernt werden
				nummer = nummer.slice( 0, KA ) + nummer.slice( KB+1 )
			}
		}
		else{
			//Abbrechen, wenn nur eine Klammer vorhanden ist & Fehlermeldung
			document.getElementById("telError").innerText = browser.i18n.getMessage("pop_telError_klammerOffen");
			return 1;
		}
	}
	

	askCallingNumber(nummer)

	browser.runtime.sendMessage({
		"Call_Number": callingNumber.innerText
	}).then(connecting, onError);
	
});



let connecting_inter;
let connecting_timeout;
function connecting(obj){
	//Es wird gerade eine Verbindung zu jemand aufgebaut
	change_Window(1);
	change_sonder(1);
	
	if(PYTHON_OK == false){
		calling();
		return 0;
	}
	
  document.getElementById("callSymbol").style.color = "green";
  document.getElementById("hangup").style.display = "inline-block";
	
	let name = callingName.innerText;
	let number = callingNumber.innerText;
	
	if(callingName.innerText == ""){
		document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_connectingNumberText_Number", [number]);
	}
	else{
		document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_connectingNumberText_Name", [number, name]);
	}
	
	let dot = 100
	let dots = new Array("_", "__", "___", "____", "_____", "______", "_______");
	
	CALLING_BUSSY = true;
	
	document.getElementById("aufbauTimout").style.display = "none";
	connecting_timeout = setTimeout(() => {
		//Auf ben?tigt ungewöhnlich viel Zeit
        document.getElementById("aufbauTimout").style.display = "inline-block";
    }, 5*1000);
	
	connecting_inter = setInterval(() => {
		//Animation für anrufen
		dot++;
		if(dot > dots.length-1) dot = 0;
        document.getElementById("wait").innerText = dots[ dot ];
    }, 0.3*1000);
}


let calling_inter;
function calling(obj){
  //obj: 1=du rufst an; 2=du wirst angerufen
  
	//Es wird gerade jemand angerufen
	change_Window(1);
	change_sonder(1);
	
	let name = callingName.innerText;
	let number = callingNumber.innerText;
  
  if(obj == 1){
    document.getElementById("callSymbol").style.color = "green";
	}
  else if(obj == 2){
    document.getElementById("callSymbol").style.color = "blue";
    document.getElementById("hangup").style.display = "none";
	}
  
  
	if(callingName.innerText == ""){
		if(obj == 1){
      document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Number_out", [number]);
    }
    else if(obj == 2){
      document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Number_in", [number]);
    }
	}
	else{
		if(obj == 1){
      document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Name_out", [number, name]);
    }
    else if(obj == 2){
      document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Name_in", [number, name]);
    }
	}
	
	
	clearInterval(connecting_inter);
	clearTimeout(connecting_timeout);
	
	
	let dot = 100
	let dots = new Array(".", "..", "...", "....", ".....", "......", ".......");
	
	CALLING_BUSSY = true;
	
	calling_inter = setInterval(() => {
		//Animation für anrufen
		dot++;
		if(dot > dots.length-1) dot = 0;
        document.getElementById("wait").innerText = dots[ dot ];
    }, 0.3*1000);
}


document.getElementById("hangup").addEventListener("click", function(x){
	browser.runtime.sendMessage({
		"HangUp": true
	}).then(hangupped, onError);
});


function hangupped(obj){
	change_Window(0);
	clearInterval(calling_inter);
	clearInterval(connecting_inter);
	CALLING_BUSSY = false;
}

browser.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if ( request.hasOwnProperty("CALL") ) {
       calling();
    }
	
	if ( request.hasOwnProperty("CONNECT") ) {
       hangupped();
    }
	
	if ( request.hasOwnProperty("DISCONNECT") ) {
       hangupped();
    }
	
	if ( request.hasOwnProperty("popUpRefresh") ) {
       start();
    }
	
	if ( request.hasOwnProperty("errorDialConfig") ) {
		if(CALLING_BUSSY == true){
			change_sonder(2);
		}
    }
});



function start(){
	document.getElementById("telNumberEnter").placeholder = browser.i18n.getMessage("telNumberEnter");
  document.getElementById("settings_link").title = browser.i18n.getMessage( "title_einstellung" )
  document.getElementById("Eintrag_suchen_icon").title = browser.i18n.getMessage( "title_such" )
	
	browser.runtime.sendMessage({
		"checkCalling": true
	}).then(checkCalling, onError);
	
	
	if(CALLING_BUSSY == false){
		browser.runtime.sendMessage({
			"checkSelectionNumber": true
		}).then(checkSelectionNumber, onError);
	}
	
	browser.runtime.sendMessage({
			"checkPython": true
	}).then(function(obj){
		if(obj.hasOwnProperty("pythonCheck") && obj["pythonCheck"] != ""){
			PYTHON_OK = obj["pythonCheck"];
		}
	}, onError);
	
	
	getCallList();
	getPhoneList();
}


function checkCalling(obj){
	//console.info(obj["Listener_Dial"])
	if(obj.hasOwnProperty("Listener_Dial") && obj["Listener_Dial"] != "" && obj["Listener_Dial"][1] != ""){
		callingName.innerText = obj["Listener_Dial"][2];
		callingNumber.innerText = obj["Listener_Dial"][1];
		
		if(obj["Listener_Dial"][0] == 0) connecting();
		else if(obj["Listener_Dial"][0] == 1) calling(1);
		else if(obj["Listener_Dial"][0] == 2) calling(2);
	}
}


function checkSelectionNumber(obj){
	if ( obj.hasOwnProperty("callSelectionNumber") && obj["callSelectionNumber"] != "" && obj["callSelectionNumber"][0] != "") {
		change_Register(2);
		document.getElementById("telNumberEnter").value = obj["callSelectionNumber"][0];
		
		//askCallingNumber(obj["callSelectionNumber"][0], obj["callSelectionNumber"][1]);
    }
}

function getCallList(){
	 browser.runtime.sendMessage({
        "callListTransfer": true
    }).then(viewCallList, onError);
}


function viewCallList(obj){
    //console.warn(obj)

    if(obj.hasOwnProperty("callList") && obj["callList"] != "" && obj["callList"] != "loading"){
      CALL_list = obj["callList"];
      CALL_list_raw = obj["callList_raw"];
      
      document.getElementById("calllist").innerHTML = CALL_list;
    }
    else{
      let text = "";
      if(obj["callList"] == "loading"){
        text = browser.i18n.getMessage("pop_loading");
      }
      else{
        console.warn("no list!!");
        text = browser.i18n.getMessage("no_data")
      }
		
      document.getElementById("calllist").innerHTML = "<tr style='visibility:hidden'><td></td><td></td><td></td><td></td></tr>" +
                                                      "<tr><td colspan='4' style='text-align:center'>" +
                                                          text +
                                                      "</td></tr>";
		
      if(obj["callList"] != "loading"){
        noData.addEventListener("click", function(){
          browser.runtime.openOptionsPage()
        });
      }
    }
}




function getPhoneList(){
	 browser.runtime.sendMessage({
        "phoneListTransfer": true
    }).then(viewPhoneList, onError);
}

function viewPhoneList(obj){
  //console.warn(obj)

  if(obj.hasOwnProperty("phoneList") && obj["phoneList"] != "" && obj["phoneList"] != "loading"){
    PHONE_list = obj["phoneList"];
    PHONE_list_raw = obj["phoneList_raw"];
    
    document.getElementById("phonelist").innerHTML = PHONE_list;
  }
  else{
    let text = "";
    if(obj["phoneList"] == "loading"){
      text = browser.i18n.getMessage("pop_loading");
    }
    else{
      console.warn("no list!!");
      text = browser.i18n.getMessage("no_data");
    }
    
    document.getElementById("phonelist").innerHTML = "<tr style='visibility:hidden'><td></td><td></td><td></td></tr>" +
                                                    "<tr><td colspan='3' style='text-align:center'>" +
                                                        text +
                                                    "</td></tr>";
                                                        

    if(obj["phoneList"] != "loading"){
      noData.addEventListener("click", function(){
        browser.runtime.openOptionsPage()
      });
    }
  }
}


// ----------------------------- Eintrag_suchen --------------------------

function Eintrag_suchen(suche){
  suche = suche.trim().toLowerCase();
  
  console.warn(suche)
  
  if(document.getElementById( REG_NAME[0] ).style.display != "none"){
    //Anrufliste
    
    if(CALL_list_raw.length > 0){
      
      let eint;
      let call_list = "";
      
      for(Eintrag of CALL_list_raw){
        eint = Eintrag.nummer.toLowerCase() + ";" + Eintrag.title;
        
        if(eint.search(suche) != -1){
          console.log(eint)
          call_list += "<tr><td>" + Eintrag.typ + "</td><td><span class='link_font' title='"+Eintrag.title+"'>" + Eintrag.nummer + "</span></td><td>" + Eintrag.dauer + "</td><td>" + Eintrag.datum + "</td></tr>";
        } 
      }
      
      document.getElementById("calllist").innerHTML = call_list;
    }
  }
  else if(document.getElementById( REG_NAME[1] ).style.display != "none"){
    //Telefonbuchliste
    
    if(PHONE_list_raw.length > 0){
      
      let eint;
      let phone_list = "";
      
      for(Eintrag of PHONE_list_raw){
        eint = Eintrag.name.toLowerCase() + ";" + Eintrag.nummer.join(";");
        
        if(eint.search(suche) != -1){
          console.log(eint)
          phone_list += "<tr><td>" + Eintrag.name + "</td><td>" + Eintrag.typ.join("<br>") + "</td><td><span class='link_font'>" + Eintrag.nummer.join("</span><br><span class='link_font'>") + "<span></td></tr>";

          //call_list += "<tr><td>" + Eintrag.typ + "</td><td><span class='link_font' title='"+Eintrag.title+"'>" + Eintrag.nummer + "</span></td><td>" + Eintrag.dauer + "</td><td>" + Eintrag.datum + "</td></tr>";
        } 
      }
      
      document.getElementById("phonelist").innerHTML = phone_list;
    }
  }
  
  //let CALL_list_raw = [];
  //let PHONE_list_raw = [];
}


// ----------------------------- Eintrag_suchen EventListener --------------------------
Eintrag_suchen_text_timeout = 0;
document.getElementById("Eintrag_suchen_text").addEventListener("keyup", function(){
    clearTimeout(Eintrag_suchen_text_timeout);
    
    Eintrag_suchen_text_timeout = setTimeout(() => {
        Eintrag_suchen( document.getElementById("Eintrag_suchen_text").value );
    }, 200);
});


LOC_Eintrag_suchen = false;
document.getElementById("Eintrag_suchen_icon").addEventListener("mousedown", function(evt){
  
  LOC_Eintrag_suchen = true;
  	setTimeout(() => {
		//schlechter workround, um blur zu unterbinden! (todo)
      LOC_Eintrag_suchen = false;
    }, 100);
  
});


document.getElementById("Eintrag_suchen_icon").addEventListener("click", function(evt){
  if(document.getElementById("Eintrag_suchen_text").style.display == "none"){
    document.getElementById("Eintrag_suchen_text").style.display = "inline-block";
    document.getElementById("Eintrag_suchen_text").focus();
  }
  else{
    document.getElementById("Eintrag_suchen_text").style.display = "none";
    document.getElementById("Eintrag_suchen_text").value = "";
    
    //reset
    if(document.getElementById( REG_NAME[0] ).style.display != "none"){
      document.getElementById("calllist").innerHTML = CALL_list;
    }
    else if(document.getElementById( REG_NAME[1] ).style.display != "none"){
      document.getElementById("phonelist").innerHTML = PHONE_list;
    }
  }

});


document.getElementById("Eintrag_suchen_text").addEventListener("blur", function(){
  if(LOC_Eintrag_suchen == false && document.getElementById("Eintrag_suchen_text").value.trim() == ""){
    document.getElementById("Eintrag_suchen_text").style.display = "none";
  }
});

// ----------------------------- Eintrag_suchen Ende --------------------------



start();
