package com.mqttv3;

import android.util.Base64;
import android.util.Log;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import org.eclipse.paho.android.service.MqttAndroidClient;
import org.eclipse.paho.client.mqttv3.IMqttActionListener;
import org.eclipse.paho.client.mqttv3.IMqttDeliveryToken;
import org.eclipse.paho.client.mqttv3.IMqttToken;
import org.eclipse.paho.client.mqttv3.MqttCallback;
import org.eclipse.paho.client.mqttv3.MqttConnectOptions;
import org.eclipse.paho.client.mqttv3.MqttException;
import org.eclipse.paho.client.mqttv3.MqttMessage;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.util.HashMap;
import java.util.Map;

import javax.net.ssl.KeyManager;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSocketFactory;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;
import javax.net.ssl.X509TrustManager;

public class MqttV3Client {
  public static final String NAME = "MqttV3";
  public static final String DISCONNECT_PREFIX = NAME + ":onDisconnect:";
  public static final String MESSAGE_PREFIX = NAME + ":onMessage:";
  private static final Map<String, MqttAndroidClient> clients = new HashMap<>();


  private static WritableMap writableMapOf(String... str) {
    WritableMap map = Arguments.createMap();
    for (int i = 0; i < str.length / 2; i++) {
      map.putString(str[i * 2], str[i * 2 + 1]);
    }
    return map;
  }

  private static void sendEvent(ReactContext reactContext, String eventName, @Nullable WritableMap params) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(eventName, params);
  }

  private static TrustManager[] getTrustManagers(String ca) throws Exception {
    CertificateFactory cf = CertificateFactory.getInstance("X.509");
    byte[] bytes;
    if (ca.startsWith("-----BEGIN CERTIFICATE-----")) {
      bytes = ca.getBytes(StandardCharsets.UTF_8);
    } else {
      bytes = Base64.decode(ca, Base64.CRLF);
    }
    try (ByteArrayInputStream bis = new ByteArrayInputStream(bytes)) {
      X509Certificate caCert = (X509Certificate) cf.generateCertificate(bis);
      KeyStore caKs = KeyStore.getInstance(KeyStore.getDefaultType());
      caKs.load(null, null);
      caKs.setCertificateEntry("cert-certificate", caCert);
      TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
      tmf.init(caKs);
      return tmf.getTrustManagers();
    }
  }

  private static TrustManager[] getInsecureTrustManagers() throws Exception {
    TrustManager[] trustAllCerts = new TrustManager[]{new X509TrustManager() {
      @Override
      public void checkClientTrusted(X509Certificate[] chain, String authType) throws CertificateException {
      }

      @Override
      public void checkServerTrusted(X509Certificate[] chain, String authType) throws CertificateException {
      }

      public X509Certificate[] getAcceptedIssuers() {
        return new X509Certificate[0];
      }
    }};
    return trustAllCerts;
  }

  private static KeyManager[] getKeyManagers(String p12, String pass) throws Exception {
    KeyStore keyStore = KeyStore.getInstance("PKCS12");
    char[] password = pass == null ? "".toCharArray() : pass.toCharArray();
    try (ByteArrayInputStream bis = new ByteArrayInputStream(Base64.decode(p12, Base64.CRLF))) {
      keyStore.load(bis, password);
    }
    KeyManagerFactory keyManagerFactory = KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
    keyManagerFactory.init(keyStore, password);

    return keyManagerFactory.getKeyManagers();
  }


  private static SSLSocketFactory getTlsSocketFactory(String p12, String pass, String ca, boolean insecure) throws Exception {
    TrustManager[] trustManagers = insecure ? getInsecureTrustManagers() : ca == null ? null : getTrustManagers(ca);
    KeyManager[] keyManagers = p12 == null && pass == null ? null : getKeyManagers(p12, pass);
    SSLContext sslContext = SSLContext.getInstance("TLS");
    sslContext.init(keyManagers, trustManagers, null);
    return sslContext.getSocketFactory();
  }

  public static void createClient(ReactApplicationContext reactApplicationContext, ClientOptions clientOptions, Promise promise) {
    String clientId = clientOptions.getClientId();
    MqttAndroidClient client = clients.get(clientId);
    if (client != null) {
      Log.d(NAME, "get mqtt v3 client " + clientId);
      promise.resolve(clientId);
      return;
    }
    String url = clientOptions.getUrl();
    Log.d(NAME, "create mqtt v3 client " + url);
    MqttAndroidClient mqttAndroidClient = new MqttAndroidClient(reactApplicationContext, url, clientId, new MemoryPersistence());

    mqttAndroidClient.setCallback(new MqttCallback() {
      @Override
      public void connectionLost(Throwable cause) {
        Log.d(NAME, "connectionLost...", cause);
        String message = "disconnect";
        if (cause != null && cause.getMessage() != null) {
          message = cause.getMessage();
        }
        sendEvent(reactApplicationContext, DISCONNECT_PREFIX + mqttAndroidClient.getClientId(), writableMapOf("message", message));
      }

      @Override
      public void messageArrived(String topic, MqttMessage message) {
        Log.d(NAME, "messageArrived..." + clientId + " " + topic + ":" + new String(message.getPayload(), StandardCharsets.UTF_8));
        sendEvent(reactApplicationContext, MESSAGE_PREFIX + mqttAndroidClient.getClientId(), writableMapOf("topic", topic, "base64Message", Base64.encodeToString(message.getPayload(), Base64.NO_WRAP)));
      }

      @Override
      public void deliveryComplete(IMqttDeliveryToken token) {
        Log.d(NAME, "deliveryComplete..." + token.getMessageId());
      }
    });
    clients.put(clientId, mqttAndroidClient);
    promise.resolve(clientId);
  }

  public static void close(String clientId, Promise promise) {
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      Log.w(NAME, "client doesn't create");
    } else {
      client.close();
      clients.remove(clientId);
      Log.d(NAME, "client closed");
    }
    promise.resolve(clientId);
  }

  public static void connect(ClientOptions clientOptions, Promise promise) {
    String clientId = clientOptions.getClientId();
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      promise.reject("error", "client doesn't create");
      return;
    }

    MqttConnectOptions mqttConnectOptions = new MqttConnectOptions();
    if (clientOptions.getUsername() != null) {
      mqttConnectOptions.setUserName(clientOptions.getUsername());
      if (clientOptions.getPassword() != null) {
        mqttConnectOptions.setPassword(clientOptions.getPassword().toCharArray());
      }
    }

    try {
      String p12 = clientOptions.getP12();
      String pass = clientOptions.getPass();
      String ca = clientOptions.getCa();
      if (p12 != null || ca != null || clientOptions.isInsecure()) {
        mqttConnectOptions.setSocketFactory(getTlsSocketFactory(p12, pass, ca, clientOptions.isInsecure()));
        mqttConnectOptions.setHttpsHostnameVerificationEnabled(false);
      }
    } catch (Exception e) {
      Log.d(NAME, "Error...", e);
      promise.reject("error", "create ssl connect error", e);
      return;
    }
    //mqttConnectOptions.setAutomaticReconnect(true);
    try {
      client.connect(mqttConnectOptions, null, new IMqttActionListener() {
        @Override
        public void onSuccess(IMqttToken asyncActionToken) {
          Log.d(NAME, "connect onSuccess...");
          promise.resolve(clientId);
        }

        @Override
        public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
          Log.e(NAME, "connect onFailure...", exception);
          promise.reject("error", exception == null ? "connect error" : exception.getMessage(), exception);
        }
      });
    } catch (MqttException e) {
      Log.d(NAME, "Error...", e);
      promise.reject("error", "connect error", e);
    }
  }

  public static void disconnect(String clientId, Promise promise) {
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      Log.w(NAME, "client doesn't create");
      promise.resolve(clientId);
    } else {
      try {
        client.disconnect(null, new IMqttActionListener() {
          @Override
          public void onSuccess(IMqttToken asyncActionToken) {
            Log.d(NAME, "disconnect onSuccess...");
            promise.resolve(clientId);
          }

          @Override
          public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
            Log.e(NAME, "disconnect onFailure...");
            promise.reject("error", exception == null ? "disconnect error" : exception.getMessage(), exception);
          }
        });
      } catch (MqttException e) {
        Log.e(NAME, "disconnect error...", e);
        promise.reject("error", e == null ? "disconnect error" : e.getMessage(), e);
      }
    }
  }

  public static void subscribe(String clientId, String topic, int qos, Promise promise) {
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      promise.reject("error", "client doesn't create");
      return;
    }
    Log.d(NAME, "subscribe " + topic + "/" + qos);
    try {
      client.subscribe(topic, qos, null, new IMqttActionListener() {
        @Override
        public void onSuccess(IMqttToken asyncActionToken) {
          Log.d(NAME, "subscribe onSuccess..." + asyncActionToken.toString());
          promise.resolve(topic);
        }

        @Override
        public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
          Log.d(NAME, "subscribe onFailure..." + asyncActionToken.toString());
          promise.reject("error", exception == null ? "subscribe error" : exception.getMessage(), exception);
        }
      });
    } catch (MqttException e) {
      Log.d(NAME, "subscribe error ...", e);
      promise.reject("error", e == null ? "subscribe error" : e.getMessage(), e);
    }
  }

  public static void unsubscribe(String clientId, String topic, Promise promise) {
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      promise.reject("error", "client doesn't create");
      return;
    }
    try {
      client.unsubscribe(topic, null, new IMqttActionListener() {
        @Override
        public void onSuccess(IMqttToken asyncActionToken) {
          Log.d(NAME, "unsubscribe onSuccess..." + asyncActionToken.toString());
          promise.resolve(topic);
        }

        @Override
        public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
          Log.d(NAME, "unsubscribe onFailure..." + asyncActionToken.toString());
          promise.reject("error", exception == null ? "subscribe error" : exception.getMessage(), exception);
        }
      });
    } catch (MqttException e) {
      Log.d(NAME, "unsubscribe error ...", e);
      promise.reject("error", e == null ? "unsubscribe error" : e.getMessage(), e);
    }
  }

  public static void publish(String clientId, String topic, String base64Body, int qos, boolean retained, Promise promise) {
    MqttAndroidClient client = clients.get(clientId);
    if (client == null) {
      promise.reject("error", "client doesn't create");
      return;
    }
    MqttMessage message = new MqttMessage(Base64.decode(base64Body, Base64.NO_WRAP));
    message.setQos(qos);
    message.setRetained(retained);
    try {
      client.publish(topic, message, null, new IMqttActionListener() {
        @Override
        public void onSuccess(IMqttToken asyncActionToken) {
          Log.d(NAME, "publish onSuccess..." + asyncActionToken.toString());
          promise.resolve(topic);
        }

        @Override
        public void onFailure(IMqttToken asyncActionToken, Throwable exception) {
          Log.d(NAME, "publish onFailure..." + asyncActionToken.toString());
          promise.reject("error", exception == null ? "subscribe error" : exception.getMessage(), exception);
        }
      });
    } catch (MqttException e) {
      Log.d(NAME, "publish error ...", e);
      promise.reject("error", e == null ? "publish error" : e.getMessage(), e);
    }
  }
}
