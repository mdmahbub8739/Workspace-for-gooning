import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  DevSettings,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth';
import { ThemeMode, useThemeContext } from '@/contexts/theme';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MenuItem } from '@/components/ui/menu-item';
import { promptReport } from '@/components/ui/error-report';
import { SectionHeader } from '@/components/ui/section-header';
import { ChipRow, Group, IconCircle, ListRow, ToggleRow, ValueRow } from '@/components/ui/kit';
import { M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { Sheet } from '@/components/ui/sheet';
import { FontSize, MATERIAL_SEEDS, Radius, Spacing } from '@/constants/theme';
import * as appLock from '@/services/app-lock';
import * as premiumService from '@/services/premium';
import { usePremium } from '@/services/premium';
import { DiceBearAvatar } from '@/components/ui/dicebear-avatar';
import { openReview } from '@/services/review-prompt';
import { startPlayUpdate } from '@/services/play-update';
import { AiPaywall } from '@/components/ui/ai-paywall';
import { useAiQuota } from '@/services/ai-subscription';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/services/analytics';
import i18n, { setLanguage } from '@/i18n';

const LANGUAGES = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'id', name: 'Bahasa Indonesia', flag: 'ID' },
  { code: 'es', name: 'Español', flag: 'ES' },
  { code: 'pt', name: 'Português (Brasil)', flag: 'PT' },
  { code: 'de', name: 'Deutsch', flag: 'DE' },
  { code: 'fr', name: 'Français', flag: 'FR' },
  { code: 'ru', name: 'Русский', flag: 'RU' },
  { code: 'ja', name: '日本語', flag: 'JA' },
  { code: 'ko', name: '한국어', flag: 'KO' },
  { code: 'zh', name: '中文（简体）', flag: 'ZH' },
  { code: 'tr', name: 'Türkçe', flag: 'TR' },
  { code: 'vi', name: 'Tiếng Việt', flag: 'VI' },
];

const THEME_OPTIONS: { mode: ThemeMode; labelKey: string }[] = [
  { mode: 'light', labelKey: 'settings.theme_light' },
  { mode: 'dark', labelKey: 'settings.theme_dark' },
  { mode: 'system', labelKey: 'settings.theme_system' },
];

export default function SettingsScreen() {
  const { t } = useTranslation();

  const [demoMode, setDemoModeState] = useState(false);
  useEffect(() => {
    if (__DEV__) require('@/services/demo').loadDemoMode().then(setDemoModeState);
  }, []);
  const toggleDemo = async (value: boolean) => {
    setDemoModeState(value);
    await require('@/services/demo').setDemoMode(value);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.reload();
    } else {
      DevSettings?.reload?.();
    }
  };

  const { colors, seed, setSeed } = useTheme();
  const { mode: themeMode, setMode: setThemeMode } = useThemeContext();
  const { user, authConfig, logout, accounts, accountId, switchAccount, profiles } = useAuth();

  const currentLang = i18n.language;
  const [langOpen, setLangOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState(false);
  const [lockSummary, setLockSummary] = useState<appLock.LockMethod | 'biometric' | null>(null);
  const premium = usePremium();
  const [premiumPrice, setPremiumPrice] = useState<string | null>(null);
  const [premiumBusy, setPremiumBusy] = useState(false);
  const { quota: aiQuota } = useAiQuota();
  const [showAiPaywall, setShowAiPaywall] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    isAnalyticsEnabled().then(setAnalyticsOn).catch(() => {});
  }, []);

  const toggleAnalytics = async (value: boolean) => {
    setAnalyticsOn(value);
    await setAnalyticsEnabled(value);
  };

  useFocusEffect(useCallback(() => {
    appLock.getLockSettings().then((s) => setLockSummary(s.method !== 'none' ? s.method : s.biometric ? 'biometric' : 'none')).catch(() => {});
  }, []));

  useEffect(() => {
    if (!premium) {
      premiumService.getPremiumPrice().then(setPremiumPrice).catch(() => {});
    }
  }, [premium]);

  const handleBuyPremium = async () => {
    setPremiumBusy(true);
    try {
      await premiumService.purchasePremium();
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg === 'billing-unavailable') {
        Alert.alert(t('premium.unavailable_title'), t('premium.unavailable_body'));
      } else if (!msg.toLowerCase().includes('cancel')) {
        Alert.alert(t('common.error'), msg || t('premium.purchase_error'));
      }
    } finally {
      setPremiumBusy(false);
    }
  };

  const handleRestorePremium = async () => {
    setPremiumBusy(true);
    try {
      const owned = await premiumService.restorePremium();
      Alert.alert(
        t('common.info'),
        owned ? t('premium.restored') : t('premium.nothing_to_restore')
      );
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? t('premium.purchase_error'));
    } finally {
      setPremiumBusy(false);
    }
  };

  const dots = '••••';
  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return dots + dots;
    return local.slice(0, 2) + dots + '@' + domain;
  };

  const maskId = (id: string) => {
    if (id.length <= 8) return dots + dots;
    return id.slice(0, 4) + dots + id.slice(-4);
  };

  const switchLanguage = (code: string) => {
    setLanguage(code);
    setLangOpen(false);
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      logout().then(() => router.replace('/login'));
      return;
    }
    Alert.alert(
      t('settings.logout'),
      t('settings.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/login');
          },
        },
      ]
    );
  };

  const aiPro = aiQuota?.tier === 'pro';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Expressive M3 Account Banner */}
        <M3Entrance index={0}>
          <View style={[styles.accountCard, { backgroundColor: colors.primaryContainer }]}>
            <DiceBearAvatar seed={user?.email || user?.username || 'cfmobile'} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                {user?.first_name ? `${user.first_name} ${user.last_name ?? ''}`.trim() : (user?.email?.split('@')[0] ?? 'Admin')}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                {showSensitive ? user?.email : maskEmail(user?.email ?? '')}
              </Text>
            </View>
            <View style={[styles.methodChip, { backgroundColor: colors.surfaceContainerLowest + 'CC' }]}>
              <Text style={[styles.methodText, { color: colors.onSurface }]}>
                {authConfig?.method === 'oauth' ? 'OAUTH' : authConfig?.method === 'token' ? 'TOKEN' : 'KEY'}
              </Text>
            </View>
          </View>
        </M3Entrance>

        {/* Premium */}
        <M3Entrance index={1}>
          {premium ? (
            <Group style={styles.planCard}>
              <ListRow icon="check-circle" iconTone="success" title={t('premium.active_title')} />
            </Group>
          ) : (
            <Card style={[styles.planCard, styles.plan]}>
              <View style={styles.planTop}>
                <IconCircle name="zap" tone="primary" />
                <Text style={[styles.planTitle, { color: colors.onSurface }]}>{t('premium.upsell_compact')}</Text>
              </View>
              <View style={styles.planActions}>
                <TouchableOpacity
                  onPress={handleRestorePremium}
                  disabled={premiumBusy}
                  hitSlop={8}
                  style={styles.planLinkWrap}
                  accessibilityRole="button"
                >
                  <Text style={[styles.planLink, { color: colors.onSurfaceVariant }]}>{t('premium.restore')}</Text>
                </TouchableOpacity>
                <Button
                  title={premiumPrice ?? t('premium.buy')}
                  onPress={handleBuyPremium}
                  disabled={premiumBusy}
                  size="sm"
                />
              </View>
            </Card>
          )}

          {aiPro ? (
            <Group style={styles.planCard}>
              <ListRow
                icon="check-circle"
                iconTone="success"
                title={t('ai_plan.active_title')}
                subtitle={aiQuota ? t('ai_plan.usage', { used: aiQuota.used, limit: aiQuota.limit }) : undefined}
              />
            </Group>
          ) : (
            <Card style={[styles.planCard, styles.plan]} onPress={() => setShowAiPaywall(true)}>
              <View style={styles.planTop}>
                <IconCircle name="sparkles" tone="primary" />
                <Text style={[styles.planTitle, { color: colors.onSurface }]}>{t('ai_plan.upsell_compact')}</Text>
              </View>
              <View style={styles.planActions}>
                <Text style={[styles.planUsage, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                  {aiQuota ? t('ai_plan.usage', { used: aiQuota.used, limit: aiQuota.limit }) : ''}
                </Text>
                <Button title={t('ai_plan.upgrade')} onPress={() => setShowAiPaywall(true)} size="sm" variant="tonal" />
              </View>
            </Card>
          )}
        </M3Entrance>

        {/* Material You Personalization & Theme */}
        <M3Entrance index={2}>
          <SectionHeader title={t('settings.appearance')} />
          <View style={[styles.themeCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <ChipRow
              wrap
              options={THEME_OPTIONS.map((opt) => ({ value: opt.mode, label: t(opt.labelKey) }))}
              value={themeMode}
              onChange={setThemeMode}
            />

            <View style={[styles.paletteDivider, { backgroundColor: colors.outlineVariant + '44' }]} />

            <Text style={[styles.paletteHeading, { color: colors.onSurfaceVariant }]}>
              {t('settings.color_palette', { defaultValue: 'Material You Color Palette' })}
            </Text>

            <View style={styles.swatchRow}>
              {MATERIAL_SEEDS.map((item) => {
                const active = seed === item.id;
                return (
                  <M3Pressable
                    key={item.id}
                    onPress={() => setSeed(item.id)}
                    radius={Radius.md}
                    scaleTo={0.94}
                    style={[
                      styles.swatchCard,
                      {
                        backgroundColor: active ? colors.secondaryContainer : colors.surfaceContainer,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={item.label}
                  >
                    <View
                      style={[
                        styles.swatchOuter,
                        {
                          borderColor: active ? item.swatch : 'transparent',
                        },
                      ]}
                    >
                      <View style={[styles.swatchDot, { backgroundColor: item.swatch }]}>
                        {active && <Icon name="check" size={14} color="#FFFFFF" />}
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.swatchLabel,
                        {
                          color: active ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </M3Pressable>
                );
              })}
            </View>
          </View>
        </M3Entrance>

        {/* Stored Cloudflare logins */}
        <SectionHeader title={t('settings.accounts_section')} />
        <Group>
          <ListRow
            icon="users"
            title={t('settings.manage_accounts')}
            subtitle={t('settings.manage_accounts_sub', { count: profiles.length })}
            onPress={() => router.push('/accounts' as any)}
          />
        </Group>

        {accounts.length > 1 && (
          <>
            <SectionHeader title={t('settings.switch_account')} />
            <Group>
              {accounts.map((acc) => (
                <ListRow
                  key={acc.id}
                  icon="user"
                  title={acc.name.includes('@') ? maskEmail(acc.name) : acc.name}
                  subtitle={acc.id.slice(0, 4) + '••••'}
                  mono
                  onPress={() => switchAccount(acc.id)}
                  trailing={
                    acc.id === accountId ? (
                      <Icon name="check-circle" size={20} color={colors.success} />
                    ) : undefined
                  }
                />
              ))}
            </Group>
          </>
        )}

        {/* Language */}
        <SectionHeader title={t('settings.language')} />
        <Group>
          <ListRow
            icon="languages"
            title={LANGUAGES.find((l) => l.code === currentLang)?.name ?? 'English'}
            onPress={() => setLangOpen(!langOpen)}
          />
        </Group>

        {/* Products */}
        <SectionHeader title={t('products.title')} />
        <Group>
          <ListRow
            icon="grid"
            title={t('products.all')}
            subtitle={t('products.all_sub')}
            onPress={() => router.push('/products' as any)}
          />
        </Group>

        {/* Security */}
        <SectionHeader title={t('settings.security')} />
        <Group>
          <ListRow
            icon="widgets"
            title={t('shortcuts.title')}
            subtitle={t('shortcuts.settings_sub')}
            onPress={() => router.push('/shortcuts' as any)}
          />
          <ListRow
            icon="enhanced-encryption"
            title={t('security.title')}
            subtitle={lockSummary ? t(`security.summary_${lockSummary}`) : undefined}
            onPress={() => router.push('/security' as any)}
          />
          <ListRow
            icon="clock"
            title={t('history.title')}
            subtitle={t('history.settings_sub')}
            onPress={() => router.push('/history' as any)}
          />
          <ToggleRow
            icon="pageview"
            title={t('settings.share_usage')}
            subtitle={t('settings.share_usage_sub')}
            value={analyticsOn}
            onValueChange={toggleAnalytics}
          />
        </Group>

        {/* Monitoring */}
        <SectionHeader title={t('settings.monitoring_section')} />
        <Group>
          <ListRow
            icon="activity"
            title={t('settings.monitoring')}
            subtitle={t('settings.monitoring_sub')}
            onPress={() => router.push('/monitoring' as any)}
          />
        </Group>

        {/* Account Info */}
        <SectionHeader
          title={t('settings.account_info')}
          action={
            <TouchableOpacity onPress={() => setShowSensitive(!showSensitive)} hitSlop={10} accessibilityRole="button">
              <Icon name={showSensitive ? 'pageview' : 'lock-outline'} size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          }
        />
        <Group>
          <ValueRow
            label={t('settings.email')}
            value={showSensitive ? (user?.email ?? '-') : maskEmail(user?.email ?? '-')}
          />
          <ValueRow
            label={t('settings.username')}
            value={showSensitive ? (user?.username ?? '-') : maskId(user?.username ?? '-')}
          />
          <ValueRow
            label={t('settings.auth_method')}
            value={authConfig?.method === 'oauth' ? 'Cloudflare OAuth' : authConfig?.method === 'token' ? 'API Token (Bearer)' : 'Global API Key'}
          />
        </Group>

        {/* API Info */}
        <SectionHeader title={t('settings.api_info')} />
        <Group>
          <ValueRow label={t('settings.rate_limit')} value="1,200 req / 5 min" />
          <ValueRow label={t('settings.api_version')} value="v4" />
        </Group>

        {/* About */}
        <SectionHeader title={t('settings.about_section')} />
        <Group>
          <ListRow
            icon="info"
            title={t('settings.about_app')}
            subtitle={t('settings.about_app_sub')}
            onPress={() => router.push('/about')}
          />
          <ListRow
            icon="clock"
            title={t('settings.changelog')}
            subtitle={t('settings.changelog_sub')}
            onPress={() => router.push('/changelog')}
          />
          <ListRow
            icon="download"
            title={t('settings.check_updates')}
            subtitle={t('settings.check_updates_sub')}
            onPress={() => startPlayUpdate()}
          />
          <ListRow
            icon="mail"
            title={t('report.menu_title')}
            subtitle={t('report.menu_sub')}
            onPress={() => promptReport(t)}
          />
          <ListRow
            icon="star"
            title={t('settings.rate_us')}
            subtitle={t('settings.rate_us_sub')}
            onPress={() => openReview()}
          />
        </Group>

        {__DEV__ && (
          <>
            <SectionHeader title="Developer" />
            <Group>
              <ToggleRow
                icon="developer-mode"
                title="Demo data"
                subtitle="Show sample zones instead of the real account"
                value={demoMode}
                onValueChange={toggleDemo}
              />
            </Group>
          </>
        )}

        <Group style={{ marginTop: Spacing.xl }}>
          <MenuItem
            icon="logout"
            title={t('settings.logout')}
            onPress={handleLogout}
            danger
            trailing={null}
          />
        </Group>

        <Text style={[styles.version, { color: colors.textTertiary }]}>
          CloudFlare Mobile v{require('@/services/version-check').CURRENT_VERSION}
        </Text>
      </View>

      <Sheet visible={langOpen} onClose={() => setLangOpen(false)} title={t('settings.language')}>
        <Group>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLang === lang.code;
            return (
              <ListRow
                key={lang.code}
                title={lang.name}
                leading={
                  <View style={[styles.langCode, { backgroundColor: colors.secondaryContainer }]}>
                    <Text style={[styles.langCodeText, { color: colors.onSecondaryContainer }]}>{lang.flag}</Text>
                  </View>
                }
                onPress={() => switchLanguage(lang.code)}
                chevron={false}
                trailing={isSelected ? <Icon name="check-circle" size={20} color={colors.primary} /> : undefined}
              />
            );
          })}
        </Group>
      </Sheet>

      <AiPaywall visible={showAiPaywall} onClose={() => setShowAiPaywall(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  inner: { width: '100%', maxWidth: 820, alignSelf: 'center' },

  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  accountName: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.3 },
  accountEmail: { fontSize: FontSize.sm, marginTop: 2, opacity: 0.85 },
  methodChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  methodText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  planCard: { marginTop: Spacing.sm },
  plan: { gap: Spacing.md },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  planTitle: { flex: 1, fontSize: FontSize.md, fontWeight: '600', lineHeight: 20 },
  planActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  planLinkWrap: { minHeight: 36, justifyContent: 'center' },
  planLink: { fontSize: FontSize.sm, textDecorationLine: 'underline' },
  planUsage: { flex: 1, fontSize: FontSize.xs, lineHeight: 15 },

  themeCard: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  paletteDivider: {
    height: StyleSheet.hairlineWidth,
  },
  paletteHeading: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    paddingHorizontal: 2,
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  swatchCard: {
    flex: 1,
    minWidth: 64,
    minHeight: 74,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 6,
    gap: 6,
  },
  swatchOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchDot: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 11,
  },

  langCode: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCodeText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.3 },

  version: { textAlign: 'center', fontSize: FontSize.xs, marginTop: Spacing.xxl },
});
