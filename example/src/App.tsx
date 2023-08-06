import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Button,
  FlatList,
  SafeAreaView,
} from 'react-native';
import {
  createMqttClient,
  type MqttOptions,
  type MqttClient,
} from 'react-native-mqtt-v3';
import { useCallback, useRef, useState } from 'react';
import { Buffer } from 'buffer';

const clientOptions: MqttOptions[] = [
  {
    clientId: 'rnmqttv31883',
    host: 'test.mosquitto.org',
    port: 1883,
  },
  {
    clientId: 'rnmqttv31884',
    host: 'test.mosquitto.org',
    port: 1884,
    username: 'rw',
    password: 'readwrite',
  },
  {
    clientId: 'rnmqttv38883',
    host: 'test.mosquitto.org',
    port: 8883,
    protocol: 'ssl',
    ca: `MIIEAzCCAuugAwIBAgIUBY1hlCGvdj4NhBXkZ/uLUZNILAwwDQYJKoZIhvcNAQEL
BQAwgZAxCzAJBgNVBAYTAkdCMRcwFQYDVQQIDA5Vbml0ZWQgS2luZ2RvbTEOMAwG
A1UEBwwFRGVyYnkxEjAQBgNVBAoMCU1vc3F1aXR0bzELMAkGA1UECwwCQ0ExFjAU
BgNVBAMMDW1vc3F1aXR0by5vcmcxHzAdBgkqhkiG9w0BCQEWEHJvZ2VyQGF0Y2hv
by5vcmcwHhcNMjAwNjA5MTEwNjM5WhcNMzAwNjA3MTEwNjM5WjCBkDELMAkGA1UE
BhMCR0IxFzAVBgNVBAgMDlVuaXRlZCBLaW5nZG9tMQ4wDAYDVQQHDAVEZXJieTES
MBAGA1UECgwJTW9zcXVpdHRvMQswCQYDVQQLDAJDQTEWMBQGA1UEAwwNbW9zcXVp
dHRvLm9yZzEfMB0GCSqGSIb3DQEJARYQcm9nZXJAYXRjaG9vLm9yZzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAME0HKmIzfTOwkKLT3THHe+ObdizamPg
UZmD64Tf3zJdNeYGYn4CEXbyP6fy3tWc8S2boW6dzrH8SdFf9uo320GJA9B7U1FW
Te3xda/Lm3JFfaHjkWw7jBwcauQZjpGINHapHRlpiCZsquAthOgxW9SgDgYlGzEA
s06pkEFiMw+qDfLo/sxFKB6vQlFekMeCymjLCbNwPJyqyhFmPWwio/PDMruBTzPH
3cioBnrJWKXc3OjXdLGFJOfj7pP0j/dr2LH72eSvv3PQQFl90CZPFhrCUcRHSSxo
E6yjGOdnz7f6PveLIB574kQORwt8ePn0yidrTC1ictikED3nHYhMUOUCAwEAAaNT
MFEwHQYDVR0OBBYEFPVV6xBUFPiGKDyo5V3+Hbh4N9YSMB8GA1UdIwQYMBaAFPVV
6xBUFPiGKDyo5V3+Hbh4N9YSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAGa9kS21N70ThM6/Hj9D7mbVxKLBjVWe2TPsGfbl3rEDfZ+OKRZ2j6AC
6r7jb4TZO3dzF2p6dgbrlU71Y/4K0TdzIjRj3cQ3KSm41JvUQ0hZ/c04iGDg/xWf
+pp58nfPAYwuerruPNWmlStWAXf0UTqRtg4hQDWBuUFDJTuWuuBvEXudz74eh/wK
sMwfu1HFvjy5Z0iMDU8PUDepjVolOCue9ashlS4EB5IECdSR2TItnAIiIwimx839
LdUdRudafMu5T5Xma182OC0/u/xRlEm+tvKGGmfFcN0piqVl8OrSPBgIlb+1IKJE
m/XriWr/Cq4h/JfB7NTsezVslgkBaoU=`,
  },
  {
    clientId: 'rnmqttv38884',
    host: 'test.mosquitto.org',
    port: 8884,
    protocol: 'tls',
    p12: `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
mwICCAA=`,
    ca: `MIIEAzCCAuugAwIBAgIUBY1hlCGvdj4NhBXkZ/uLUZNILAwwDQYJKoZIhvcNAQEL
BQAwgZAxCzAJBgNVBAYTAkdCMRcwFQYDVQQIDA5Vbml0ZWQgS2luZ2RvbTEOMAwG
A1UEBwwFRGVyYnkxEjAQBgNVBAoMCU1vc3F1aXR0bzELMAkGA1UECwwCQ0ExFjAU
BgNVBAMMDW1vc3F1aXR0by5vcmcxHzAdBgkqhkiG9w0BCQEWEHJvZ2VyQGF0Y2hv
by5vcmcwHhcNMjAwNjA5MTEwNjM5WhcNMzAwNjA3MTEwNjM5WjCBkDELMAkGA1UE
BhMCR0IxFzAVBgNVBAgMDlVuaXRlZCBLaW5nZG9tMQ4wDAYDVQQHDAVEZXJieTES
MBAGA1UECgwJTW9zcXVpdHRvMQswCQYDVQQLDAJDQTEWMBQGA1UEAwwNbW9zcXVp
dHRvLm9yZzEfMB0GCSqGSIb3DQEJARYQcm9nZXJAYXRjaG9vLm9yZzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAME0HKmIzfTOwkKLT3THHe+ObdizamPg
UZmD64Tf3zJdNeYGYn4CEXbyP6fy3tWc8S2boW6dzrH8SdFf9uo320GJA9B7U1FW
Te3xda/Lm3JFfaHjkWw7jBwcauQZjpGINHapHRlpiCZsquAthOgxW9SgDgYlGzEA
s06pkEFiMw+qDfLo/sxFKB6vQlFekMeCymjLCbNwPJyqyhFmPWwio/PDMruBTzPH
3cioBnrJWKXc3OjXdLGFJOfj7pP0j/dr2LH72eSvv3PQQFl90CZPFhrCUcRHSSxo
E6yjGOdnz7f6PveLIB574kQORwt8ePn0yidrTC1ictikED3nHYhMUOUCAwEAAaNT
MFEwHQYDVR0OBBYEFPVV6xBUFPiGKDyo5V3+Hbh4N9YSMB8GA1UdIwQYMBaAFPVV
6xBUFPiGKDyo5V3+Hbh4N9YSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAGa9kS21N70ThM6/Hj9D7mbVxKLBjVWe2TPsGfbl3rEDfZ+OKRZ2j6AC
6r7jb4TZO3dzF2p6dgbrlU71Y/4K0TdzIjRj3cQ3KSm41JvUQ0hZ/c04iGDg/xWf
+pp58nfPAYwuerruPNWmlStWAXf0UTqRtg4hQDWBuUFDJTuWuuBvEXudz74eh/wK
sMwfu1HFvjy5Z0iMDU8PUDepjVolOCue9ashlS4EB5IECdSR2TItnAIiIwimx839
LdUdRudafMu5T5Xma182OC0/u/xRlEm+tvKGGmfFcN0piqVl8OrSPBgIlb+1IKJE
m/XriWr/Cq4h/JfB7NTsezVslgkBaoU=`,
  },
  {
    clientId: 'rnmqttv388842',
    host: 'test.mosquitto.org',
    port: 8884,
    protocol: 'tls',
    p12: `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
IQICCAA=`,
    pass: 'a123456',
    ca: `MIIEAzCCAuugAwIBAgIUBY1hlCGvdj4NhBXkZ/uLUZNILAwwDQYJKoZIhvcNAQEL
BQAwgZAxCzAJBgNVBAYTAkdCMRcwFQYDVQQIDA5Vbml0ZWQgS2luZ2RvbTEOMAwG
A1UEBwwFRGVyYnkxEjAQBgNVBAoMCU1vc3F1aXR0bzELMAkGA1UECwwCQ0ExFjAU
BgNVBAMMDW1vc3F1aXR0by5vcmcxHzAdBgkqhkiG9w0BCQEWEHJvZ2VyQGF0Y2hv
by5vcmcwHhcNMjAwNjA5MTEwNjM5WhcNMzAwNjA3MTEwNjM5WjCBkDELMAkGA1UE
BhMCR0IxFzAVBgNVBAgMDlVuaXRlZCBLaW5nZG9tMQ4wDAYDVQQHDAVEZXJieTES
MBAGA1UECgwJTW9zcXVpdHRvMQswCQYDVQQLDAJDQTEWMBQGA1UEAwwNbW9zcXVp
dHRvLm9yZzEfMB0GCSqGSIb3DQEJARYQcm9nZXJAYXRjaG9vLm9yZzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAME0HKmIzfTOwkKLT3THHe+ObdizamPg
UZmD64Tf3zJdNeYGYn4CEXbyP6fy3tWc8S2boW6dzrH8SdFf9uo320GJA9B7U1FW
Te3xda/Lm3JFfaHjkWw7jBwcauQZjpGINHapHRlpiCZsquAthOgxW9SgDgYlGzEA
s06pkEFiMw+qDfLo/sxFKB6vQlFekMeCymjLCbNwPJyqyhFmPWwio/PDMruBTzPH
3cioBnrJWKXc3OjXdLGFJOfj7pP0j/dr2LH72eSvv3PQQFl90CZPFhrCUcRHSSxo
E6yjGOdnz7f6PveLIB574kQORwt8ePn0yidrTC1ictikED3nHYhMUOUCAwEAAaNT
MFEwHQYDVR0OBBYEFPVV6xBUFPiGKDyo5V3+Hbh4N9YSMB8GA1UdIwQYMBaAFPVV
6xBUFPiGKDyo5V3+Hbh4N9YSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAGa9kS21N70ThM6/Hj9D7mbVxKLBjVWe2TPsGfbl3rEDfZ+OKRZ2j6AC
6r7jb4TZO3dzF2p6dgbrlU71Y/4K0TdzIjRj3cQ3KSm41JvUQ0hZ/c04iGDg/xWf
+pp58nfPAYwuerruPNWmlStWAXf0UTqRtg4hQDWBuUFDJTuWuuBvEXudz74eh/wK
sMwfu1HFvjy5Z0iMDU8PUDepjVolOCue9ashlS4EB5IECdSR2TItnAIiIwimx839
LdUdRudafMu5T5Xma182OC0/u/xRlEm+tvKGGmfFcN0piqVl8OrSPBgIlb+1IKJE
m/XriWr/Cq4h/JfB7NTsezVslgkBaoU=`,
  },
  {
    clientId: 'rnmqttv38885',
    host: 'test.mosquitto.org',
    port: 8885,
    protocol: 'tls',
    username: 'rw',
    password: 'readwrite',
    ca: `MIIEAzCCAuugAwIBAgIUBY1hlCGvdj4NhBXkZ/uLUZNILAwwDQYJKoZIhvcNAQEL
BQAwgZAxCzAJBgNVBAYTAkdCMRcwFQYDVQQIDA5Vbml0ZWQgS2luZ2RvbTEOMAwG
A1UEBwwFRGVyYnkxEjAQBgNVBAoMCU1vc3F1aXR0bzELMAkGA1UECwwCQ0ExFjAU
BgNVBAMMDW1vc3F1aXR0by5vcmcxHzAdBgkqhkiG9w0BCQEWEHJvZ2VyQGF0Y2hv
by5vcmcwHhcNMjAwNjA5MTEwNjM5WhcNMzAwNjA3MTEwNjM5WjCBkDELMAkGA1UE
BhMCR0IxFzAVBgNVBAgMDlVuaXRlZCBLaW5nZG9tMQ4wDAYDVQQHDAVEZXJieTES
MBAGA1UECgwJTW9zcXVpdHRvMQswCQYDVQQLDAJDQTEWMBQGA1UEAwwNbW9zcXVp
dHRvLm9yZzEfMB0GCSqGSIb3DQEJARYQcm9nZXJAYXRjaG9vLm9yZzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAME0HKmIzfTOwkKLT3THHe+ObdizamPg
UZmD64Tf3zJdNeYGYn4CEXbyP6fy3tWc8S2boW6dzrH8SdFf9uo320GJA9B7U1FW
Te3xda/Lm3JFfaHjkWw7jBwcauQZjpGINHapHRlpiCZsquAthOgxW9SgDgYlGzEA
s06pkEFiMw+qDfLo/sxFKB6vQlFekMeCymjLCbNwPJyqyhFmPWwio/PDMruBTzPH
3cioBnrJWKXc3OjXdLGFJOfj7pP0j/dr2LH72eSvv3PQQFl90CZPFhrCUcRHSSxo
E6yjGOdnz7f6PveLIB574kQORwt8ePn0yidrTC1ictikED3nHYhMUOUCAwEAAaNT
MFEwHQYDVR0OBBYEFPVV6xBUFPiGKDyo5V3+Hbh4N9YSMB8GA1UdIwQYMBaAFPVV
6xBUFPiGKDyo5V3+Hbh4N9YSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAGa9kS21N70ThM6/Hj9D7mbVxKLBjVWe2TPsGfbl3rEDfZ+OKRZ2j6AC
6r7jb4TZO3dzF2p6dgbrlU71Y/4K0TdzIjRj3cQ3KSm41JvUQ0hZ/c04iGDg/xWf
+pp58nfPAYwuerruPNWmlStWAXf0UTqRtg4hQDWBuUFDJTuWuuBvEXudz74eh/wK
sMwfu1HFvjy5Z0iMDU8PUDepjVolOCue9ashlS4EB5IECdSR2TItnAIiIwimx839
LdUdRudafMu5T5Xma182OC0/u/xRlEm+tvKGGmfFcN0piqVl8OrSPBgIlb+1IKJE
m/XriWr/Cq4h/JfB7NTsezVslgkBaoU=`,
  },
  {
    clientId: 'rnmqttv38886',
    host: 'test.mosquitto.org',
    port: 8886,
    protocol: 'mqtts',
  },
  {
    clientId: 'rnmqttv38887',
    host: 'test.mosquitto.org',
    port: 8887,
    protocol: 'mqtts',
    insecure: true,
    ca: `MIIEAzCCAuugAwIBAgIUBY1hlCGvdj4NhBXkZ/uLUZNILAwwDQYJKoZIhvcNAQEL
BQAwgZAxCzAJBgNVBAYTAkdCMRcwFQYDVQQIDA5Vbml0ZWQgS2luZ2RvbTEOMAwG
A1UEBwwFRGVyYnkxEjAQBgNVBAoMCU1vc3F1aXR0bzELMAkGA1UECwwCQ0ExFjAU
BgNVBAMMDW1vc3F1aXR0by5vcmcxHzAdBgkqhkiG9w0BCQEWEHJvZ2VyQGF0Y2hv
by5vcmcwHhcNMjAwNjA5MTEwNjM5WhcNMzAwNjA3MTEwNjM5WjCBkDELMAkGA1UE
BhMCR0IxFzAVBgNVBAgMDlVuaXRlZCBLaW5nZG9tMQ4wDAYDVQQHDAVEZXJieTES
MBAGA1UECgwJTW9zcXVpdHRvMQswCQYDVQQLDAJDQTEWMBQGA1UEAwwNbW9zcXVp
dHRvLm9yZzEfMB0GCSqGSIb3DQEJARYQcm9nZXJAYXRjaG9vLm9yZzCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBAME0HKmIzfTOwkKLT3THHe+ObdizamPg
UZmD64Tf3zJdNeYGYn4CEXbyP6fy3tWc8S2boW6dzrH8SdFf9uo320GJA9B7U1FW
Te3xda/Lm3JFfaHjkWw7jBwcauQZjpGINHapHRlpiCZsquAthOgxW9SgDgYlGzEA
s06pkEFiMw+qDfLo/sxFKB6vQlFekMeCymjLCbNwPJyqyhFmPWwio/PDMruBTzPH
3cioBnrJWKXc3OjXdLGFJOfj7pP0j/dr2LH72eSvv3PQQFl90CZPFhrCUcRHSSxo
E6yjGOdnz7f6PveLIB574kQORwt8ePn0yidrTC1ictikED3nHYhMUOUCAwEAAaNT
MFEwHQYDVR0OBBYEFPVV6xBUFPiGKDyo5V3+Hbh4N9YSMB8GA1UdIwQYMBaAFPVV
6xBUFPiGKDyo5V3+Hbh4N9YSMA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAGa9kS21N70ThM6/Hj9D7mbVxKLBjVWe2TPsGfbl3rEDfZ+OKRZ2j6AC
6r7jb4TZO3dzF2p6dgbrlU71Y/4K0TdzIjRj3cQ3KSm41JvUQ0hZ/c04iGDg/xWf
+pp58nfPAYwuerruPNWmlStWAXf0UTqRtg4hQDWBuUFDJTuWuuBvEXudz74eh/wK
sMwfu1HFvjy5Z0iMDU8PUDepjVolOCue9ashlS4EB5IECdSR2TItnAIiIwimx839
LdUdRudafMu5T5Xma182OC0/u/xRlEm+tvKGGmfFcN0piqVl8OrSPBgIlb+1IKJE
m/XriWr/Cq4h/JfB7NTsezVslgkBaoU=`,
  },
  {
    clientId: 'rnmqttv38080',
    host: 'test.mosquitto.org',
    port: 8080,
    protocol: 'ws',
  },
  {
    clientId: 'rnmqttv38081',
    host: 'test.mosquitto.org',
    port: 8081,
    protocol: 'wss',
  },
  {
    clientId: 'rnmqttv38090',
    host: 'test.mosquitto.org',
    port: 8090,
    protocol: 'ws',
    username: 'rw',
    password: 'readwrite',
  },
  {
    clientId: 'rnmqttv38091',
    host: 'test.mosquitto.org',
    port: 8091,
    protocol: 'wss',
    username: 'rw',
    password: 'readwrite',
  },
  {
    clientId: 'NoHost',
    host: '',
    port: 1883,
  },
  {
    clientId: 'NotAuth',
    host: 'test.mosquitto.org',
    port: 1884,
  },
];

export default function App() {
  const [clientIndex, setClientIndex] = useState(0);
  const [status, setStatus] = useState('INIT');
  const clientRef = useRef<MqttClient | undefined>(undefined);
  const [messages, setMessages] = useState<{ id: string; body: string }[]>([]);
  const addMessage = useCallback(
    (body: string) => {
      setMessages((msg: any[]) => [
        ...msg,
        { id: String(msg.length + 1), body },
      ]);
    },
    [setMessages]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text>Select client</Text>
      <View style={styles.row}>
        {clientOptions.map((item, index) => (
          <Button
            key={item.clientId}
            title={
              item.clientId?.startsWith('rnmqttv3')
                ? item.clientId.substring(8)
                : item.clientId
            }
            onPress={() => setClientIndex(index)}
            color={clientIndex === index ? '#c917fd' : '#e8a6fc'}
            disabled={status !== 'INIT'}
          />
        ))}
      </View>
      <View style={styles.row}>
        <Button
          title="Create Client"
          onPress={() => {
            createMqttClient(clientOptions[clientIndex]!)
              .then((client) => {
                clientRef.current = client;
                setStatus('CREATED');
                client.onConnect(() => {
                  addMessage('onConnect');
                });
                client.onDisconnect(({ message }) => {
                  addMessage('onDisconnect:' + message);
                });
                client.onMessage(({ topic, base64Message }) => {
                  addMessage(
                    'onMessage:' +
                      topic +
                      ' ' +
                      new Buffer(base64Message, 'base64').toString('utf8')
                  );
                });
              })
              .catch((e) => {
                addMessage('create error:' + e.message);
              });
          }}
          disabled={status !== 'INIT'}
        />
        <Button
          title="Connect"
          onPress={() => {
            clientRef.current
              ?.connect()
              .then(() => {
                setStatus('CONNECTED');
                addMessage('connected');
              })
              .catch((e) => {
                addMessage('connect error:' + e.message);
              });
          }}
          disabled={status !== 'CREATED'}
        />
      </View>
      <View style={styles.row}>
        <Button
          title="Subscribe"
          onPress={() => {
            clientRef.current
              ?.subscribe('cnhongwei/#')
              .then(() => {
                addMessage('subscribe success');
              })
              .catch((e) => {
                addMessage('subscribe error:' + e.message);
              });
          }}
          disabled={status !== 'CONNECTED'}
        />
        <Button
          title="Unsubscribe"
          onPress={() => {
            clientRef.current
              ?.unsubscribe('cnhongwei/#')
              .then(() => {
                addMessage('unsubscribe success');
              })
              .catch((e) => {
                addMessage('unsubscribe error:' + e.message);
              });
          }}
          disabled={status !== 'CONNECTED'}
        />
      </View>
      <View style={styles.row}>
        <Button
          title="Publish"
          onPress={() => {
            clientRef.current
              ?.publish(
                'cnhongwei/test',
                new Buffer('Hello ' + new Date().toISOString()).toString(
                  'base64'
                )
              )
              .then(() => {
                addMessage('publish success');
              })
              .catch((e) => {
                addMessage('publish error:' + e.message);
              });
          }}
          disabled={status !== 'CONNECTED'}
        />
      </View>
      <View style={styles.row}>
        <Button
          title="Disconnect"
          onPress={() => {
            clientRef.current
              ?.disconnect()
              .then(() => {
                addMessage('disconnected');
              })
              .catch((e) => {
                addMessage('disconnect error:' + e.message);
              });
            setStatus('CREATED');
          }}
          disabled={status !== 'CONNECTED'}
        />
        <Button
          title="Close"
          onPress={() => {
            clientRef.current
              ?.close()
              .then(() => {
                clientRef.current = undefined;
                setStatus('INIT');
                setMessages([]);
              })
              .catch((e) => {
                addMessage('close error:' + e.message);
              });
          }}
          disabled={status !== 'CREATED'}
        />
      </View>
      <View style={styles.container}>
        <FlatList
          data={messages}
          renderItem={(i) => <Text>{i.item.body}</Text>}
          keyExtractor={(item) => item.id}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 2,
    flexWrap: 'wrap',
  },
});
