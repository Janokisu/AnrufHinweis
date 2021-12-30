let PYTHON_OK = false;
let CALLING_BUSSY = false;


let callingName = document.getElementById("callingName");
let callingNumber = document.getElementById("callingNumber");


document.getElementById("Register_Anruf").addEventListener("click", function(){
    change_Register(0);
});

document.getElementById("Register_Telefonbuch").addEventListener("click", function(){
    change_Register(1);
});

document.getElementById("Register_Telefon").addEventListener("click", function(){
    change_Register(2);
});


document.getElementById("settings_link").addEventListener("click", function(){
    browser.runtime.openOptionsPage()
});

document.getElementById("refresh_phonebook").addEventListener("click", function(){
    browser.runtime.sendMessage({
		"refresh_phonebook": true
	});
});



function change_Window(x){
	let div = new Array("buch", "sonder");
	
	for(id of div){
		document.getElementById( id ).style.display = "none"
	}
	
	document.getElementById( div[x] ).style.display = "flex"
}


function change_Register(x){
	let div = new Array("Anrufliste", "Telefonbuch", "Telefon");
	let reg = new Array("Register_Anruf", "Register_Telefonbuch", "Register_Telefon");
	
	
	for(id of div){
		document.getElementById( id ).style.display = "none"
	}
	
	for(id of reg){
		document.getElementById( id ).style.backgroundColor = "#eee"
	}
	
	document.getElementById( div[x] ).style.display = "inline-table" 
	document.getElementById( reg[x] ).style.backgroundColor = "#fff"
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
	
	let nummer = document.getElementById("telNumberEnter").value.replace(/[^0-9+*]/g, "")
	
	if (nummer != ""){
		askCallingNumber(nummer)

		browser.runtime.sendMessage({
			"Call_Number": callingNumber.innerText
		}).then(connecting, onError);
	}
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
	//Es wird gerade jemand angerufen
	change_Window(1);
	change_sonder(1);
	
	let name = callingName.innerText;
	let number = callingNumber.innerText;
	
	if(callingName.innerText == ""){
		document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Number", [number]);
	}
	else{
		document.getElementById("callingNumberText").innerText = browser.i18n.getMessage("pop_callingNumberText_Name", [number, name]);
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
		
		if(obj["Listener_Dial"][0] == 1) calling();
		else connecting();
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
		document.getElementById("calllist").innerHTML = obj["callList"];
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
        document.getElementById("phonelist").innerHTML = obj["phoneList"];
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



start();
