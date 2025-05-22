import 'shared/init'; // ! DO NOT MOVE THIS!!!

import { Suspense } from "react";
import { StyleSheet, Text } from "react-native";
import {
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { createURL } from "expo-linking";
import ErrorBoundary from "react-native-error-boundary";

import { store } from "redux_store/store";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as PaperProvider } from "react-native-paper";
import { AuthProvider, useAuth } from "shared/hooks/useAuth";
import { Host } from "react-native-portalize";

import { TailwindProvider } from "tailwind-rn";

import utilities from "./tailwind.json";
import AppNavigator from "shared/components/AppNavigator";
import { navigationRef } from './src/navigation';

function ErrorFallback() {
  return <Text>Error loading</Text>;
}

export default function App() {
  return (
    // @ts-ignore
    <TailwindProvider utilities={utilities}>
      <ReduxProvider store={store}>
        <PaperProvider>
          <Suspense fallback={<Text>Loading app...</Text>}>
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              onError={console.error}
            >
              <AuthProvider>
                <Host>
                  <AppCore />
                </Host>
              </AuthProvider>
            </ErrorBoundary>
          </Suspense>
        </PaperProvider>
      </ReduxProvider>
    </TailwindProvider>
  );
}

function AppCore() {
  const { loading } = useAuth();

  if (loading) {
    return <Text>Loading...</Text>;
  }

  return (
    <NavigationContainer linking={getLinkingOptions()} ref={navigationRef}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function getLinkingOptions(): LinkingOptions<{}> {
  return {
    prefixes: [createURL("/")],
    config: {
      screens: {
        Home: {
          path: "home",
          screens: {
            Feed: "feed",
            Notifications: "notifications",
            "My Profile": "my-profile",
            Settings: "settings",
          },
        },
        "Create Post": "create-post",
        Donate: "donate",
        Leaderboard: 'leaderboard',
        Login: {
          path: "login",
          screens: {
            "Sign In": "sign-in",
            "Sign Up": "sign-up",
          },
        },
        Search: {
          path: "search",
          screens: {
            Home: "search",
            User: "user/:username",
            Post: "post/:id",
          },
        },
        Success: "success",
        Cancel: "cancel",
      },
    },
  };
}

const styles = StyleSheet.create({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  logo: {
    height: 50,
    width: 50,
    marginTop: 4,
  },
  topBar: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flexDirection: "row",
    flex: 1,
  },
  button: {
    padding: 10,
    margin: 5,
    backgroundColor: "lightblue",
    borderRadius: 5,
  },
  titleText: {
    marginLeft: 10,
    fontSize: 28,
  },
  mainContent: {
    flex: 1,
  },
  sharedContent: {
    height: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ccc",
    marginRight: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoutContainer: {
    padding: 16,
  },
  logoutText: {
    color: "red",
    fontSize: 16,
  },
});
