# react-native-mqtt-v3

Native MQTT v3.1.1 for React Native

This is an MQTT v3.1.1 client library for React Native. It utilizes native MQTT client libraries and exposes them via a unified Javascript interface.

This library uses the following native MQTT client libraries:

* iOS - https://github.com/emqx/CocoaMQTT
* Android - https://github.com/hannesa2/paho.mqtt.android

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


## Use test.mosquitto.org
```shell
# Downlaod CA (PEM format)
curl https://test.mosquitto.org/ssl/mosquitto.org.crt -o ca.crt
# Downlaod CA (DER format)
curl https://test.mosquitto.org/ssl/mosquitto.org.der -o ca.der
# Base64 DER ca
base64 -b 64 -i ca.der
# Generate a private key
openssl genrsa -out client.key
# Generate the CSR
openssl req -out client.csr -key client.key -new -subj "/C=CN/O=Mosquitto/CN=Mosquitto"
# Generate key: https://test.mosquitto.org/ssl/
curl 'https://test.mosquitto.org/ssl/index.php' --data-urlencode "csr=$(cat client.csr)" -o client.crt
# Generate p12 certificates without pass
openssl pkcs12 -export -in client.crt -inkey client.key -out client.p12 -CAfile ca.crt -legacy -password pass:
# Base64 p12 certificates
base64 -b 64 -i client.p12

# Generate p12 certificates with pass
openssl pkcs12 -export -in client.crt -inkey client.key -out client-p.p12 -CAfile ca.crt -legacy -password pass:a123456
# Base64 p12 certificates
base64 -b 64 -i client-p.p12
```

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
