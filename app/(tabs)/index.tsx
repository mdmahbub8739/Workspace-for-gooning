import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/auth';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Group, IconCircle, ListRow } from '@/components/ui/kit';
import { M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { Sheet } from '@/components/ui/sheet';
import { SkeletonHeading, SkeletonHero, SkeletonRows, SkeletonStats, SkeletonTiles } from '@/components/ui/skeleton';
import { UpdateBanner } from '@/components/ui/update-banner';
import { AdBanner } from '@/components/ui/ad-banner';
import { DiceBearAvatar } from '@/components/ui/dicebear-avatar';
import { DiscoverCards } from '@/components/ui/discover-cards';
import { usePremium } from '@/services/premium';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import * as api from '@/services/cloudflare';
import { Zone } from '@/services/types';

const maskAccount = (name: string) => {
  if (!name.includes('@')) return name;
  const [local, domain] = name.split('@');
  return local.slice(0, 2) + '••••@' + domain;
};

interface QuickAction {
  icon: IconName;
  label: string;
  onPress: () => void;
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { user, permissions } = useAuth();
  const premium = usePremium();
  const [showAdsConsent, setShowAdsConsent] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zonePicker, setZonePicker] = useState<{ visible: boolean; target: string | null }>({ visible: false, target: null });

  const fetchData = useCallback(async () => {
    try {
      const res = await api.getZones(1);
      setZones(res.result ?? []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (premium || Platform.OS === 'web') return;
    (async () => {
      try {
        const SecureStore = require('expo-secure-store');
        const seen = await SecureStore.getItemAsync('cf_ads_notice_seen');
        if (!seen) setShowAdsConsent(true);
      } catch {
        // ignore
      }
    })();
  }, [premium]);

  const dismissAdsConsent = async () => {
    setShowAdsConsent(false);
    try {
      const SecureStore = require('expo-secure-store');
      await SecureStore.setItemAsync('cf_ads_notice_seen', 'true');
    } catch {
      // ignore
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const activeZones = zones.filter((z) => z.status === 'active').length;
  const pendingZones = zones.filter((z) => z.status === 'pending').length;

  const openWithZonePicker = (target: string) => {
    if (zones.length === 0) {
      if (Platform.OS !== 'web') Alert.alert(t('common.info'), t('dashboard.no_zones'));
    } else if (zones.length === 1) {
      router.push(`/zone/${zones[0].id}/${target}`);
    } else {
      setZonePicker({ visible: true, target });
    }
  };

  const selectZone = (zoneId: string) => {
    const target = zonePicker.target;
    setZonePicker({ visible: false, target: null });
    if (target) router.push(`/zone/${zoneId}/${target}`);
  };

  const allActions: (QuickAction & { gate: boolean })[] = [
    { icon: 'dns', label: t('dashboard.manage_dns'), onPress: () => router.push('/(tabs)/zones'), gate: permissions?.zones ?? true },
    { icon: 'cached', label: t('dashboard.purge_cache'), onPress: () => openWithZonePicker('cache'), gate: permissions?.cache ?? true },
    { icon: 'code', label: t('dashboard.workers'), onPress: () => router.push('/(tabs)/services'), gate: (permissions?.workers || permissions?.kv || permissions?.r2 || permissions?.pages) ?? true },
    { icon: 'chart-line', label: t('dashboard.analytics'), onPress: () => openWithZonePicker('analytics'), gate: permissions?.analytics ?? true },
    { icon: 'shield', label: t('dashboard.firewall'), onPress: () => openWithZonePicker('firewall'), gate: permissions?.firewall ?? true },
    { icon: 'lock', label: 'SSL/TLS', onPress: () => openWithZonePicker('ssl'), gate: permissions?.ssl ?? true },
    { icon: 'layers', label: t('bulk.title'), onPress: () => router.push('/bulk' as any), gate: zones.length > 1 },
  ];
  const actions: QuickAction[] = allActions.filter((a) => a.gate);

  if (loading) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        scrollEnabled={false}
        accessibilityLabel={t('common.loading')}
      >
        <View style={styles.inner}>
          <SkeletonHero />
          <View style={{ height: Spacing.md }} />
          <SkeletonStats count={3} />
          <SkeletonHeading />
          <SkeletonTiles count={6} />
          <SkeletonHeading width={130} />
          <SkeletonRows count={5} />
        </View>
      </ScrollView>
    );
  }

  const stats = [
    { label: t('dashboard.total_zones'), value: zones.length, tone: colors.onSurface },
    { label: t('dashboard.active'), value: activeZones, tone: colors.success },
    { label: t('dashboard.pending'), value: pendingZones, tone: colors.warning },
  ];

  const recent = zones.slice(0, 5);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <UpdateBanner />

        {/* Material You Profile Hero */}
        <M3Entrance index={0}>
          <View
            style={[
              styles.profileCard,
              getGlassStyle(colors, isDark, 'elevated', Radius.xl),
            ]}
          >
            <DiceBearAvatar seed={user?.email || user?.username || 'cfmobile'} size={48} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: isDark ? colors.primaryLight : colors.primary }]}>{t('dashboard.welcome')}</Text>
              <Text style={[styles.name, { color: colors.onSurface }]} numberOfLines={1}>
                {user?.first_name || user?.email?.split('@')[0] || 'Admin'}
              </Text>
            </View>
          </View>
        </M3Entrance>

        {/* Frosted Zone Stats */}
        <M3Entrance index={1}>
          <View style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.label} style={[styles.statCard, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}>
                <Text style={[styles.statLabel, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                  {s.label}
                </Text>
                <Text style={[styles.statValue, { color: s.tone }]}>
                  {s.value}
                </Text>
              </View>
            ))}
          </View>
        </M3Entrance>

        <AdBanner />

        <M3Entrance index={2}>
          <DiscoverCards firstZoneId={zones[0]?.id} />
        </M3Entrance>

        {/* Frosted Squircle Quick Actions */}
        <M3Entrance index={3}>
          <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>{t('dashboard.quick_actions')}</Text>
          <View style={styles.actionsGrid}>
            {actions.map((action) => (
              <M3Pressable
                key={action.label}
                radius={Radius.lg}
                scaleTo={0.96}
                onPress={action.onPress}
                style={[styles.actionTile, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <View
                  style={[
                    styles.actionIcon,
                    {
                      backgroundColor: colors.secondaryContainer + '8F',
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: colors.glassBorderSubtle,
                      borderTopColor: colors.glassHighlight,
                    },
                  ]}
                >
                  <Icon name={action.icon} size={20} color={colors.onSecondaryContainer} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.onSurface }]} numberOfLines={1}>
                  {action.label}
                </Text>
              </M3Pressable>
            ))}
          </View>
        </M3Entrance>

        {/* Recent Zones */}
        <M3Entrance index={4}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface, marginBottom: 0, marginTop: 0, marginHorizontal: 0 }]}>
              {t('dashboard.recent_zones')}
            </Text>
            {zones.length > 5 && (
              <M3Pressable
                radius={Radius.full}
                onPress={() => router.push('/(tabs)/zones')}
                style={[
                  styles.seeAllBtn,
                  getTintedGlassStyle(colors, isDark, colors.secondaryContainer + '8F', 16),
                ]}
                hitSlop={8}
              >
                <Text style={[styles.seeAll, { color: colors.onSecondaryContainer }]}>{t('dashboard.see_all')}</Text>
              </M3Pressable>
            )}
          </View>

          {recent.length > 0 ? (
            <Group>
              {recent.map((zone) => {
                const statusColor =
                  zone.status === 'active'
                    ? colors.success
                    : zone.status === 'pending'
                      ? colors.warning
                      : colors.error;
                return (
                  <ListRow
                    key={zone.id}
                    icon="globe"
                    iconTone={zone.status === 'active' ? 'primary' : zone.status === 'pending' ? 'warning' : 'error'}
                    title={zone.name}
                    subtitle={`${zone.plan.name}${zone.account.name ? ` · ${maskAccount(zone.account.name)}` : ''}`}
                    trailing={
                      <Text style={[styles.statusLabel, { color: statusColor }]}>
                        {zone.status}
                      </Text>
                    }
                    chevron
                    onPress={() => router.push(`/zone/${zone.id}`)}
                  />
                );
              })}
            </Group>
          ) : (
            <View style={[styles.emptyCard, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}>
              <IconCircle name="cloud-off" size={48} tone="neutral" />
              <Text style={{ color: colors.onSurfaceVariant, fontSize: FontSize.sm }}>{t('dashboard.no_zones')}</Text>
            </View>
          )}
        </M3Entrance>
      </View>

      {/* Ads consent notice */}
      <Sheet
        visible={showAdsConsent}
        onClose={dismissAdsConsent}
        title={t('ads_notice.title')}
        footer={
          <View style={{ gap: Spacing.sm }}>
            <Button title={t('ads_notice.ok')} onPress={dismissAdsConsent} size="lg" />
            <Button
              title={t('ads_notice.premium')}
              variant="ghost"
              onPress={() => {
                dismissAdsConsent();
                router.push('/(tabs)/settings');
              }}
            />
          </View>
        }
      >
        <View style={styles.consentBodyWrap}>
          <IconCircle name="info" size={48} tone="primary" />
          <Text style={[styles.consentBody, { color: colors.onSurfaceVariant }]}>{t('ads_notice.body')}</Text>
        </View>
      </Sheet>

      {/* Zone Picker Sheet */}
      <Sheet
        visible={zonePicker.visible}
        onClose={() => setZonePicker({ visible: false, target: null })}
        title={t('dashboard.select_zone')}
      >
        <Group>
          {zones.map((item) => (
            <ListRow
              key={item.id}
              icon="globe"
              iconTone={item.status === 'active' ? 'primary' : item.status === 'pending' ? 'warning' : 'neutral'}
              title={item.name}
              subtitle={item.plan.name}
              trailing={
                <Badge
                  label={item.status}
                  variant={item.status === 'active' ? 'success' : item.status === 'pending' ? 'warning' : 'default'}
                />
              }
              onPress={() => selectZone(item.id)}
            />
          ))}
        </Group>
      </Sheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: Spacing.sm, paddingBottom: 108, paddingHorizontal: Spacing.lg },
  inner: { width: '100%', maxWidth: 960, alignSelf: 'center' },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
  },
  greeting: { fontSize: FontSize.xs, fontWeight: '600', opacity: 0.8 },
  name: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, marginTop: 1 },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: 4,
  },
  statLabel: { fontSize: FontSize.xs, fontWeight: '500' },
  statValue: { fontSize: 26, fontWeight: '700', letterSpacing: -0.6, fontVariant: ['tabular-nums'] },

  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.1,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  seeAllBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  seeAll: { fontSize: FontSize.xs, fontWeight: '700' },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionTile: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.lg,
    minHeight: 94,
    justifyContent: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: FontSize.xs, fontWeight: '600' },

  statusLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyCard: {
    borderRadius: Radius.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xxl,
  },
  consentBodyWrap: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  consentBody: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
});
