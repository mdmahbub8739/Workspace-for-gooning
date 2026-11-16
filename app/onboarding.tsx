import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewToken,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle } from '@/components/ui/glass';
import { Button } from '@/components/ui/button';
import { BrandGradient, BrandMark } from '@/components/ui/brand';
import { M3_EMPHASIZED, M3_EXPRESSIVE_SPRING, M3Pressable } from '@/components/ui/m3-motion';
import { FontSize, Radius, Spacing } from '@/constants/theme';

const ONBOARDING_KEY = 'cf_onboarding_done';

async function markOnboardingDone() {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } else {
    const SecureStore = require('expo-secure-store');
    await SecureStore.setItemAsync(ONBOARDING_KEY, '1');
  }
}

const SLIDES = [
  {
    key: '1',
    image: require('@/assets/images/onboarding-1.png'),
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
  },
  {
    key: '2',
    image: require('@/assets/images/onboarding-2.png'),
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
  },
  {
    key: '3',
    image: require('@/assets/images/onboarding-3.png'),
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
  },
  {
    key: '4',
    image: require('@/assets/images/onboarding-4.png'),
    titleKey: 'onboarding.slide4_title',
    descKey: 'onboarding.slide4_desc',
  },
];

function AnimatedDot({ active, activeColor, idleColor }: { active: boolean; activeColor: string; idleColor: string }) {
  const width = useSharedValue(active ? 28 : 8);
  const scale = useSharedValue(active ? 1 : 0.9);

  useEffect(() => {
    width.value = withSpring(active ? 28 : 8, M3_EXPRESSIVE_SPRING);
    scale.value = withSpring(active ? 1 : 0.9, M3_EXPRESSIVE_SPRING);
  }, [active, width, scale]);

  const animStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scaleY: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: active ? activeColor : idleColor },
        animStyle,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const copyOpacity = useSharedValue(1);
  const copyTranslate = useSharedValue(0);

  useEffect(() => {
    copyOpacity.value = 0.4;
    copyTranslate.value = 8;
    copyOpacity.value = withTiming(1, { duration: 240, easing: M3_EMPHASIZED });
    copyTranslate.value = withSpring(0, M3_EXPRESSIVE_SPRING);
  }, [currentIndex, copyOpacity, copyTranslate]);

  const copyAnimStyle = useAnimatedStyle(() => ({
    opacity: copyOpacity.value,
    transform: [{ translateY: copyTranslate.value }],
  }));

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const isLast = currentIndex === SLIDES.length - 1;
  const slide = SLIDES[currentIndex];

  const goNext = async () => {
    if (isLast) {
      await markOnboardingDone();
      router.replace('/login');
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const skip = async () => {
    await markOnboardingDone();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.primaryContainer }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <BrandGradient />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.brand}>
          <View style={[styles.brandBadge, { backgroundColor: colors.primary }]}>
            <BrandMark bare size={24} />
          </View>
          <Text style={[styles.brandName, { color: colors.onPrimaryContainer }]}>CloudFlare Mobile</Text>
        </View>
        {!isLast && (
          <M3Pressable
            onPress={skip}
            radius={Radius.full}
            stateLayerColor={colors.onPrimaryContainer}
            style={[styles.skipBtn, getGlassStyle(colors, isDark, 'surface', Radius.full)]}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={[styles.skipText, { color: colors.onSurface }]}>{t('onboarding.skip')}</Text>
          </M3Pressable>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Image source={item.image} style={styles.image} contentFit="contain" transition={220} />
          </View>
        )}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfig}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        style={styles.flatList}
      />

      <View
        style={[
          styles.sheetWrap,
          getGlassStyle(colors, isDark, 'elevated'),
          {
            borderBottomWidth: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.sheetInner}>
          <Animated.View style={[styles.copy, copyAnimStyle]}>
            <Text style={[styles.title, { color: colors.onSurface }]}>{t(slide.titleKey)}</Text>
            <Text style={[styles.description, { color: colors.onSurfaceVariant }]}>{t(slide.descKey)}</Text>
          </Animated.View>

          <View style={styles.footerRow}>
            <View style={styles.dots}>
              {SLIDES.map((s, i) => (
                <AnimatedDot
                  key={s.key}
                  active={i === currentIndex}
                  activeColor={colors.primary}
                  idleColor={colors.outlineVariant}
                />
              ))}
            </View>

            <View style={styles.ctaWrap}>
              <Button
                title={isLast ? t('onboarding.get_started') : t('onboarding.next')}
                onPress={goNext}
                size="lg"
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    minHeight: 48,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  brandBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: { fontSize: FontSize.md, fontWeight: '700', letterSpacing: -0.2 },
  skipBtn: {
    height: 36,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipText: { fontSize: FontSize.sm, fontWeight: '600' },
  flatList: { flex: 1 },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.lg },
  image: { width: '100%', maxWidth: 440, height: '100%' },
  sheetWrap: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
  },
  sheetInner: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  copy: { minHeight: 118, gap: Spacing.sm },
  title: { fontSize: 28, fontWeight: '700', letterSpacing: -0.7, lineHeight: 34 },
  description: { fontSize: FontSize.md, lineHeight: 23 },
  footerRow: { gap: Spacing.lg },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  ctaWrap: { width: '100%' },
});
