package com.mqttv3;

import com.facebook.react.bridge.ReadableMap;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ClientOptions {
  private String clientId;
  private String host;
  private Integer port;
  private Integer qos;
  private String username;
  private String password;
  private ClientProtocol protocol = ClientProtocol.TCP;
  private String p12;
  private String pass;
  private String ca;
  private boolean insecure;

  public static ClientOptions fromReadableMap(ReadableMap options) {
    ClientOptions parameters = new ClientOptions();
    parameters.clientId = StringUtil.trimToNull(options.getString("clientId"));
    parameters.host = StringUtil.trimToNull(options.getString("host"));
    if (options.hasKey("port")) {
      parameters.port = options.getInt("port");
    }
    if (options.hasKey("qos")) {
      parameters.qos = options.getInt("qos");
    }
    parameters.username = options.getString("username");
    parameters.password = options.getString("password");
    String p = StringUtil.trimToNull(options.getString("protocol"));
    if (p != null) {
      if (ClientProtocol.TCP.isSupport(p)) {
        parameters.protocol = ClientProtocol.TCP;
      } else if (ClientProtocol.SSL.isSupport(p)) {
        parameters.protocol = ClientProtocol.SSL;
      } else if (ClientProtocol.WS.isSupport(p)) {
        parameters.protocol = ClientProtocol.WS;
      } else if (ClientProtocol.WSS.isSupport(p)) {
        parameters.protocol = ClientProtocol.WSS;
      }
    }
    parameters.p12 = StringUtil.trimToNull(options.getString("p12"));
    parameters.pass = StringUtil.trimToNull(options.getString("pass"));
    parameters.ca = StringUtil.trimToNull(options.getString("ca"));
    if (options.hasKey("insecure")) {
      parameters.insecure = options.getBoolean("insecure");
    }
    return parameters;
  }

  public String getUrl() {
    return (port != null && port > 0) ? protocol.name().toLowerCase() + "://" + host + ":" + port : protocol.name().toLowerCase() + "://" + host;
  }

  private interface ProtocolSupport {
    boolean isSupport(String protocol);
  }

  private enum ClientProtocol implements ProtocolSupport {
    TCP {
      private final List<String> protocols = Arrays.asList("mqtt", "tcp");

      @Override
      public boolean isSupport(String protocol) {
        return protocols.contains(protocol.toLowerCase());
      }
    }, SSL {
      private final List<String> protocols = Arrays.asList("mqtts", "tls", "ssl");

      @Override
      public boolean isSupport(String protocol) {
        return protocols.contains(protocol.toLowerCase());
      }
    }, WS {
      private final List<String> protocols = Collections.singletonList("ws");

      @Override
      public boolean isSupport(String protocol) {
        return protocols.contains(protocol.toLowerCase());
      }
    }, WSS {
      private final List<String> protocols = Collections.singletonList("wss");

      @Override
      public boolean isSupport(String protocol) {
        return protocols.contains(protocol.toLowerCase());
      }
    },
  }

  public String getClientId() {
    return clientId;
  }

  public void setClientId(String clientId) {
    this.clientId = clientId;
  }

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  public Integer getPort() {
    return port;
  }

  public void setPort(Integer port) {
    this.port = port;
  }

  public Integer getQos() {
    return qos;
  }

  public void setQos(Integer qos) {
    this.qos = qos;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  public ClientProtocol getProtocol() {
    return protocol;
  }

  public void setProtocol(ClientProtocol protocol) {
    this.protocol = protocol;
  }

  public String getP12() {
    return p12;
  }

  public void setP12(String p12) {
    this.p12 = p12;
  }

  public String getPass() {
    return pass;
  }

  public void setPass(String pass) {
    this.pass = pass;
  }

  public String getCa() {
    return ca;
  }

  public void setCa(String ca) {
    this.ca = ca;
  }

  public boolean isInsecure() {
    return insecure;
  }

  public void setInsecure(boolean insecure) {
    this.insecure = insecure;
  }
}
