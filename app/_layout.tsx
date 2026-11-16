import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { loadLanguage } from '@/i18n';

import { useEffect, useMemo } from 'react';
import { AuthProvider } from '@/contexts/auth';
import { ThemeProvider, useThemeContext } from '@/contexts/theme';
import { useTheme } from '@/hooks/use-theme';
import { Platform, View } from 'react-native';
import { LockGate } from '@/components/ui/lock-gate';
import { AmbientGlassBackdrop, GlassHeaderBackdrop } from '@/components/ui/glass';
import { applyScreenshotBlock } from '@/services/app-lock';
import { refreshShortcuts } from '@/widgets/sync';
import { initPremium } from '@/services/premium';
import { initAdReward } from '@/services/ad-reward';
import { initZoneTiles } from '@/services/zone-tiles';
import { refreshQuota } from '@/services/ai-subscription';
import { syncMonitoring } from '@/services/monitor-task';
import { track } from '@/services/analytics';
import { checkPlayUpdate } from '@/services/play-update';
import { installGlobalErrorLog } from '@/services/error-log';
import { ErrorScreen } from '@/components/ui/error-screen';

// Expo Router renders this in place of the layout when a screen throws while rendering.
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return <ErrorScreen error={error} retry={retry} />;
}

function AppContent() {
  const { resolved } = useThemeContext();
  const { colors } = useTheme();

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    if (document.getElementById('cf-glass-web-css')) return;
    const style = document.createElement('style');
    style.id = 'cf-glass-web-css';
    style.textContent = `
      html, body, #root {
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb {
        background: rgba(128, 128, 140, 0.28);
        border-radius: 999px;
      }
      ::-webkit-scrollbar-thumb:hover { background: rgba(128, 128, 140, 0.45); }
    `;
    document.head.appendChild(style);
  }, []);

  const navTheme = useMemo(() => {
    const base = resolved === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: 'transparent',
        card: 'transparent',
        text: colors.onSurface,
        border: colors.glassBorderSubtle,
        notification: colors.primary,
      },
    };
  }, [resolved, colors]);

  return (
    <NavThemeProvider value={navTheme}>
      <View style={{ flex: 1, backgroundColor: colors.canvas }}>
        <AmbientGlassBackdrop />
        <LockGate>
          <Stack
            screenOptions={{
              headerShown: false,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: 'transparent' },
              headerBackground: () => <GlassHeaderBackdrop />,
              headerTintColor: colors.onSurface,
              headerTitleStyle: { fontSize: 20, fontWeight: '600' },
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'fade_from_bottom',
            }}
          >
          <Stack.Screen name="search" options={{ animation: 'fade', headerShown: true }} />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="oauth/callback" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="zone/[id]"
            options={{ animation: 'fade_from_bottom' }}
          />
          <Stack.Screen name="about" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="changelog" options={{ animation: 'fade_from_bottom' }} />
          <Stack.Screen name="accounts" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="monitoring" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="audit-logs" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="history" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="security" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="shortcuts" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="lists" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="lists/[list]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="registrar" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="billing" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="devices" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="turnstile" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="account-members" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="api-tokens" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="notifications" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="products" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="bulk" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="load-balancers" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="web-analytics" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="queues" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="workers-ai" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="ai-gateway" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="workflows" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="stream" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="images" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="pipelines" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="dns-firewall" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="address-maps" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="tunnels" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="tunnels/[tunnel]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="durable-objects" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="durable-objects/[namespace]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="hyperdrive" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="vectorize" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="vectorize/[index]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="autorag" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="autorag/[id]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="secrets-store" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="secrets-store/[store]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="workers-for-platforms" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="workers-for-platforms/[namespace]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="access-apps" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="access-apps/[app]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="access-idps" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="access-service-tokens" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="access-mtls" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="infra-targets" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="gateway-rules" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="d1/[db]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="kv/[ns]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="r2/[bucket]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="pages/[project]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="worker/[script]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          <Stack.Screen name="worker-ide/[script]" options={{ animation: 'fade_from_bottom', headerShown: false }} />
          <Stack.Screen name="worker-tail/[script]" options={{ animation: 'fade_from_bottom', headerShown: true }} />
          </Stack>
        </LockGate>
      </View>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    installGlobalErrorLog();
    applyScreenshotBlock().catch(() => {});
    loadLanguage().catch(() => {});
    initPremium();
    // Day passes earned from rewarded ads, so a gated screen knows at once.
    initAdReward().catch(() => {});
    initZoneTiles().catch(() => {});
    // Also loads the quota store, which subscribes to AI usage events.
    refreshQuota().catch(() => {});
    checkPlayUpdate();
    syncMonitoring();
    // Bring the widget and the Quick Settings tile up to date with this sign-in.
    if (Platform.OS === 'android') setTimeout(() => refreshShortcuts().catch(() => {}), 3000);
    track('app_open');
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
