import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
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
    <NavigationContainer>
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
            headerShown: true,
            title: 'Driver Profile',
          }}
        />
        <Stack.Screen
          name="HeadToHead"
          component={HeadToHeadScreen}
          options={{
            headerShown: true,
            title: 'Head to Head',
          }}
        />
        <Stack.Screen
          name="TrendAnalysis"
          component={TrendAnalysisScreen}
          options={{
            headerShown: true,
            title: 'Performance Trends',
          }}
        />
        <Stack.Screen
          name="ConstructorAnalysis"
          component={ConstructorAnalysisScreen}
          options={{
            headerShown: true,
            title: 'Constructor Stats',
          }}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{
            headerShown: true,
            title: 'Log In',
          }}
        />
        <Stack.Screen
          name="Register"
          component={RegisterScreen}
          options={{
            headerShown: true,
            title: 'Sign Up',
          }}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{
            headerShown: true,
            title: 'About',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
