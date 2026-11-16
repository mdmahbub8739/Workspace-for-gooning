import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useLocalSearchParams } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon, IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { getGlassStyle, getTintedGlassStyle } from '@/components/ui/glass';
import { AiPaywall } from '@/components/ui/ai-paywall';
import { Button } from '@/components/ui/button';
import { M3Spinner } from '@/components/ui/loading';
import { M3Entrance, M3Pressable } from '@/components/ui/m3-motion';
import { promptReport } from '@/components/ui/error-report';
import { useAuth } from '@/contexts/auth';
import { FontSize, Radius, Spacing } from '@/constants/theme';
import * as ai from '@/services/ai';
import { useAiQuota } from '@/services/ai-subscription';
import { ACTION_REGISTRY, executeAction, missingContext } from '@/services/ai-actions';
import i18n from '@/i18n';

const AUTO_APPLY_KEY = 'ai_chat_auto_apply';

type ActionStatus = 'pending' | 'applying' | 'applied' | 'rejected' | 'error';

interface ActionItem {
  proposal: ai.ActionProposal;
  status: ActionStatus;
  error?: string;
}

interface ChatItem {
  id: string;
  role: ai.ChatRole;
  content: string;
  actions?: ActionItem[];
}

let seq = 0;
const nextId = () => `m${Date.now().toString(36)}-${++seq}`;

function Orb({ size, children }: { size: number; children?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="m3Orb" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="1" stopColor={colors.tertiary} />
          </LinearGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#m3Orb)" />
      </Svg>
      {children}
    </View>
  );
}

function TypingDot({ color, delay }: { color: string; delay: number }) {
  const opacity = useSharedValue(0.3);
  const scale = useSharedValue(0.85);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 360, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 360, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 360, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 360, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false
      )
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={styles.dots}>
      <TypingDot color={color} delay={0} />
      <TypingDot color={color} delay={140} />
      <TypingDot color={color} delay={280} />
    </View>
  );
}

export default function AiChatScreen() {
  const { zoneId, zoneName } = useLocalSearchParams<{ zoneId?: string; zoneName?: string }>();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { accountId, accounts } = useAuth();
  const { quota } = useAiQuota();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [showPaywall, setShowPaywall] = useState(false);
  const [items, setItems] = useState<ChatItem[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [autoApply, setAutoApply] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        setAutoApply(localStorage.getItem(AUTO_APPLY_KEY) === 'true');
      } catch {}
    } else {
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync(AUTO_APPLY_KEY)
        .then((v: string | null) => setAutoApply(v === 'true'))
        .catch(() => {});
    }
  }, []);

  const toggleAutoApply = () => {
    const value = !autoApply;
    setAutoApply(value);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(AUTO_APPLY_KEY, value ? 'true' : 'false');
      } catch {}
    } else {
      const SecureStore = require('expo-secure-store');
      SecureStore.setItemAsync(AUTO_APPLY_KEY, value ? 'true' : 'false').catch(() => {});
    }
  };

  const context: ai.ChatContext = {
    accountId: accountId ?? undefined,
    accountName: accounts.find((a) => a.id === accountId)?.name,
    zoneId: zoneId || undefined,
    zoneName: zoneName || undefined,
  };

  const setActionStatus = (msgId: string, actionId: string, status: ActionStatus, error?: string) => {
    setItems((prev) => prev.map((m) => m.id !== msgId ? m : {
      ...m,
      actions: m.actions?.map((a) => a.proposal.id === actionId ? { ...a, status, error } : a),
    }));
  };

  const applyAction = useCallback(async (msgId: string, proposal: ai.ActionProposal) => {
    setActionStatus(msgId, proposal.id, 'applying');
    try {
      await executeAction(proposal, context);
      setActionStatus(msgId, proposal.id, 'applied');
    } catch (e: any) {
      const msgText = e?.response?.data?.errors?.[0]?.message ?? e?.message ?? t('ai_chat.action_error');
      setActionStatus(msgId, proposal.id, 'error', msgText);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [context.zoneId, context.accountId, t]);

  const send = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || sending) return;
    if (quota?.tier !== 'pro') { setShowPaywall(true); return; }

    const userItem: ChatItem = { id: nextId(), role: 'user', content: text };
    const history = [...items, userItem];
    setItems(history);
    setInput('');
    setSending(true);

    try {
      const res = await ai.chatAssistant({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
        context,
        language: i18n.language,
      });

      const knownActions = (res.actions ?? []).filter((a) => a.kind in ACTION_REGISTRY);
      const assistantItem: ChatItem = {
        id: nextId(),
        role: 'assistant',
        content: res.reply,
        actions: knownActions.map((proposal) => ({ proposal, status: 'pending' as ActionStatus })),
      };
      setItems((prev) => [...prev, assistantItem]);

      if (autoApply) {
        for (const a of knownActions) {
          if (!ACTION_REGISTRY[a.kind].destructive && !missingContext(a.kind, context)) {
            applyAction(assistantItem.id, a);
          }
        }
      }
    } catch (e: any) {
      setItems((prev) => prev.filter((m) => m.id !== userItem.id));
      setInput(text);
      if (e?.code === 'quota' || e?.code === 'auth') {
        setShowPaywall(true);
      } else {
        Alert.alert(t('common.error'), e?.message ?? t('ai_chat.send_error'), [
          { text: t('common.dismiss'), style: 'cancel' },
          { text: t('report.action'), onPress: () => promptReport(t, e) },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  const renderAction = (msgId: string, a: ActionItem) => {
    const missing = missingContext(a.proposal.kind, context);
    const danger = a.proposal.destructive;
    return (
      <View
        key={a.proposal.id}
        style={[
          styles.actionCard,
          danger
            ? getTintedGlassStyle(colors, isDark, colors.errorContainer + '8F', 18)
            : getGlassStyle(colors, isDark, 'surface', Radius.lg),
        ]}
      >
        <View style={styles.actionHead}>
          <View
            style={[
              styles.actionIcon,
              { backgroundColor: danger ? colors.error + '22' : colors.secondaryContainer },
            ]}
          >
            <Icon
              name={danger ? 'warning' : 'zap'}
              size={15}
              color={danger ? colors.onErrorContainer : colors.onSecondaryContainer}
            />
          </View>
          <Text
            style={[
              styles.actionLabel,
              { color: danger ? colors.onErrorContainer : colors.onSurface },
            ]}
          >
            {a.proposal.label}
          </Text>
        </View>

        {missing && (
          <Text style={[styles.actionMeta, { color: colors.error }]}>
            {t('ai_chat.missing_context', { field: missing === 'zoneId' ? t('ai_chat.a_zone') : t('ai_chat.an_account') })}
          </Text>
        )}

        {a.status === 'pending' && !missing && (
          <View style={styles.actionButtons}>
            <View style={{ flex: 1 }}>
              <Button
                title={t('common.dismiss')}
                variant="tonal"
                size="sm"
                onPress={() => setActionStatus(msgId, a.proposal.id, 'rejected')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={danger ? t('ai_chat.confirm_destructive') : t('common.apply')}
                variant={danger ? 'danger' : 'primary'}
                size="sm"
                onPress={() => applyAction(msgId, a.proposal)}
              />
            </View>
          </View>
        )}
        {a.status === 'applying' && <M3Spinner size="sm" color={colors.primary} style={{ marginTop: Spacing.sm }} />}
        {a.status === 'applied' && (
          <View style={styles.actionResult}>
            <Icon name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.actionMeta, { color: colors.success, marginTop: 0 }]}>{t('ai_chat.applied')}</Text>
          </View>
        )}
        {a.status === 'rejected' && (
          <Text style={[styles.actionMeta, { color: colors.onSurfaceVariant }]}>{t('ai_chat.dismissed')}</Text>
        )}
        {a.status === 'error' && (
          <Text style={[styles.actionMeta, { color: colors.error }]}>{a.error}</Text>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: ChatItem }) => {
    if (item.role === 'user') {
      return (
        <M3Entrance index={0} distance={8} style={styles.userRow}>
          <View
            style={[
              styles.userBubble,
              getTintedGlassStyle(colors, isDark, colors.primaryContainer + '94', 20),
              { borderBottomRightRadius: 6 },
            ]}
          >
            <Text style={[styles.userText, { color: colors.onPrimaryContainer }]}>{item.content}</Text>
          </View>
        </M3Entrance>
      );
    }
    return (
      <M3Entrance index={0} distance={8} style={styles.assistantRow}>
        <Orb size={32}><Icon name="sparkles" size={15} color={colors.onPrimary} /></Orb>
        <View style={styles.assistantCol}>
          {!!item.content && (
            <View
              style={[
                styles.assistantBubble,
                getGlassStyle(colors, isDark, 'surface', 22),
                { borderTopLeftRadius: 6 },
              ]}
            >
              <Text style={[styles.assistantText, { color: colors.onSurface }]}>{item.content}</Text>
            </View>
          )}
          {item.actions?.map((a) => renderAction(item.id, a))}
        </View>
      </M3Entrance>
    );
  };

  if (quota?.tier !== 'pro') {
    return (
      <>
        <View style={[styles.lockedContainer, { backgroundColor: colors.background }]}>
          <M3Entrance index={0} style={styles.lockedInner}>
            <Orb size={80}><Icon name="sparkles" size={34} color={colors.onPrimary} /></Orb>
            <Text style={[styles.heroTitle, { color: colors.onSurface }]}>{t('ai_chat.locked_title')}</Text>
            <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>{t('ai_chat.locked_body')}</Text>
            <View style={{ marginTop: Spacing.xl, minWidth: 200 }}>
              <Button title={t('ai_plan.upgrade')} onPress={() => setShowPaywall(true)} size="lg" />
            </View>
          </M3Entrance>
        </View>
        <AiPaywall visible={showPaywall} onClose={() => setShowPaywall(false)} />
      </>
    );
  }

  const suggestions: { icon: IconName; text: string }[] = [
    { icon: 'shield-check', text: t('ai_chat.sug_security') },
    { icon: 'dns', text: t('ai_chat.sug_dns') },
    { icon: 'cached', text: t('ai_chat.sug_cache') },
    { icon: 'activity', text: t('ai_chat.sug_slow') },
  ];

  const canSend = !!input.trim() && !sending;

  return (
    <>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
      >
        <View style={styles.inner}>
          {items.length === 0 ? (
            <ScrollView
              contentContainerStyle={styles.hero}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <M3Entrance index={0} style={{ alignItems: 'center' }}>
                <Orb size={80}><Icon name="sparkles" size={34} color={colors.onPrimary} /></Orb>
                <Text style={[styles.heroTitle, { color: colors.onSurface }]}>{t('ai_chat.hero_title')}</Text>
                <Text style={[styles.heroSub, { color: colors.onSurfaceVariant }]}>
                  {zoneName ? t('ai_chat.empty_zone', { zone: zoneName }) : t('ai_chat.hero_sub')}
                </Text>
              </M3Entrance>

              <View style={styles.suggestions}>
                {suggestions.map((s, idx) => (
                  <M3Entrance key={s.text} index={idx + 1} style={styles.suggestionSlot}>
                    <M3Pressable
                      radius={Radius.lg}
                      style={[styles.suggestion, getGlassStyle(colors, isDark, 'surface', Radius.lg)]}
                      onPress={() => send(s.text)}
                      accessibilityRole="button"
                    >
                      <View
                        style={[
                          styles.suggestionIcon,
                          {
                            backgroundColor: colors.secondaryContainer + '8F',
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: colors.glassBorderSubtle,
                            borderTopColor: colors.glassHighlight,
                          },
                        ]}
                      >
                        <Icon name={s.icon} size={17} color={colors.onSecondaryContainer} />
                      </View>
                      <Text style={[styles.suggestionText, { color: colors.onSurface }]}>{s.text}</Text>
                    </M3Pressable>
                  </M3Entrance>
                ))}
              </View>
            </ScrollView>
          ) : (
            <FlatList
              ref={listRef}
              data={items}
              keyExtractor={(i) => i.id}
              renderItem={renderItem}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              ListFooterComponent={sending ? (
                <View style={styles.assistantRow}>
                  <Orb size={32}><Icon name="sparkles" size={15} color={colors.onPrimary} /></Orb>
                  <View
                    style={[
                      styles.assistantBubble,
                      getGlassStyle(colors, isDark, 'surface', 22),
                      { borderTopLeftRadius: 6 },
                    ]}
                  >
                    <TypingDots color={colors.primary} />
                  </View>
                </View>
              ) : null}
            />
          )}

          {/* Composer */}
          <View style={[styles.composerWrap, { paddingBottom: Math.max(insets.bottom + 82, 92) }]}>
            <View style={styles.chipRow}>
              {!!zoneName && (
                <View style={[styles.chip, getGlassStyle(colors, isDark, 'subtle', Radius.sm)]}>
                  <Icon name="globe" size={13} color={colors.onSurfaceVariant} />
                  <Text style={[styles.chipText, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {zoneName}
                  </Text>
                </View>
              )}
              <M3Pressable
                onPress={toggleAutoApply}
                radius={Radius.sm}
                accessibilityRole="switch"
                accessibilityState={{ checked: autoApply }}
                style={[
                  styles.chip,
                  autoApply
                    ? getTintedGlassStyle(colors, isDark, colors.secondaryContainer + '8F', 16)
                    : getGlassStyle(colors, isDark, 'subtle', Radius.sm),
                ]}
              >
                <Icon
                  name="zap"
                  size={13}
                  color={autoApply ? colors.onSecondaryContainer : colors.onSurfaceVariant}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: autoApply ? colors.onSecondaryContainer : colors.onSurfaceVariant },
                  ]}
                  numberOfLines={1}
                >
                  {t('ai_chat.auto_apply')}
                </Text>
              </M3Pressable>
            </View>

            <View style={[styles.composer, getGlassStyle(colors, isDark, 'elevated', 28)]}>
              <TextInput
                style={[styles.input, { color: colors.onSurface }]}
                placeholder={t('ai_chat.placeholder')}
                placeholderTextColor={colors.onSurfaceVariant}
                value={input}
                onChangeText={setInput}
                multiline
                editable={!sending}
              />
              <M3Pressable
                onPress={() => send()}
                disabled={!canSend}
                radius={22}
                scaleTo={0.92}
                accessibilityRole="button"
                accessibilityLabel={t('ai_chat.send')}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: canSend ? colors.primary : colors.glassSurfaceSubtle,
                  },
                ]}
              >
                {sending ? (
                  <M3Spinner size="sm" color={colors.onSurfaceVariant} />
                ) : (
                  <Icon
                    name="send"
                    size={17}
                    color={canSend ? colors.onPrimary : colors.onSurfaceVariant}
                  />
                )}
              </M3Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <AiPaywall visible={showPaywall} onClose={() => setShowPaywall(false)} reason="quota" />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: 820, alignSelf: 'center' },

  hero: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  heroSub: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 320,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
    width: '100%',
  },
  suggestionSlot: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  suggestion: {
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    minHeight: 96,
  },
  suggestionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: { fontSize: FontSize.sm, fontWeight: '500', lineHeight: 19 },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  userRow: { alignItems: 'flex-end', marginBottom: Spacing.md },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: 22,
    borderBottomRightRadius: 6,
  },
  userText: { fontSize: FontSize.md, lineHeight: 21 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  assistantCol: { flex: 1, alignItems: 'flex-start', gap: Spacing.sm },
  assistantBubble: {
    maxWidth: '92%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderRadius: 22,
    borderTopLeftRadius: 6,
  },
  assistantText: { fontSize: FontSize.md, lineHeight: 22 },
  dots: { flexDirection: 'row', gap: 6, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },

  actionCard: {
    alignSelf: 'stretch',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  actionHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  actionIcon: { width: 32, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.sm, fontWeight: '600', flex: 1 },
  actionMeta: { fontSize: FontSize.xs, marginTop: Spacing.sm },
  actionResult: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.sm },
  actionButtons: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },

  composerWrap: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: Spacing.sm },
  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    height: 32,
    borderRadius: Radius.sm,
    flexShrink: 1,
  },
  chipText: { fontSize: FontSize.xs, fontWeight: '600', flexShrink: 1 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingLeft: Spacing.lg,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 28,
  },
  input: { flex: 1, fontSize: FontSize.md, maxHeight: 120, minHeight: 42, paddingVertical: 9 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },

  lockedContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  lockedInner: { alignItems: 'center', maxWidth: 360 },
});
