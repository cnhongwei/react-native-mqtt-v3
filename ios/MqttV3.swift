import CocoaMQTT
import Foundation


@objc(MqttV3)
class MqttV3: RCTEventEmitter {
    var clients: [ String: MqttClient ] = [:]
    var eventTypeId: String = ""
    
    override init() {
        super.init()
        EventEmitter.sharedInstance.registerEventEmitter(eventEmitter: self)
    }
    
    @objc
    open override func supportedEvents() -> [String] {
        return [
            EventType.MqttV3OnConnect.rawValue + eventTypeId,
            EventType.MqttV3OnDisconnect.rawValue + eventTypeId,
            EventType.MqttV3OnMessage.rawValue + eventTypeId,
        ]
    }
    
    @objc(createClient:resolve:reject:)
    func createClient(options: Dictionary<String, Any>, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) {
        NSLog("CocoaMQTTDelegateLog-createClientclick")
        let clientId:String? = options["clientId"] as! String?;
        if (clientId == nil || clientId!.isEmpty) {
            reject("clientId", "clientId is required.", nil)
            return
        }
        let host:String? = options["host"] as! String?;
        if  (host == nil || host!.isEmpty) {
            reject("host", "host is required.", nil)
            return
        }
        if options["port"] == nil {
            reject("port", "port is required.", nil)
            return
        }
        
        eventTypeId = clientId!
        
        clients[clientId!] = MqttClient(withEmitter: EventEmitter.sharedInstance, options: options, reject: reject)
        resolve(clientId!)
    }
    
    @objc(close:resolve:reject:)
    func close(clientId: String?, resolve:RCTPromiseResolveBlock, reject:RCTPromiseRejectBlock) {
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client != nil) {
            clients[clientId!] = nil
        }
        clients.removeValue(forKey: clientId!)
        resolve(clientId!)
    }
    
    @objc(connect:resolve:reject:)
    func connect(options: NSDictionary, resolve:@escaping RCTPromiseResolveBlock,reject:@escaping RCTPromiseRejectBlock) {
        NSLog("CocoaMQTTDelegateLog-connectclick")
        let clientId:String? = options["clientId"] as! String?;
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client == nil) {
            reject("error", "client doesn't create", nil);
            return;
        }
        client!.connect(options: options, resolve: resolve, reject: reject)
    }
    
    @objc(disconnect:resolve:reject:)
    func disconnect(clientId: String?, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client == nil) {
            reject("error", "client doesn't create", nil);
            return;
        }
        client!.disconnect(resolve: resolve, reject: reject)
    }
    
    @objc(subscribe:resolve:reject:)
    func subscribe(params: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping  RCTPromiseRejectBlock) {
        let clientId:String? = params["clientId"] as! String?;
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        let topic:String? = params["topic"] as! String?;
        if (topic == nil) {
            reject("topic", "topic is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client == nil) {
            reject("error", "client doesn't create", nil);
            return;
        }
        let qos: CocoaMQTTQoS = getQos(qos: params["qos"] as! UInt16?)
        client!.subscribe(topic: topic!, qos: qos, resolve: resolve, reject: reject)
    }
    
    @objc(unsubscribe:topic:resolve:reject:)
    func unsubscribe(clientId: String?, topic:String?, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        if (topic == nil) {
            reject("topic", "topic is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client == nil) {
            reject("error", "client doesn't create", nil);
            return;
        }
        client!.unsubscribe(topic: topic!, resolve: resolve, reject: reject)
    }
    
    @objc(publish:resolve:reject:)
    func publish(params: NSDictionary, resolve:@escaping RCTPromiseResolveBlock, reject:@escaping RCTPromiseRejectBlock) {
        let clientId:String? = params["clientId"] as! String?;
        if (clientId == nil) {
            reject("clientId", "clientId is required.", nil);
            return;
        }
        let topic:String? = params["topic"] as! String?;
        if (topic == nil) {
            reject("topic", "topic is required.", nil);
            return;
        }
        let base64Body:String? = params["base64Body"] as! String?;
        if (base64Body == nil) {
            reject("base64Body", "base64Body is required.", nil);
            return;
        }
        let client = clients[clientId!]
        if (client == nil) {
            reject("error", "client doesn't create", nil);
            return;
        }
        let qos: CocoaMQTTQoS = getQos(qos: params["qos"] as! UInt16?)
        var retained = false;
        if params["retained"] != nil, let r: Bool = params["retained"] as! Bool? {
            retained = !r;
        }
        client!.publish(topic: topic!, base64Body: base64Body!, qos: qos, retained: retained,  resolve: resolve, reject: reject)
    }
    
    func getQos(qos: UInt16?) -> CocoaMQTTQoS {
        if (qos == 0) {
            return .qos0
        } else if (qos == 2) {
            return .qos2
        }
        return .qos1
    }
}
