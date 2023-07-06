#import <React/RCTBridgeModule.h>

#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(MqttV3, RCTEventEmitter)

RCT_EXTERN_METHOD(createClient:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(close:(NSString *)clientId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(connect:(NSDictionary *)options resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(disconnect:(NSString *)clientId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(publish:(NSDictionary *)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(subscribe:(NSDictionary *)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(unsubscribe:(NSString *)clientId topic:(NSString *)topic resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

- (dispatch_queue_t)methodQueue
{
    return dispatch_queue_create("com.cnhongwei.mqttv3", DISPATCH_QUEUE_SERIAL);
}

+ (BOOL)requiresMainQueueSetup
{
    return NO;
}

@end
