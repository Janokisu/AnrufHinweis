#!/usr/bin/env python
# -*- coding: utf-8 -*-


import json
import socket
import struct
import sys
import threading
import time

DEBUGGING = False

CallMon_Version = "0.2"

class CallMonServer():
    #source: http://www.dahlgrimm.de/PhythonScripte/callmon/callmon.html -> CallMonServer.py
    
    def __init__(self, master, fritzIP, check=0):
        self.running = False
        self.master = master
        self.master.sendMessage("state;2") # aufruf gelungen
        self.master.sendMessage("start listening on " + fritzIP)
        
        self.FRITZBOX_IP           = fritzIP  # IP-Adresse oder Hostname der Fritzbox
        self.FRITZBOX_CALLMON_PORT = 1012         # CallMonitor-Port auf der Fritzbox
        self.STATUS_TO_TERMINAL    = True 
          
        if(DEBUGGING):
            self.master.sendMessage("DebugCode: 2")
        self.startFritzboxCallMonitor()
        #self.runFritzboxCallMonitor()
    
    
    
    def startFritzboxCallMonitor(self):
        if(DEBUGGING):
            self.master.sendMessage("DebugCode: 3")
        self.worker1=threading.Thread(target=self.runFritzboxCallMonitor, name="runFritzboxCallMonitor")
        self.worker1.setDaemon(True)
        self.worker1.start()
    
    
    
    
    
    def runFritzboxCallMonitor(self):
        self.master.sendMessage("state;3") # Thread gelungen
        if(DEBUGGING):
            self.master.sendMessage("DebugCode: 4")
        while True: # Socket-Connect-Loop
            if(DEBUGGING):
                self.master.sendMessage("DebugCode: 5")
            self.recSock=socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            try:
                self.recSock.connect((self.FRITZBOX_IP, self.FRITZBOX_CALLMON_PORT))
            except socket.herror as e:
                # h = host
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 5.1")
                self.master.sendMessage("error;2;socket.herror:\n" + str(e))
                time.sleep(10)
                continue
            except socket.gaierror as e:
                # gai = getaddrinfo
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 5.2")
                self.master.sendMessage("error;3;socket.gaierror:\n" + str(e))
                time.sleep(10)
                continue
            except socket.timeout as e:
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 5.3")
                self.master.sendMessage("error;4;socket.timeout:\n" + str(e))
                continue
            except socket.error as e:
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 5.4")
                self.master.sendMessage("error;5;socket.error:\n" + str(e))
                time.sleep(10)
                continue
            except Exception as e:
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 5.5")
                tm=time.strftime("%Y.%m.%d-%H:%M:%S")
                self.master.sendMessage("error;10;%s Error: %s"%(tm, str(e)))
                time.sleep(10)
                continue
            if self.STATUS_TO_TERMINAL==True:
                tm=time.strftime("%Y.%m.%d-%H:%M:%S")
                self.master.sendMessage("%s Die Verbindung zum CallMonitor der Fritzbox wurde hergestellt!"%(tm))
                #self.master.sendMessage("listening")
                
            self.master.sendMessage("state;4") # keine Fehler / Verbindung zur FBox gelungen
            
            while True: # Socket-Receive-Loop
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 6")
                try:
                    if(DEBUGGING):
                        self.master.sendMessage("DebugCode: 7")
                    self.running = True
                    self.master.sendMessage("state;5") # Listener ist aktiv
                    self.master.sendMessage("Warte auf Ereignis ...")
                    ln = str( self.recSock.recv(256).strip() )
                except:
                    if(DEBUGGING):
                        self.master.sendMessage("DebugCode: 8")
                    ln=""
                
                if(DEBUGGING):
                    self.master.sendMessage("DebugCode: 9")
                if ln!="" or len(ln) > 8:
                    if(DEBUGGING):
                        self.master.sendMessage("DebugCode: 10")
                    self.master.sendMessage("call;"+ln)
                    #self.fb_queue.put(ln)
                else:
                    self.master.sendMessage("error;20;callfehler:"+ln)
                    if(DEBUGGING):
                        self.master.sendMessage("DebugCode: 11")
                    if self.STATUS_TO_TERMINAL==True:
                        if(DEBUGGING):
                            self.master.sendMessage("DebugCode: 12")
                        tm=time.strftime("%Y.%m.%d-%H:%M:%S")
                        self.master.sendMessage("%s Die Verbindung zum CallMonitor der Fritzbox ist abgebrochen!"%(tm))
                    self.master.sendMessage("CONNECTION_LOST")
                    self.running = False
                    #self.fb_queue.put("CONNECTION_LOST")
                    if(DEBUGGING):
                        self.master.sendMessage("DebugCode: 13")
                    break   # zurück in die Socket-Connect-Loop



# ~ try:
    # ~ from tkinter import *                     
# ~ except ImportError:
    # ~ from Tkinter import *
# ~ fenster = Tk()
# ~ fenster.title("Test")
# ~ anweisungs_label = Label(fenster, text="Python works").pack()
# ~ fenster.mainloop()

# ---------------------------------------------------------------


#source: https://github.com/mdn/webextensions-examples/tree/master/native-messaging
class app2():
    # Python 2.x version (if sys.stdin.buffer is not defined)
    # Read a message from stdin and decode it.   
    
    
    def __init__(self):
        self.start()




    def getMessage(self):
        rawLength = sys.stdin.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.read(messageLength)
        return json.loads(message)
        # ~ return "ping"

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(self, messageContent):
        encodedContent = json.dumps(messageContent)
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(self, encodedMessage):
        encodedMessage = self.encodeMessage(encodedMessage)
        
        sys.stdout.write(encodedMessage['length'])
        sys.stdout.write(encodedMessage['content'])
        sys.stdout.flush()
        
    
    def listen(self, fritzIP):
        if( hasattr(self, 'callmon') and self.callmon.running):
            self.sendMessage("listening is already running")
        else:
            self.callmon = CallMonServer(self, fritzIP)

    def start(self):
        self.sendMessage("state;1") # Start gelungen
        self.sendMessage("Python started")
        
        while True:
            receivedMessage = self.getMessage()
            
            if receivedMessage == "ping":
                self.sendMessage("pong")
                
            if receivedMessage == "version":
                self.sendMessage("version;" + str(sys.version.split(" ")[0]) + ";" + CallMon_Version)

            if receivedMessage[:6] == "listen": 
                self.listen(receivedMessage[7:]) #fritzIP



class app3():
    # Python 3.x version
    # Read a message from stdin and decode it.
    
    def __init__(self):
        self.start()
        
        
    def getMessage(self):
        rawLength = sys.stdin.buffer.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.buffer.read(messageLength).decode('utf-8')
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(self, messageContent):
        encodedContent = json.dumps(messageContent).encode('utf-8')
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(self, encodedMessage):
        encodedMessage = self.encodeMessage(encodedMessage)
        
        sys.stdout.buffer.write(encodedMessage['length'])
        sys.stdout.buffer.write(encodedMessage['content'])
        sys.stdout.buffer.flush()


    def listen(self, fritzIP):
        if( hasattr(self, 'callmon') and self.callmon.running):
            self.sendMessage("listening is already running")
        else:
            self.callmon = CallMonServer(self, fritzIP)
        

    def start(self):
        self.sendMessage("state;1") # Start gelungen
        self.sendMessage("Python started")
        
        while True:
            receivedMessage = self.getMessage()
            
            if receivedMessage == "ping":
                self.sendMessage("pong")
                
            if receivedMessage == "version":
                self.sendMessage("version;" + str(sys.version.split(" ")[0]) + ";" + CallMon_Version)

            if receivedMessage[:6] == "listen": 
                self.listen(receivedMessage[7:]) #fritzIP
                

# -----------------------------------------------------------------------------

if(sys.version_info.major == 2):
    app2()
elif (sys.version_info.major == 3):
    app3()
