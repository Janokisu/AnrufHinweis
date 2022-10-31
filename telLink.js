try{
  //try - beim 1. mal gibt es varListen noch nicht. wenn executeScript erneut ausgeführt wird, wird das Skript fortlaufend unten angehängt
  browser.runtime.onMessage.removeListener(varListen); //vorherige Listener löschen
}
catch(e){}


controller = new AbortController();

varTelLinkClick = function telLinkClick(evt){
  
  evt.preventDefault(); //Linkausführung verhindern
  
  
  let tel = this.href.replace(/[^0-9()+*]/g, "");
  if(tel != ""){
    let x = confirm( browser.i18n.getMessage("pop_askNumberText_Number", [tel]) )
    if(x == true){        
      browser.runtime.sendMessage({
        "Call_Number": tel
      });
    }
  }
  
}


varListen = function (request, sender, sendResponse){
  //console.log("rec", request)
  if( request.hasOwnProperty("telLink_func_destroy") ){
    //document.removeEventListener("click", varTelLinkClick);
    controller.abort(); // entfernt alle Listener vom Addon auf der Seite
  }
}




for(tagName of document.getElementsByTagName("a")){
  if(tagName.protocol == "tel:"){
    console.log(tagName)
    
    tagName.addEventListener("click", varTelLinkClick, { signal: controller.signal });
  }
}

browser.runtime.onMessage.addListener(varListen);









