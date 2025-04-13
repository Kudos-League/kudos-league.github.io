import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TransitionPresets } from '@react-navigation/stack';

// Main Components
import DrawerNavigator from './DrawerNavigator';

// Donation Flow Pages
import Success from "pages/donate/success";
import Cancel from "pages/donate/cancel";

// Entity Pages
import Post from "pages/search/entities/post";
import Profile from "pages/search/entities/user";

// Authentication Pages
import SignIn from "pages/login/login";
import SignUp from "pages/login/tabs/sign-up";

import EventDetails from "pages/events/event";

// Navigation Constants
const HEADER_STYLE = {
  backgroundColor: '#ffffff',
  elevation: 4,
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
};

const HEADER_TITLE_STYLE = {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#2D3748',
    letterSpacing: 0.3,
};

const PRIMARY_COLOR = '#3B82F6';

const Stack = createStackNavigator();

/**
 * Authentication Stack Navigator
 * Handles sign in and sign up flows
 */
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{
        headerShown: false,
        headerStyle: HEADER_STYLE,
        headerTitleStyle: HEADER_TITLE_STYLE,
        headerTintColor: PRIMARY_COLOR,
      }}
    >
      <Stack.Screen 
        name="SignIn" 
        component={SignIn} 
        options={{
          title: "Sign In",
        }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{ 
          headerShown: true,
          title: "Create Account",
          headerBackTitleVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

/**
 * Main App Navigator
 * Controls the primary navigation flow of the application
 */
function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
        headerStyle: HEADER_STYLE,
        headerTitleStyle: HEADER_TITLE_STYLE,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
        cardStyle: { backgroundColor: '#F7FAFC' },
        headerShadowVisible: true,
      }}
    >
      {/* Main Entry Point */}
      <Stack.Screen 
        name="Home" 
        component={DrawerNavigator} 
      />
      
      {/* Donation Flow */}
      <Stack.Group 
        screenOptions={{
          gestureEnabled: true,
          cardOverlayEnabled: true,
          presentation: 'modal',
        }}
      >
        <Stack.Screen 
          name="Success" 
          component={Success}
          options={{
            title: "Donation Successful",
            headerShown: true,
          }}
        />
        
        <Stack.Screen 
          name="Cancel" 
          component={Cancel}
          options={{
            title: "Donation Cancelled",
            headerShown: true,
          }}
        />
      </Stack.Group>
      
      {/* Entity Details Screens */}
      <Stack.Group
        screenOptions={{
          headerShown: true,
          headerBackTitleVisible: false,
          headerTintColor: PRIMARY_COLOR,
        }}
      >
        <Stack.Screen
          name="Post"
          component={Post}
          options={{ 
            title: "Post Details",
          }}
        />
        
        <Stack.Screen
          name="UserProfile"
          component={Profile}
          options={{ 
            title: "Profile",
          }}
        />

      <Stack.Screen
        name="Event"
        component={EventDetails}
        options={{
          title: "Event Details",
        }}
      />
      </Stack.Group>
      
      {/* Authentication Flow */}
      <Stack.Screen 
        name="Auth" 
        component={AuthStack} 
        options={{
          gestureEnabled: false,
          animationEnabled: true,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}

export default AppNavigator;