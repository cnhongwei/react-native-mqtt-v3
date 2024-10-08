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
CENQp4PzTW0WAgIIAA==`,
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
CH5hJt5+koniAgIIAA==`,
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
