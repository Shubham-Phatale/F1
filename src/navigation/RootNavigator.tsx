import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { navigationTheme } from '@/theme';
import { HomeNavigator } from './HomeNavigator';
import DriverDetailScreen from '@/screens/driver-detail/DriverDetailScreen';
import HeadToHeadScreen from '@/screens/head-to-head/HeadToHeadScreen';
import TrendAnalysisScreen from '@/screens/trend-analysis/TrendAnalysisScreen';
import ConstructorAnalysisScreen from '@/screens/constructor-analysis/ConstructorAnalysisScreen';
import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import AboutScreen from '@/screens/about/AboutScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeNavigator}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DriverDetail"
          component={DriverDetailScreen}
          options={{
            headerShown: false,
            title: 'Driver Profile',
          }}
        />
        <Stack.Screen
          name="HeadToHead"
          component={HeadToHeadScreen}
          options={{
            headerShown: false,
            title: 'Head to Head',
          }}
        />
        <Stack.Screen
          name="TrendAnalysis"
          component={TrendAnalysisScreen}
          options={{
            headerShown: false,
            title: 'Performance Trends',
          }}
        />
        <Stack.Screen
          name="ConstructorAnalysis"
          component={ConstructorAnalysisScreen}
          options={{
            headerShown: false,
            title: 'Constructor Stats',
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: false,
            title: 'Log In',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerShown: false,
            title: 'Sign Up',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: false,
            title: 'About',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
