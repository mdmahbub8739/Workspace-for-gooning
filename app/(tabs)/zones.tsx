import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/hooks/use-theme';
import { Icon } from '@/components/ui/icon';
import { SearchBar } from '@/components/ui/kit';
import { M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { SkeletonRows } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import * as api from '@/services/cloudflare';
import { Zone } from '@/services/types';

const maskName = (name: string) => {
  if (!name.includes('@')) return name;
  const [local, domain] = name.split('@');
  return local.slice(0, 2) + '\u2022\u2022\u2022\u2022@' + domain;
};

export default function ZonesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchZones = useCallback(async (p = 1, s?: string) => {
    try {
      const res = await api.getZones(p, s || undefined);
      const list = res.result ?? [];
      if (p === 1) {
        setZones(list);
      } else {
        setZones((prev) => [...prev, ...list]);
      }
      setHasMore((res.result_info?.total_pages ?? 1) > p);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchZones(1, search); }, [fetchZones, search]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchZones(1, search);
  };

  const loadMore = () => {
    if (!hasMore) return;
    const next = page + 1;
    setPage(next);
    fetchZones(next, search);
  };

  const renderZone = ({ item, index }: { item: Zone; index: number }) => {
    const isActive = item.status === 'active';
    const isPending = item.status === 'pending';
    const statusColor = isActive ? colors.success : isPending ? colors.warning : colors.error;
    const iconBg = isActive ? colors.secondaryContainer : isPending ? colors.warningContainer : colors.errorContainer;
    const iconInk = isActive ? colors.onSecondaryContainer : isPending ? colors.onWarningContainer : colors.onErrorContainer;

    const metaParts = [
      `${item.name_servers?.length ?? 0} NS`,
      item.plan.name,
      item.account.name ? maskName(item.account.name) : null,
    ].filter(Boolean);

    return (
      <M3Entrance index={Math.min(index, 8)}>
        <M3Pressable
          radius={Radius.lg}
          onPress={() => router.push(`/zone/${item.id}`)}
          style={[styles.zoneCard, { backgroundColor: colors.surfaceContainerLow }]}
          accessibilityRole="button"
          accessibilityLabel={item.name}
        >
          <View style={[styles.zoneIconWrap, { backgroundColor: iconBg }]}>
            <Icon name="globe" size={20} color={iconInk} />
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <View style={styles.zoneNameRow}>
              <Text style={[styles.zoneName, { color: colors.onSurface }]} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status}
              </Text>
            </View>

            <Text style={[styles.zoneInfo, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
              {metaParts.join(' · ')}
            </Text>

            {(item.development_mode > 0 || item.paused) && (
              <Text style={[styles.zoneFlags, { color: item.paused ? colors.error : colors.warning }]} numberOfLines={1}>
                {[
                  item.development_mode > 0 ? t('zones.dev_mode') : null,
                  item.paused ? t('zones.paused') : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
          </View>

          <Icon name="chevron-right" size={18} color={colors.onSurfaceVariant} />
        </M3Pressable>
      </M3Entrance>
    );
  };

  if (loading && zones.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.inner, { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }]}>
          <SkeletonRows count={7} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={styles.searchWrap}>
          <SearchBar
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setPage(1);
            }}
            placeholder={t('zones.search_placeholder')}
          />
        </View>

        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          renderItem={renderZone}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="cloud-off"
              title={t('zones.no_zones')}
              message={t('zones.no_zones_message')}
            />
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
  },
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  zoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderRadius: Radius.lg,
    marginBottom: Spacing.sm,
    minHeight: 72,
  },
  zoneIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoneNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  zoneName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    flex: 1,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  zoneInfo: {
    fontSize: FontSize.xs,
  },
  zoneFlags: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginTop: 1,
  },
});
