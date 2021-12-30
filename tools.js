
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
            
            if(node.tagName == "INPUT") node.value = browser.i18n.getMessage( data_i18n );
            else node.innerText = browser.i18n.getMessage( data_i18n );
        }
        
        
        if(node.firstElementChild != null) treeWalk(node.firstElementChild);
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
    return new Promise(
        function(resolve, reject) {
            
            let location = "";
            let uri = "";
            let login = "";
            let password = "";
            let methode = "";
            let insert = "";
            
            if(obj.hasOwnProperty("location") ) location    = obj["location"];
            if(obj.hasOwnProperty("uri") )      uri         = obj["uri"];
            if(obj.hasOwnProperty("login") )    login       = obj["login"];
            if(obj.hasOwnProperty("password") ) password    = obj["password"];
            if(obj.hasOwnProperty("methode") )  methode     = obj["methode"];
            if(obj.hasOwnProperty("insert") )   insert      = obj["insert"];
            
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
                    if (request.status == 200) {
                        //console.warn(request.responseText);
                        resolve( request );
                    } else if(request.status == 401 && i == 0) {
                        //console.warn("getLuaUrl 401", request.statusText, request.responseText);
                        /*
                        SoapClient(obj, 1).then(
                            (res) => { resolve( res ); },
                            (rej) => { reject( rej ); }
                        );
                        */
                        SoapClient(obj, 1).then(resolve, reject);
                    } else {
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
        }
    );
}



function XHttpRequest(url){
    return new Promise(
        function(resolve, reject) {
            
            let request = new XMLHttpRequest();
            request.open("GET", url, true);
            
            request.onreadystatechange = function(){
                    
                if(request.readyState == 4){
                    //console.log(request.status);
                    if (request.status == 200) {
                        //console.log(request.responseText);
                        resolve( request );
                    } else {
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
        }
    );
}


function put0(x){
    if(x < 10) return "0"+x;
    else return x;
}


function sektozeit(sek){
    

    let s = put0(sek % 60);
    let m = put0(Math.floor( (sek % 3600) / 60 ));
    let h = put0(Math.floor(sek / 3600));
    
    return h+":"+m+":"+s;
}
