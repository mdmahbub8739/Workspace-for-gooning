import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { beginOAuth, OAUTH_APP_RETURN } from '@/services/oauth';
import { useAuth } from '@/contexts/auth';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { BrandGradient, BrandMark } from '@/components/ui/brand';
import { SectionHeader } from '@/components/ui/section-header';
import { Banner, Field, Group, ListRow } from '@/components/ui/kit';
import { M3_SPRING, M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import { AuthMethod } from '@/services/types';

const VIDEO_TOKEN = require('@/assets/video/generate-api-token.mp4');
const VIDEO_GLOBAL = require('@/assets/video/get-global-api-key.mp4');

interface FeaturePoint {
  icon: IconName;
  text: string;
}

const METHODS: { value: AuthMethod; label: string }[] = [
  { value: 'token', label: 'API Token' },
  { value: 'global_key', label: 'Global Key' },
];

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { add } = useLocalSearchParams<{ add?: string }>();
  const isAddMode = add === '1';

  const [method, setMethod] = useState<AuthMethod>('token');
  const [apiToken, setApiToken] = useState('');
  const [globalKey, setGlobalKey] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // On web, custom cfmobile:// OAuth callbacks cannot return to the browser tab, so expand token login by default.
  const [showAdvanced, setShowAdvanced] = useState(Platform.OS === 'web');
  const [segWidth, setSegWidth] = useState(0);

  const indicatorX = useSharedValue(0);
  useEffect(() => {
    const idx = method === 'token' ? 0 : 1;
    const itemW = Math.max(0, (segWidth - 8) / 2);
    indicatorX.value = withSpring(idx * itemW, M3_SPRING);
  }, [method, segWidth, indicatorX]);

  const segmentIndicatorStyle = useAnimatedStyle(() => ({
    width: Math.max(0, (segWidth - 8) / 2),
    transform: [{ translateX: indicatorX.value }],
  }));

  const startOAuth = async () => {
    setErrorMsg(null);
    setOauthLoading(true);
    try {
      const url = await beginOAuth(isAddMode);
      await WebBrowser.openAuthSessionAsync(url, OAUTH_APP_RETURN);
    } catch (e: any) {
      const msg = e?.message ?? t('auth.oauth_failed');
      setErrorMsg(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
    } finally {
      setOauthLoading(false);
    }
  };

  const player = useVideoPlayer(method === 'token' ? VIDEO_TOKEN : VIDEO_GLOBAL, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const openVideo = () => {
    setShowVideo(true);
    player.play();
  };

  const closeVideo = () => {
    player.pause();
    setShowVideo(false);
  };

  const handleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (method === 'token') {
        if (!apiToken.trim()) {
          const msg = t('auth.token_required');
          setErrorMsg(msg);
          if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
          return;
        }
        await login({ method: 'token', apiToken: apiToken.replace(/\s+/g, '') });
      } else {
        if (!email.trim() || !globalKey.trim()) {
          const msg = t('auth.fields_required');
          setErrorMsg(msg);
          if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
          return;
        }
        await login({ method: 'global_key', globalKey: globalKey.replace(/\s+/g, ''), email: email.trim() });
      }
      if (isAddMode && router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    } catch (e: any) {
      const msg = e?.response?.data?.errors?.[0]?.message ?? e?.message ?? t('auth.error');
      setErrorMsg(msg);
      if (Platform.OS !== 'web') Alert.alert(t('common.error'), msg);
    } finally {
      setLoading(false);
    }
  };

  const dashboardUrl = 'https://dash.cloudflare.com/profile/api-tokens';

  const features: FeaturePoint[] = [
    { icon: 'lock', text: t('auth.feature_secure') },
    { icon: 'zap', text: t('auth.feature_fast') },
    { icon: 'shield', text: t('auth.feature_private') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + Spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Material You Hero Canvas */}
          <View style={[styles.hero, { paddingTop: insets.top + Spacing.xl, backgroundColor: colors.primaryContainer }]}>
            <BrandGradient />
            {isAddMode && router.canGoBack() && (
              <M3Pressable
                onPress={() => router.back()}
                radius={22}
                stateLayerColor={colors.onPrimaryContainer}
                style={[
                  styles.back,
                  getGlassStyle(colors, isDark, 'surface', 22),
                  { top: insets.top + Spacing.md },
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Back"
              >
                <Icon name="arrow-left" size={18} color={colors.onSurface} />
              </M3Pressable>
            )}

            <M3Entrance index={0} distance={10} style={styles.heroCenter}>
              <View style={[styles.mark, { backgroundColor: colors.primary }]}>
                <BrandMark bare size={42} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.onPrimaryContainer }]}>CloudFlare Mobile</Text>
              <Text style={[styles.heroTagline, { color: colors.onPrimaryContainer }]}>{t('auth.tagline')}</Text>

              <View style={styles.featureRow}>
                {features.map((f) => (
                  <View key={f.icon} style={styles.feature}>
                    <Icon name={f.icon} size={13} color={colors.onPrimaryContainer} />
                    <Text style={[styles.featureText, { color: colors.onPrimaryContainer }]}>{f.text}</Text>
                  </View>
                ))}
              </View>
            </M3Entrance>
          </View>

          <View style={styles.body}>
            <M3Entrance index={1} distance={14}>
              {/* Frosted Glass Auth Surface */}
              <View style={[styles.form, getGlassStyle(colors, isDark, 'elevated', Radius.xl)]}>
                <Text style={[styles.formTitle, { color: colors.onSurface }]}>{t('auth.sign_in')}</Text>
                <Text style={[styles.formSubtitle, { color: colors.onSurfaceVariant }]}>{t('auth.oauth_hint')}</Text>

                <Button
                  title={t('auth.oauth_button')}
                  onPress={startOAuth}
                  loading={oauthLoading}
                  size="lg"
                  icon={<BrandMark bare size={22} />}
                  style={styles.oauth}
                />

                <M3Pressable
                  onPress={() => setShowAdvanced((v) => !v)}
                  radius={Radius.md}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showAdvanced }}
                  style={[styles.advanced, { borderTopColor: colors.glassBorderSubtle }]}
                >
                  <View style={styles.advancedText}>
                    <Text style={[styles.advancedTitle, { color: colors.onSurface }]}>{t('auth.advanced')}</Text>
                    <Text style={[styles.advancedHint, { color: colors.onSurfaceVariant }]}>{t('auth.advanced_hint')}</Text>
                  </View>
                  <View style={[styles.expandBadge, getGlassStyle(colors, isDark, 'subtle', 16)]}>
                    <Icon name={showAdvanced ? 'chevron-up' : 'chevron-down'} size={18} color={colors.onSurfaceVariant} />
                  </View>
                </M3Pressable>

                {showAdvanced && (
                  <M3Entrance index={0} distance={8}>
                    {/* Animated Frosted Glass Segmented Control */}
                    <View
                      style={[
                        styles.segment,
                        getGlassStyle(colors, isDark, 'subtle', Radius.full),
                      ]}
                      onLayout={(e) => setSegWidth(e.nativeEvent.layout.width)}
                    >
                      {segWidth > 0 && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.segmentIndicator,
                            getTintedGlassStyle(colors, isDark, colors.secondaryContainer + '94', 16),
                            segmentIndicatorStyle,
                          ]}
                        />
                      )}
                      {METHODS.map((m) => {
                        const active = m.value === method;
                        return (
                          <TouchableOpacity
                            key={m.value}
                            onPress={() => setMethod(m.value)}
                            activeOpacity={0.85}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            style={styles.segmentItem}
                          >
                            {active && <Icon name="check" size={15} color={colors.onSecondaryContainer} />}
                            <Text
                              style={[
                                styles.segmentText,
                                { color: active ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                              ]}
                            >
                              {m.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {method === 'token' ? (
                      <View style={styles.hint}>
                        <Icon name="check-circle" size={15} color={colors.success} />
                        <Text style={[styles.hintText, { color: colors.onSurfaceVariant }]}>{t('auth.recommended')}</Text>
                      </View>
                    ) : (
                      <View style={styles.warning}>
                        <Banner tone="warning" message={t('auth.full_access_warning')} />
                      </View>
                    )}

                    {method === 'token' ? (
                      <Field
                        label={t('auth.api_token')}
                        placeholder={t('auth.token_placeholder')}
                        value={apiToken}
                        onChangeText={setApiToken}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    ) : (
                      <>
                        <Field
                          label={t('auth.email')}
                          placeholder="user@example.com"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <Field
                          label={t('auth.global_key')}
                          placeholder={t('auth.global_key_placeholder')}
                          value={globalKey}
                          onChangeText={setGlobalKey}
                          secureTextEntry
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </>
                    )}

                    {errorMsg && (
                      <View style={styles.warning}>
                        <Banner tone="error" message={errorMsg} />
                      </View>
                    )}

                    <Button
                      title={loading ? t('auth.verifying') : t('auth.login')}
                      onPress={handleLogin}
                      loading={loading}
                      size="lg"
                      variant="tonal"
                      style={styles.submit}
                    />
                  </M3Entrance>
                )}
              </View>
            </M3Entrance>

            {showAdvanced && (
              <M3Entrance index={2} distance={10}>
                <SectionHeader title={t('auth.need_help')} />
                <Group>
                  <ListRow
                    icon="pageview"
                    title={t('auth.watch_tutorial')}
                    subtitle={t('auth.tutorial_hint')}
                    onPress={openVideo}
                  />
                  <ListRow
                    icon="link"
                    title={t('auth.open_dashboard')}
                    subtitle={t('auth.dashboard_hint')}
                    onPress={() => Linking.openURL(dashboardUrl)}
                  />
                </Group>
              </M3Entrance>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.privacy}
              onPress={() => Linking.openURL('https://github.com/imtaqin/CFMobile')}
            >
              <Icon name="shield" size={14} color={colors.textTertiary} />
              <Text style={[styles.privacyText, { color: colors.onSurfaceVariant }]}>{t('auth.privacy_notice')}</Text>
            </TouchableOpacity>

            <Text style={[styles.footerText, { color: colors.textTertiary }]}>
              {t('auth.unofficial_notice')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showVideo}
        animationType="slide"
        onRequestClose={closeVideo}
        transparent={false}
      >
        <SafeAreaView style={styles.videoRoot}>
          <View style={styles.videoHeader}>
            <Text style={styles.videoTitle} numberOfLines={1}>
              {method === 'token' ? t('auth.tutorial_token') : t('auth.tutorial_global')}
            </Text>
            <TouchableOpacity
              onPress={closeVideo}
              style={styles.videoClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="close" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            allowsFullscreen
            allowsPictureInPicture
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const OVERLAP = 44;

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: OVERLAP + Spacing.xxl,
    overflow: 'hidden',
  },
  heroCenter: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 560,
  },
  back: {
    position: 'absolute',
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  mark: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroTitle: { fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },
  heroTagline: {
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featureText: { fontSize: FontSize.xs, fontWeight: '600', opacity: 0.9 },

  body: {
    paddingHorizontal: Spacing.lg,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  form: {
    marginTop: -OVERLAP,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  formTitle: { fontSize: FontSize.xxl, fontWeight: '700', letterSpacing: -0.4 },
  formSubtitle: { fontSize: FontSize.sm, marginTop: 4, lineHeight: 19 },
  oauth: { marginTop: Spacing.lg },
  advanced: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  advancedText: { flex: 1 },
  advancedTitle: { fontSize: FontSize.md, fontWeight: '600' },
  advancedHint: { fontSize: FontSize.sm, marginTop: 2 },
  expandBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    position: 'relative',
    flexDirection: 'row',
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 4,
    marginTop: Spacing.lg,
    height: 46,
    alignItems: 'center',
  },
  segmentIndicator: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    borderRadius: Radius.full,
  },
  segmentItem: {
    flex: 1,
    height: '100%',
    flexDirection: 'row',
    gap: 6,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: { fontSize: FontSize.sm, fontWeight: '600' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  hintText: { flex: 1, fontSize: FontSize.sm },
  warning: { marginTop: Spacing.md },
  submit: { marginTop: Spacing.xl },

  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  privacyText: { flex: 1, fontSize: FontSize.xs, lineHeight: 17 },
  footerText: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    lineHeight: 16,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.lg,
  },

  videoRoot: { flex: 1, backgroundColor: '#000' },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  videoTitle: { flex: 1, color: '#FFF', fontSize: FontSize.lg, fontWeight: '500' },
  videoClose: { padding: Spacing.sm },
  video: { flex: 1, width: '100%' },
});
