import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { usePremium } from '@/services/premium';
import { openReview } from '@/services/review-prompt';
import * as monitoring from '@/services/monitoring';
import { M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { Spacing, FontSize, Radius } from '@/constants/theme';

interface DiscoverCard {
  key: string;
  icon: IconName;
  tone: 'primary' | 'secondary' | 'tertiary' | 'info' | 'success';
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}

export function DiscoverCards({ firstZoneId }: { firstZoneId?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const premium = usePremium();
  const [monitorOn, setMonitorOn] = useState(false);

  useEffect(() => {
    monitoring.getConfig().then((c) => setMonitorOn(c.enabled && c.zoneIds.length > 0)).catch(() => {});
  }, []);

  const cards: DiscoverCard[] = [];

  cards.push({
    key: 'ai',
    icon: 'shield-check',
    tone: 'primary',
    title: t('discover.ai_title'),
    body: t('discover.ai_body'),
    cta: t('discover.ai_cta'),
    onPress: () =>
      firstZoneId
        ? router.push({ pathname: '/zone/[id]/ai-audit' as any, params: { id: firstZoneId } })
        : router.push('/(tabs)/zones'),
  });

  if (!monitorOn) {
    cards.push({
      key: 'monitor',
      icon: 'activity',
      tone: 'success',
      title: t('discover.monitor_title'),
      body: t('discover.monitor_body'),
      cta: t('discover.monitor_cta'),
      onPress: () => router.push('/monitoring' as any),
    });
  }

  if (!premium) {
    cards.push({
      key: 'premium',
      icon: 'zap',
      tone: 'tertiary',
      title: t('discover.premium_title'),
      body: t('discover.premium_body'),
      cta: t('discover.premium_cta'),
      onPress: () => router.push('/(tabs)/settings'),
    });
  }

  cards.push({
    key: 'review',
    icon: 'check-circle',
    tone: 'secondary',
    title: t('discover.review_title'),
    body: t('discover.review_body'),
    cta: t('discover.review_cta'),
    onPress: () => openReview(),
  });

  cards.push({
    key: 'oss',
    icon: 'code',
    tone: 'info',
    title: t('discover.oss_title'),
    body: t('discover.oss_body'),
    cta: t('discover.oss_cta'),
    onPress: () => router.push('/about'),
  });

  const tonePalette = (tone: DiscoverCard['tone']) => {
    switch (tone) {
      case 'primary':
        return { bg: colors.primaryContainer, fg: colors.onPrimaryContainer };
      case 'tertiary':
        return { bg: colors.tertiaryContainer, fg: colors.onTertiaryContainer };
      case 'success':
        return { bg: colors.successContainer, fg: colors.onSuccessContainer };
      case 'info':
        return { bg: colors.infoContainer, fg: colors.onInfoContainer };
      default:
        return { bg: colors.secondaryContainer, fg: colors.onSecondaryContainer };
    }
  };

  return (
    <>
      <Text style={[styles.sectionTitle, { color: colors.primary }]}>{t('discover.title')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        style={styles.scroll}
      >
        {cards.map((card, index) => {
          const badge = tonePalette(card.tone);
          return (
            <M3Entrance key={card.key} index={index}>
              <M3Pressable
                onPress={card.onPress}
                scaleTo={0.97}
                radius={Radius.lg}
                style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: badge.bg }]}>
                  <Icon name={card.icon} size={20} color={badge.fg} />
                </View>
                <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>{card.title}</Text>
                <Text style={[styles.body, { color: colors.onSurfaceVariant }]} numberOfLines={3}>{card.body}</Text>
                <View style={styles.ctaRow}>
                  <Text style={[styles.cta, { color: colors.primary }]}>{card.cta}</Text>
                  <Icon name="chevron-right" size={15} color={colors.primary} />
                </View>
              </M3Pressable>
            </M3Entrance>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    letterSpacing: 0.35,
    paddingHorizontal: Spacing.lg + Spacing.xs,
    marginBottom: Spacing.sm,
  },
  scroll: { marginBottom: Spacing.xl },
  strip: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  card: {
    width: 244,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    gap: 8,
    overflow: 'hidden',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: FontSize.md, fontWeight: '600' },
  body: { fontSize: FontSize.xs, lineHeight: 17, minHeight: 51 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  cta: { fontSize: FontSize.sm, fontWeight: '600' },
});
