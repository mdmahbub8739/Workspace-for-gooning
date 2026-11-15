import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { Tabs, Redirect, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/ui/icon';
import { FloatingTabBar } from '@/components/ui/tab-bar';
import { HeaderButton } from '@/components/ui/header-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/contexts/auth';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

const ONBOARDING_KEY = 'cf_onboarding_done';

function getOnboardingDone(): boolean {
  if (Platform.OS === 'web') {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  }
  return false; // native checks async, handled below
}

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isLoading, isAuthenticated, connectionError, retrySession, logout } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(Platform.OS === 'web');
  const [onboardingDone, setOnboardingDone] = useState(getOnboardingDone);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const SecureStore = require('expo-secure-store');
      SecureStore.getItemAsync(ONBOARDING_KEY).then((val: string | null) => {
        setOnboardingDone(val === '1');
        setOnboardingChecked(true);
      });
    }
  }, []);

  if (isLoading || !onboardingChecked) return <Loading />;
  if (!onboardingDone) return <Redirect href="/onboarding" />;
  if (!isAuthenticated && connectionError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', gap: Spacing.md, padding: Spacing.xl, backgroundColor: colors.background }}>
        <EmptyState icon="globe" title={t('auth.offline_title')} message={t('auth.offline_message')} />
        <Button title={t('common.retry')} onPress={retrySession} size="lg" />
        <Button title={t('auth.sign_in')} onPress={logout} variant="secondary" size="lg" />
      </View>
    );
  }
  if (!isAuthenticated) return <Redirect href="/login" />;

  const headerActions = () => (
    <View style={{ flexDirection: 'row', gap: Spacing.sm, marginRight: Spacing.lg }}>
      <HeaderButton icon="search" label={t('search.title')} onPress={() => router.push('/search' as any)} />
      <HeaderButton icon="bell" label={t('settings.monitoring')} onPress={() => router.push('/monitoring' as any)} />
    </View>
  );

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.onSurface,
        headerShadowVisible: false,
        headerTitleAlign: 'left',
        headerTitleStyle: { fontSize: 24, fontWeight: '600', letterSpacing: -0.4 },
        headerRight: headerActions,
        sceneStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <Icon name="dashboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: t('tabs.zones'),
          tabBarIcon: ({ color, size }) => <Icon name="globe" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: t('tabs.ai_chat'),
          tabBarIcon: ({ color, size }) => <Icon name="sparkles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: t('tabs.services'),
          tabBarIcon: ({ color, size }) => <Icon name="widgets" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color, size }) => <Icon name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
