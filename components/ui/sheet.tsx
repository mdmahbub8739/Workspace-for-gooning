import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { getBackdropBlurStyle, getGlassStyle } from '@/components/ui/glass';
import { M3_EMPHASIZED, M3_GLASS_SPRING, M3Pressable, isReducedMotionEnabled } from '@/components/ui/m3-motion';
import { FontSize, Spacing } from '@/constants/theme';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  scroll?: boolean;
  children?: React.ReactNode;
}

/**
 * Frosted Glass Bottom Sheet:
 * Blurred translucent scrim fade, damped spring sheet rise, specular top rim,
 * and frosted elevated container.
 */
export function Sheet({ visible, onClose, title, footer, scroll = true, children }: SheetProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [rendered, setRendered] = useState(visible);

  const backdropOpacity = useSharedValue(0);
  const translateY = useSharedValue(320);

  useEffect(() => {
    const reduced = isReducedMotionEnabled();
    if (visible) {
      setRendered(true);
      backdropOpacity.value = reduced ? 1 : withTiming(1, { duration: 200, easing: M3_EMPHASIZED });
      translateY.value = reduced ? 0 : withSpring(0, M3_GLASS_SPRING);
    } else if (rendered) {
      backdropOpacity.value = reduced ? 0 : withTiming(0, { duration: 150, easing: M3_EMPHASIZED });
      translateY.value = reduced ? 340 : withTiming(340, { duration: 175, easing: M3_EMPHASIZED });
      const timer = setTimeout(() => setRendered(false), reduced ? 0 : 180);
      return () => clearTimeout(timer);
    }
  }, [visible, rendered, backdropOpacity, translateY]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!rendered) return null;

  return (
    <Modal visible={rendered} transparent animationType="none" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close">
          <Animated.View
            style={[
              styles.backdrop,
              { backgroundColor: colors.glassOverlay },
              getBackdropBlurStyle(10),
              backdropStyle,
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            getGlassStyle(colors, isDark, 'elevated'),
            {
              paddingBottom: insets.bottom + Spacing.lg,
            },
            sheetStyle,
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: colors.onSurfaceVariant + '55' }]} />
          {!!title && (
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.onSurface }]} numberOfLines={1}>{title}</Text>
              <M3Pressable
                onPress={onClose}
                hitSlop={8}
                radius={18}
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel="Close"
                style={[styles.closeBtn, getGlassStyle(colors, isDark, 'subtle', 18)]}
              >
                <Icon name="close" size={18} color={colors.onSurfaceVariant} />
              </M3Pressable>
            </View>
          )}
          {scroll ? (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
          {!!footer && <View style={styles.footer}>{footer}</View>}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    width: '100%',
    maxWidth: 640,
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    paddingTop: Spacing.md,
    overflow: 'hidden',
  },
  grabber: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: '600', letterSpacing: -0.2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scroll: { flexGrow: 0 },
  body: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  footer: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
});
