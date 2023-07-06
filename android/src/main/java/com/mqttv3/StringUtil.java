package com.mqttv3;

public class StringUtil {
  public static String trimToNull(String str) {
    if (str == null || str.length() == 0) {
      return null;
    }
    String s = str.trim();
    if (s.length() == 0) {
      return null;
    }
    return s;
  }
}
