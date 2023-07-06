package com.mqttv3;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.module.annotations.ReactModule;

@ReactModule(name = MqttV3Module.NAME)
public class MqttV3Module extends ReactContextBaseJavaModule {
  public static final String NAME = "MqttV3";

  public MqttV3Module(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  @ReactMethod
  public void createClient(final ReadableMap options, final Promise promise) {
    ClientOptions clientOptions = ClientOptions.fromReadableMap(options);
    if (clientOptions.getHost() == null) {
      promise.reject("host", "host is required.");
      return;
    }
    if (clientOptions.getClientId() == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    MqttV3Client.createClient(getReactApplicationContext(), clientOptions, promise);
  }

  @ReactMethod
  public void close(final String clientId, Promise promise) {
    if (clientId == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    MqttV3Client.close(clientId, promise);
  }

  @ReactMethod
  public void connect(final ReadableMap options, Promise promise) {
    ClientOptions clientOptions = ClientOptions.fromReadableMap(options);
    if (clientOptions.getClientId() == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    MqttV3Client.connect(clientOptions, promise);
  }

  @ReactMethod
  public void disconnect(final String clientId, Promise promise) {
    if (clientId == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    MqttV3Client.disconnect(clientId, promise);
  }

  @ReactMethod
  public void subscribe(final ReadableMap params, final Promise promise) {
    String clientId = params.getString("clientId");
    if (clientId == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    String topic = params.getString("topic");
    if (topic == null) {
      promise.reject("topic", "topic is required.");
      return;
    }
    int qos = 1;
    if (params.hasKey("qos")) {
      int i = params.getInt("qos");
      if (i >= 0 && i <= 2) {
        qos = i;
      }
    }
    Log.d(NAME, "subscribe " + topic + "/" + qos);
    MqttV3Client.subscribe(clientId, topic, qos, promise);
  }

  @ReactMethod
  public void unsubscribe(final String clientId, String topic, Promise promise) {
    if (clientId == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    if (topic == null) {
      promise.reject("topic", "topic is required.");
      return;
    }
    MqttV3Client.unsubscribe(clientId, topic, promise);
  }

  @ReactMethod
  public void publish(final ReadableMap params, final Promise promise) {
    String clientId = params.getString("clientId");
    if (clientId == null) {
      promise.reject("clientId", "clientId is required.");
      return;
    }
    String topic = params.getString("topic");
    if (topic == null) {
      promise.reject("topic", "topic is required.");
      return;
    }
    String base64Body = params.getString("base64Body");
    if (base64Body == null) {
      promise.reject("base64Body", "base64Body is required.");
      return;
    }
    int qos = 1;
    if (params.hasKey("qos")) {
      int i = params.getInt("qos");
      if (i >= 0 && i <= 2) {
        qos = i;
      }
    }
    boolean retained = false;
    if (params.hasKey("retained")) {
      retained = params.getBoolean("retained");
    }
    MqttV3Client.publish(clientId, topic, base64Body, qos, retained, promise);
  }


  // Required for rn built in EventEmitter Calls.
  @ReactMethod
  public void addListener(String eventName) {
    Log.d(NAME, "addListener " + eventName);
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    Log.d(NAME, "removeListeners " + count);
  }
}
