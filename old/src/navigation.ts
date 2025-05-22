// navigation.ts
import { 
  NavigationContainerRef,
  CommonActions, 
  DrawerActions,
  StackActions, 
  createNavigationContainerRef
} from '@react-navigation/native';
import { ParamListBase } from '@react-navigation/native';

// Define your navigation parameter types
export type RootStackParamList = {
  Home: undefined | { screen?: string; params?: any };
  Success: undefined;
  Cancel: undefined;
  Post: { postId: string };
  UserProfile: { userId?: string };
  Event: { eventId: string };
  Auth: undefined;
};

export type DrawerParamList = {
  Home: { screen?: string; params?: any };
  'Create Post': undefined;
  Donate: undefined;
  Search: undefined;
  Leaderboard: undefined;
  Chat: undefined;
  'Create Event': undefined;
};

export type TabParamList = {
  Feed: undefined;
  DMs: { conversationId?: string };
  'My Profile': { userId?: string };
  'Public Chats': undefined;
  About: undefined;
  Login: undefined;
  Register: undefined;
};

// Create a simpler navigation reference type
export const navigationRef = createNavigationContainerRef<ParamListBase>();

// Helper to check if navigation is ready
function isNavigationReady(): boolean {
  return !!navigationRef.current && navigationRef.isReady();
}

// General navigation utilities
export const NavigationService = {
  /**
   * Navigate to any screen in the app
   */
  navigate: (name: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate(name, params);
    } else {
      console.warn('Navigation attempted before navigator was ready');
    }
  },

  /**
   * Go back to the previous screen
   */
  goBack: () => {
    if (isNavigationReady() && navigationRef.current?.canGoBack()) {
      navigationRef.current?.goBack();
    }
  },

  /**
   * Reset navigation state and go to a specific route
   */
  reset: (routeName: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: routeName, params }],
        })
      );
    }
  },

  /**
   * Push a new screen onto the stack
   */
  push: (name: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(
        StackActions.push(name, params)
      );
    }
  },

  /**
   * Replace the current screen
   */
  replace: (name: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(
        StackActions.replace(name, params)
      );
    }
  },

  /**
   * Control drawer
   */
  openDrawer: () => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(DrawerActions.openDrawer());
    }
  },

  closeDrawer: () => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(DrawerActions.closeDrawer());
    }
  },

  toggleDrawer: () => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(DrawerActions.toggleDrawer());
    }
  },

  // Specific navigation functions for common routes
  navigateToTab: (tabName: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { 
        screen: tabName,
        params
      });
    }
  },

  navigateToDrawer: (drawerName: string, params?: any) => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate(drawerName, params);
    }
  },

  navigateToProfile: (userId?: string) => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('UserProfile', { userId });
    }
  },

  navigateToPost: (postId: string) => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Post', { postId });
    }
  },

  navigateToEvent: (eventId: string) => {
    if (isNavigationReady()) {
      const id = eventId;
      navigationRef.current?.navigate('Event', { id });
    }
  },

  navigateToChat: (conversationId?: string) => {
    if (isNavigationReady()) {
      if (!conversationId) {
          navigationRef.current?.navigate('DMs');
          return;
      }
      navigationRef.current?.navigate('Home', { 
          screen: 'DMs', 
          params: { conversationId } 
      });
    }
  },

  navigateToPublicChat: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { screen: 'Public Chats' });
    }
  },

  navigateToCreatePost: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Create Post');
    }
  },

  navigateToDonate: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Donate');
    }
  },

  navigateToSearch: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Search');
    }
  },

  navigateToLeaderboard: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Leaderboard');
    }
  },

  navigateToCreateEvent: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Create Event');
    }
  },

  navigateToLogin: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { screen: 'Login' });
    }
  },

  navigateToRegister: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { screen: 'Register' });
    }
  },

  navigateToAbout: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { screen: 'About' });
    }
  },

  navigateToSuccess: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Success');
    }
  },

  navigateToCancel: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Cancel');
    }
  },

  navigateToAuth: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Auth');
    }
  },

  navigateToHome: () => {
    if (isNavigationReady()) {
      navigationRef.current?.navigate('Home', { screen: 'Feed' });
    }
  },

  resetToHome: () => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Home' }],
        })
      );
    }
  },

  resetToLogin: () => {
    if (isNavigationReady()) {
      navigationRef.current?.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ 
            name: 'Home',
            params: { screen: 'Login' }
          }],
        })
      );
    }
  },
};

export default NavigationService;
