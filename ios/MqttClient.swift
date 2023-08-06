import Foundation
import CocoaMQTT

class MqttClient {
    
    private let eventEmitter: EventEmitter
    private let id: String
    private var client: CocoaMQTT
    private var optionsData: Dictionary<String, Any>
    
    private var connectResolve: RCTPromiseResolveBlock? = nil
    private var connectReject: RCTPromiseRejectBlock? = nil
    private var disconnectResolve: RCTPromiseResolveBlock? = nil
    private var disconnectReject: RCTPromiseRejectBlock? = nil
    private var subscribeResolve: RCTPromiseResolveBlock? = nil
    private var subscribeReject: RCTPromiseRejectBlock? = nil
    private var unsubscribeResolve: RCTPromiseResolveBlock? = nil
    private var unsubscribeReject: RCTPromiseRejectBlock? = nil
    private var publishResolve: RCTPromiseResolveBlock? = nil
    private var publishReject: RCTPromiseRejectBlock? = nil
    
    
    init(withEmitter emitter: EventEmitter, options: Dictionary<String, Any>, reject:RCTPromiseRejectBlock) {
        self.eventEmitter = emitter
        let clientId:String = options["clientId"] as! String;
        let host = options["host"] as! String;
        let port = options["port"] as! UInt16;
        self.id = clientId
        self.optionsData = options
        
        let protocolStr = options["protocol"] as! String?
        if (protocolStr == "ws" || protocolStr == "wss") {
            let websocket = CocoaMQTTWebSocket(uri: "")
            self.client = CocoaMQTT(clientID: clientId, host: host, port: port, socket: websocket)
        } else {
            self.client = CocoaMQTT(clientID: clientId, host: host, port: port)
        }
        if (protocolStr == "mqtts" || protocolStr == "ssl" || protocolStr == "tls" || protocolStr == "wss") {
            self.client.enableSSL = true;
            
            let insecure = optionsData["insecure"] as! Bool?
            let ca = options["ca"] as! String?
            if (insecure == true || (ca != nil && !ca!.isEmpty)) {
                self.client.allowUntrustCACertificate = true
            }
            
            if let p12Str = options["p12"] as! String? {
                var p12passW:String = ""
                if let passW = options["pass"] as! String? {
                    p12passW = passW
                }
                let clientCertArray = getClientCertFromP12Data(p12String: p12Str, certPassword: p12passW)
                var sslSettings: [String: NSObject] = [:]
                sslSettings[kCFStreamSSLCertificates as String] = clientCertArray
                self.client.sslSettings = sslSettings
            }
        }
        
        if let username = options["username"] as! String? {
            self.client.username = username
        }
        if let password = options["password"] as! String? {
            self.client.password = password
        }
        
        self.client.autoReconnect = optionsData["automaticReconnect"] as! Bool? ?? true
        
        self.client.delegate = self
    }
    
    func connect(options: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        self.connectResolve = resolve
        self.connectReject = reject
        
        self.client.connect()
    }
    
    func disconnect(resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        self.disconnectResolve = resolve
        self.disconnectReject = reject
        
        self.client.disconnect()
    }
    
    func subscribe(topic: String, qos: CocoaMQTTQoS, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        self.subscribeResolve = resolve
        self.subscribeReject = reject
        
        self.client.subscribe(topic, qos:qos)
        NSLog("CocoaMQTTDelegateLog-subscribe\(topic)")
    }
    
    func unsubscribe(topic: String, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        self.unsubscribeResolve = resolve
        self.unsubscribeReject = reject
        
        self.client.unsubscribe(topic)
    }
    
    func publish(topic: String, base64Body: String, qos: CocoaMQTTQoS, retained: Bool, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        NSLog("react-native-mqtt-v3:publish topic:\(topic) qos:\(qos)");
        self.publishResolve = resolve
        self.publishReject = reject
        
        let payload = Data(base64Encoded: base64Body)
        let message = CocoaMQTTMessage(topic: topic, payload: [UInt8](payload!), qos: qos, retained: retained)
        
        self.client.publish(message)
    }
    
    func getClientCertFromP12Data(p12String: String, certPassword: String) -> CFArray? {
        let p12Data: Data? = Data(base64Encoded: p12String, options: Data.Base64DecodingOptions.ignoreUnknownCharacters)
        
        NSLog("CocoaMQTTDelegateLog-p12Data \(String(describing: p12Data))")
        NSLog("CocoaMQTTDelegateLog-certPassword \(certPassword)")
        let key = kSecImportExportPassphrase as String
        let options : NSDictionary = [key: certPassword]
        
        var items : CFArray?
        let securityError = SecPKCS12Import(p12Data! as CFData, options, &items)
        
        NSLog("CocoaMQTTDelegateLog-111-items: \(items)")
        NSLog("CocoaMQTTDelegateLog-111-securityError: \(securityError)")
        guard securityError == errSecSuccess else {
            if securityError == errSecAuthFailed {
                NSLog("CocoaMQTTDelegateLog-ERROR: SecPKCS12Import returned errSecAuthFailed. Incorrect password?")
            } else {
                NSLog("CocoaMQTTDelegateLog-2-Failed to open the certificate file: ")
            }
            return nil
        }
        
        guard let theArray = items, CFArrayGetCount(theArray) > 0 else {
            return nil
        }
        
        let dictionary = (theArray as NSArray).object(at: 0)
        guard let identity = (dictionary as AnyObject).value(forKey: kSecImportItemIdentity as String) else {
            return nil
        }
        let certArray = [identity] as CFArray
        
        NSLog("CocoaMQTTDelegateLog-certArray: \(certArray)")
        return certArray
    }
    
}

extension MqttClient: CocoaMQTTDelegate {
    func sendEvent(name: String, body: Any) {
        eventEmitter.dispatch(name: name, body: body)
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didStateChangeTo state: CocoaMQTTConnState) {
        NSLog("CocoaMQTTDelegateLog-didStateChangeTo \(state)")
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didConnectAck ack: CocoaMQTTConnAck) {
        NSLog("react-native-mqtt-v3:didConnectAck ack:\(ack)")
        if (ack == .accept) {
            self.connectResolve?(self.id)
            sendEvent(name: EventType.MqttV3OnConnect.rawValue+self.id, body: [
                "clientId": self.id
            ])
        } else {
            self.connectReject?("error", ack.description, nil)
        }
        self.connectResolve = nil
        self.connectReject = nil
    }
    
    func mqttDidDisconnect(_ mqtt: CocoaMQTT, withError err: Error?) {
        NSLog("react-native-mqtt-v3:didDisconnect err:\(err)");
        if let error = err {
            NSLog("CocoaMQTTDelegateLog-mqttDidDisconnect2 \(err)")
            NSLog("CocoaMQTTDelegateLog-mqttDidDisconnect3 \(error.localizedDescription)")
            sendEvent(name: EventType.MqttV3OnDisconnect.rawValue+self.id, body: [
                "message": error.localizedDescription
            ])
            self.disconnectReject?("error", "disconnect error: \(error.localizedDescription)", nil)
            
        } else {
            NSLog("CocoaMQTTDelegateLog-mqttDidDisconnect4")
            sendEvent(name: EventType.MqttV3OnDisconnect.rawValue+self.id, body: [
                "message": "disconnect"
            ])
            self.disconnectResolve?(self.id)
        }
        self.disconnectResolve = nil
        self.disconnectReject = nil
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didSubscribeTopics success: NSDictionary, failed: [String]) {
        NSLog("CocoaMQTTDelegateLog-didSubscribeTopics")
        NSLog("CocoaMQTTDelegateLog-didSubscribeTopics1\(success)")
        NSLog("CocoaMQTTDelegateLog-didSubscribeTopics2\(failed)")
        
        if (failed.count == 0) {
            self.subscribeResolve?(nil)
        } else {
            self.subscribeReject?("error", "subscribe error", nil)
        }
        self.subscribeResolve = nil
        self.subscribeReject = nil
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didUnsubscribeTopics topics: [String]) {
        NSLog("CocoaMQTTDelegateLog-didUnsubscribeTopics")
        self.unsubscribeResolve?(nil)
        self.unsubscribeResolve = nil
        self.unsubscribeReject = nil
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didPublishMessage message: CocoaMQTTMessage, id: UInt16) {
        NSLog("react-native-mqtt-v3:didPublishMessage id:\(id) topic:\(message.topic)");
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didPublishAck id: UInt16) {
        NSLog("react-native-mqtt-v3:didPublishAck id:\(id)");
        self.publishResolve?(nil)
        self.publishResolve = nil
        self.publishReject = nil
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didReceiveMessage message: CocoaMQTTMessage, id: UInt16) {
        NSLog("CocoaMQTTDelegateLog-didPublishMessage1 \(message.topic)")
        NSLog("CocoaMQTTDelegateLog-didPublishMessage2 \(message.string ?? "")")
        NSLog("CocoaMQTTDelegateLog-didReceiveMessage3 \(id)")
        
        sendEvent(name: EventType.MqttV3OnMessage.rawValue+self.id, body: [
            "topic": message.topic,
            "base64Message": Data(message.payload).base64EncodedString()
        ])
    }
    
    func mqttDidPing(_ mqtt: CocoaMQTT) {
        NSLog("react-native-mqtt-v3:didPing");
    }
    
    func mqttDidReceivePong(_ mqtt: CocoaMQTT) {
        NSLog("react-native-mqtt-v3:didPong");
    }
    
    func mqtt(_ mqtt: CocoaMQTT, didReceive trust: SecTrust, completionHandler: @escaping (Bool) -> Void) {
        
        NSLog("CocoaMQTTDelegateLog-didReceivecompletionHandler-optionsData \(optionsData)")
        
        if let insecure = optionsData["insecure"] as! Bool? {
            if (insecure) {
                NSLog("CocoaMQTTDelegateLog-didReceivecompletionHandler-insecureYES")
                completionHandler(true)
                return
            }
        }
        
        var accept = false
        if let caStr = optionsData["ca"] as! String?, let certData = Data(base64Encoded: caStr, options: Data.Base64DecodingOptions.ignoreUnknownCharacters), let cert = SecCertificateCreateWithData(kCFAllocatorDefault, certData as CFData) {
            NSLog("CocoaMQTTDelegateLog-ca-SecTrustCreateWithCertificates-certData: \(certData)")
            NSLog("CocoaMQTTDelegateLog-ca-SecTrustCreateWithCertificates-cert: \(cert)")
            
            var result: SecTrust? = nil
            var trustResult: SecTrustResultType = SecTrustResultType.otherError
            let policy : SecPolicy  = SecPolicyCreateBasicX509();
            
            SecTrustSetPolicies(trust, policy)
            var status : OSStatus = SecTrustCreateWithCertificates(cert, policy, &result);
            status = SecTrustSetAnchorCertificates(trust, [cert] as CFArray);
            
            if (status == errSecSuccess) {
                status = SecTrustEvaluate(trust, &trustResult);
                NSLog("CocoaMQTTDelegateLog-ca-SecTrustCreateWithCertificates1: \(status)")
                // Self-signed certificate
                if (status == errSecSuccess && (trustResult == .unspecified || trustResult == .proceed)) {
                    NSLog("CocoaMQTTDelegateLog-ca-SecTrustCreateWithCertificates-trustResult: \(trustResult)")
                    accept = true
                } else if (trustResult == SecTrustResultType.recoverableTrustFailure) {
                    NSLog("CocoaMQTTDelegateLog-ca-SecTrustCreateWithCertificates-trustResult-fatalTrustFailure: \(trustResult)")
                }
            }
            completionHandler(accept)
            
        } else {
            completionHandler(true)
        }
    }
}
