function telLinkClick(evt){
  let target = evt.target
  
  if(target.tagName == "A" && target.protocol == "tel:"){
    
    evt.preventDefault(); //Linkausführung verhindern
    
    
    let tel = target.href.slice(4).trim().replace(/[^0-9()+*]/g, "");
    if(tel != ""){
      let x = confirm("Möchten Sie die Telefonnummer " + tel + " anrufen?")
      if(x == true){        
        browser.runtime.sendMessage({
          "Call_Number": tel
        });
      }
    }
    
  }
  
}


browser.runtime.onMessage.addListener(function (request, sender, sendResponse){
  //console.log("rec", request)
  if ( request.hasOwnProperty("telLink_func_destroy") ) {
    document.removeEventListener("click", telLinkClick);
  }
});

document.removeEventListener("click", telLinkClick); //falls noch alter listerner da war
document.addEventListener("click", telLinkClick);