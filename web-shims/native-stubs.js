// Web-only no-op stubs for native Android/iOS packages that lack web entrypoints.
class SpInAppUpdatesStub {
  async checkNeedsUpdate() {
    return { shouldUpdate: false };
  }
  async startUpdate() {}
  addStatusUpdateListener() {}
}

module.exports = {
  __esModule: true,
  default: SpInAppUpdatesStub,
  IAUUpdateKind: { FLEXIBLE: 0, IMMEDIATE: 1 },

  // react-native-google-mobile-ads
  BannerAd: () => null,
  BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
  RewardedAd: {
    createForAdRequest: () => ({
      addAdEventListener: () => () => {},
      load: () => {},
      show: () => {},
    }),
  },
  RewardedAdEventType: { LOADED: 'loaded', EARNED_REWARD: 'earned_reward' },
  AdEventType: { CLOSED: 'closed', ERROR: 'error' },
  TestIds: { ADAPTIVE_BANNER: 'test-banner', REWARDED: 'test-rewarded' },

  // react-native-iap
  initConnection: async () => false,
  endConnection: async () => {},
  getProducts: async () => [],
  getSubscriptions: async () => [],
  requestPurchase: async () => null,
  requestSubscription: async () => null,
  finishTransaction: async () => {},
  purchaseUpdatedListener: () => ({ remove: () => {} }),
  purchaseErrorListener: () => ({ remove: () => {} }),
  getAvailablePurchases: async () => [],

  // react-native-android-widget
  registerWidgetTaskHandler: () => {},
  requestPinWidget: async () => false,
  requestWidgetUpdate: async () => {},
  FlexWidget: () => null,
  TextWidget: () => null,
};
