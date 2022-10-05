Selfpath = Replace(WScript.ScriptFullName, WScript.ScriptName, "")
JSON_file = Selfpath & "CallMonitor.json"
'WScript.Echo JSON_file

JSON_file = Replace(JSON_file,"\","\\")


str = "Windows Registry Editor Version 5.00" & vbNewLIne & _
    vbNewLIne & _
    "[HKEY_CURRENT_USER\SOFTWARE\Mozilla\NativeMessagingHosts\CallMonitor]" & vbNewLIne & _
    "@=""" & JSON_file & """"

Set objFSO = Wscript.CreateObject("Scripting.FileSystemObject")
Set objFile = objFSO.OpenTextFile(Selfpath & "link.reg", 2, true)
objFile.WriteLine str
objFile.close


WScript.Echo "File was created"
