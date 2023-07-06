# react-native-mqtt-v3

Native MQTT v3.1.1 for React Native

This is an MQTT v3.1.1 client library for React Native. It utilizes native MQTT client libraries and exposes them via a unified Javascript interface.

This library uses the following native MQTT client libraries:

* iOS - https://github.com/emqx/CocoaMQTT
* Android - https://github.com/eclipse/paho.mqtt.java

## Installation

```sh
npm install react-native-mqtt-v3
```
or
```sh
yarn add react-native-mqtt-v3
```

## Usage

```js
import { createMqttClient } from 'react-native-mqtt-v3';

// ...

const mqttClient = await createMqttClient({
  clientId: 'rnmqttv31883',
  host: 'test.mosquitto.org',
  port: 1883,
});

await mqttClient.connect();
await mqttClient.subscribe('cnhongwei/#');
await mqttClient.publish(
  'cnhongwei/test',
  new Buffer('Hello ' + new Date().toISOString()).toString(
    'base64'
  )
);
await  mqttClient.unsubscribe('cnhongwei/#');
await mqttClient.disconnect();
await mqttClient.close();

// ...

mqttClient.onDisconnect((message) => {})
mqttClient.onMessage(({ topic, base64Message }) => {});
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
