import {
  type EventSubscription,
  NativeEventEmitter,
  NativeModules,
  Platform,
} from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-mqtt-v3' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const MqttV3 = NativeModules.MqttV3
  ? NativeModules.MqttV3
  : new Proxy(
      {},
      {
        get() {
          throw new Error(LINKING_ERROR);
        },
      }
    );

const mqttV3EventEmitter = new NativeEventEmitter(MqttV3);

export declare type QoS = 0 | 1 | 2;

export interface MqttOptions {
  /**
   * between 1 and 23 UTF-8 encoded bytes
   */
  clientId: string;
  host: string; // host does NOT include port
  port: number; // port is made into a number subsequently
  /**
   * default QoS
   */
  qos?: QoS;
  /**
   * the username required by your broker, if any
   */
  username?: string;
  /**
   * the password required by your broker, if any
   */
  password?: string;
  /**
   * default mqtt
   */
  protocol?: 'wss' | 'ws' | 'mqtt' | 'mqtts' | 'tcp' | 'ssl' | 'tls';
  path?: string;
  /**
   * 4 Mqtt version 3.1.1, 3 Mqtt version v3.1
   */
  protocolVersion?: number;
  /**
   * true, set to false to receive QoS 1 and 2 messages while offline
   */
  clean?: boolean;
  /**
   *  60 seconds, set to 0 to disable
   */
  keepalive?: number;
  /**
   * 30 * 1000 milliseconds, time to wait before a CONNACK is received
   */
  connectTimeout?: number;
  /**
   * true
   */
  automaticReconnect?: boolean;
  /**
   * 1000 milliseconds, interval between two reconnections
   */
  reconnectPeriod?: number;

  /**
   * optional cert chains in p12 format, base64 encoding, 3DES_CBC for keys, RC2_CBC for certs
   */
  p12?: string;
  /**
   * optional cert password
   */
  pass?: string;
  /**
   * Optionally override the trusted CA certificates in DER format, base64 encoding
   */
  ca?: string;
  /**
   * false, set true do not check that the server certificate
   */
  insecure?: boolean;
  /**
   * a message that will sent by the broker automatically when the client disconnect badly.
   */
  will?: {
    /**
     * the topic to publish
     */
    topic: string;
    /**
     * the message to publish
     */
    payload: string;
    /**
     * the QoS
     */
    qos: QoS;
    /**
     * the retain flag
     */
    retain: boolean;
  };
}

type ListenerSubscription = Pick<EventSubscription, 'remove'>;
type ConnectListener = () => void;
type DisconnectListener = (event: { message: string }) => void;
type MessageListener = (event: {
  topic: string;
  base64Message: string;
}) => void;

export interface MqttClient {
  close: () => Promise<void>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  subscribe: (topic: string, qos?: number) => Promise<void>;
  unsubscribe: (topic: string) => Promise<void>;
  publish: (
    topic: string,
    base64Body: string,
    qos?: number,
    retained?: boolean
  ) => Promise<void>;
  onConnect: (listener: ConnectListener) => ListenerSubscription;
  onDisconnect: (listener: DisconnectListener) => ListenerSubscription;
  onMessage: (listener: MessageListener) => ListenerSubscription;
}

export async function createMqttClient(
  options: MqttOptions
): Promise<MqttClient> {
  await MqttV3.createClient(options);
  return {
    connect: () => {
      return MqttV3.connect(options);
    },
    disconnect: () => {
      return MqttV3.disconnect(options.clientId);
    },
    close: () => {
      mqttV3EventEmitter.removeAllListeners(
        'MqttV3:onConnect:' + options.clientId
      );
      mqttV3EventEmitter.removeAllListeners(
        'MqttV3:onDisconnect:' + options.clientId
      );
      mqttV3EventEmitter.removeAllListeners(
        'MqttV3:onMessage:' + options.clientId
      );
      return MqttV3.close(options.clientId);
    },
    subscribe: (topic: string, qos?: number) => {
      return MqttV3.subscribe({
        clientId: options.clientId,
        topic,
        qos: qos ?? options.qos,
      });
    },
    unsubscribe: (topic: string) => {
      return MqttV3.unsubscribe(options.clientId, topic);
    },
    publish: (
      topic: string,
      base64Body: string,
      qos?: number,
      retained?: boolean
    ) => {
      return MqttV3.publish({
        clientId: options.clientId,
        topic,
        base64Body,
        qos: qos ?? options.qos,
        retained,
      });
    },
    onConnect: (listener: DisconnectListener) => {
      return mqttV3EventEmitter.addListener(
        'MqttV3:onConnect:' + options.clientId,
        listener
      );
    },
    onDisconnect: (listener: DisconnectListener) => {
      return mqttV3EventEmitter.addListener(
        'MqttV3:onDisconnect:' + options.clientId,
        listener
      );
    },
    onMessage: (listener: MessageListener) => {
      return mqttV3EventEmitter.addListener(
        'MqttV3:onMessage:' + options.clientId,
        listener
      );
    },
  };
}
