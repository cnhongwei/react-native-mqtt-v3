import Foundation

enum EventType: String {
    case MqttV3OnConnect = "MqttV3:onConnect:"
    case MqttV3OnDisconnect = "MqttV3:onDisconnect:"
    case MqttV3OnMessage = "MqttV3:onMessage:"
}
