import Foundation

class EventEmitter {

    /// Shared Instance.
    public static var sharedInstance = EventEmitter()

    // NativeMqtt is instantiated by React Native with the bridge.
    private var eventEmitter: MqttV3!

    private init() {}

    // When React Native instantiates the emitter it is registered here.
    func registerEventEmitter(eventEmitter: MqttV3) {
        self.eventEmitter = eventEmitter
    }

    func dispatch(name: String, body: Any?) {
        self.eventEmitter.sendEvent(withName: name, body: body)
    }
}
