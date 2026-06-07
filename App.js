import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context'; // <-- CRITICAL IMPORT FOR FIX
import { LayoutDashboard, Map, MessageSquare, UserCheck } from 'lucide-react-native';

// State Layer Provider Import
import { RallyProvider, useRally } from './src/context/RallyContext';

// Screen Module Imports
import Dashboard from './src/screens/Dashboard';
import MapScreen from './src/screens/MapScreen';
import InboxScreen from './src/screens/InboxScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import CoachPolicyScreen from './src/screens/CoachPolicyScreen';

// Global custom modal (replaces native Alert.alert / window.alert on web)
import RallyModal from './src/components/RallyModal';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <RallyProvider>
        <MainAppFlow />
        <RallyModal />
      </RallyProvider>
    </SafeAreaProvider>
  );
}

function MainAppFlow() {
  const { onboardingComplete, completeOnboarding, userRole, hasAgreedToCoachPolicy } = useRally();

  if (!onboardingComplete) {
    return <AuthScreen onComplete={completeOnboarding} />;
  }

  // Coaches must read and agree to the policy once before reaching the main app
  if (userRole === 'coach' && !hasAgreedToCoachPolicy) {
    return <CoachPolicyScreen />;
  }

  // Full multi-tab interface once onboarding is complete
  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#FF9500',
          tabBarInactiveTintColor: '#636366',
          tabBarStyle: {
            backgroundColor: 'rgba(20,20,22,0.98)',
            borderTopWidth: 1,
            borderTopColor: '#1F1F22',
            height: 68,
            paddingBottom: 10,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.2,
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused }) => {
            const size = 22;
            const strokeWidth = focused ? 2.4 : 2;
            if (route.name === 'Dashboard') {
              return <LayoutDashboard color={color} size={size} strokeWidth={strokeWidth} />;
            } else if (route.name === 'Map') {
              return <Map color={color} size={size} strokeWidth={strokeWidth} />;
            } else if (route.name === 'Inbox') {
              return <MessageSquare color={color} size={size} strokeWidth={strokeWidth} />;
            } else if (route.name === 'Profile') {
              return <UserCheck color={color} size={size} strokeWidth={strokeWidth} />;
            }
          },
        })}
      >
        <Tab.Screen name="Dashboard" component={Dashboard} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="Inbox" component={InboxScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}