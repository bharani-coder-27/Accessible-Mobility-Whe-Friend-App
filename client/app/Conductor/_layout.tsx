import React, { useContext } from 'react';
import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PassengerContext, PassengerProvider } from '../../src/contexts/PassengerContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { useTheme } from '../../src/theme';

function ConductorTabs() {
  const { passengers } = useContext(PassengerContext);
  const theme = useTheme();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const waitingCount = passengers.filter((item) => item.status === 'waiting').length;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primaryText,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          // The gesture bar / navigation buttons sit below the tab bar, so the
          // bottom inset is added rather than assumed to be zero. Without this
          // the labels sit underneath the system navigation on most phones.
          height: 64 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopWidth: theme.highContrast ? 2 : 1,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamily.medium,
          fontSize: theme.size('caption'),
        },
      }}
    >
      <Tabs.Screen
        name="waiting"
        options={{
          title: t('waiting'),
          // The count sits on the tab itself so a conductor working the route
          // can see that someone is waiting without opening the screen.
          tabBarBadge: waitingCount > 0 ? waitingCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.danger,
            color: theme.colors.onDanger,
          },
          tabBarIcon: ({ color, size }) => <Ionicons name="hourglass" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="traveling"
        options={{
          title: t('traveling'),
          tabBarIcon: ({ color, size }) => <Ionicons name="bus" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          title: t('completed'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-done" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('account'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function ConductorLayout() {
  return (
    <PassengerProvider>
      <ConductorTabs />
    </PassengerProvider>
  );
}
