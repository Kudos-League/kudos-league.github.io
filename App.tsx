import { Suspense } from "react";
import { Image, StyleSheet, View, Text } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  Link,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { createURL } from "expo-linking";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import Home from "pages/home/home";
import CreatePost from "pages/create-post/create-post";
import PostDetails from "pages/search/entities/post";
import Donate from "pages/donate/donate";
import Success from "pages/donate/success";
import Cancel from "pages/donate/cancel";
import Login from "pages/login/login";
import Search from "pages/search/search";

import { store } from "redux_store/store";
import { Provider } from "react-redux";
import { useAppSelector } from "redux_store/hooks";
import { isValidAuthState } from "redux_store/slices/auth-slice";
import useAuth from "shared/hooks/use-auth";

import { create, TailwindProvider } from "tailwind-rn";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

import utilities from "./tailwind.json";

// @ts-ignore
const tailwind = create(utilities); // ! Do not ask me about this, it's in the docs - https://www.npmjs.com/package/tailwind-rn/v/3.0.1#3-create-a-custom-tailwind-function

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Makes path /Home/home/feed, not sure how else to do this right now, but required for hidden paths */}
      <Stack.Screen name="Home" component={DrawerNavigator} />
      <Stack.Screen name="Success" component={Success} />
      <Stack.Screen name="Cancel" component={Cancel} />
    </Stack.Navigator>
  );
}

function DrawerNavigator() {
  const authState = useAppSelector((state) => state.auth);

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerRight: () => (
          <Link
            style={tailwind("mr-4")}
            to={{ screen: "Create Post" }}
            accessibilityLabel="Create Post"
          >
            <FontAwesome
              name="plus"
              size={25}
              style={tailwind("text-blue-500")}
            />
          </Link>
        ),
        drawerStyle: tailwind("bg-white"),
        headerStyle: tailwind("bg-blue-500"),
        headerTintColor: "#000000",
      }}
    >
      <Drawer.Screen name="Home" component={Home} />
      <Drawer.Screen name="Create Post" component={CreatePost} />
      <Drawer.Screen name="Donate" component={Donate} />
      <Drawer.Screen name="Search" component={Search} />
      {authState && isValidAuthState(authState) ? (
        <Drawer.Screen name="Switch Account" component={Login} />
      ) : (
        <Drawer.Screen name="Login" component={Login} />
      )}
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    // @ts-ignore
    <TailwindProvider utilities={utilities}>
      <Provider store={store}>
        <Suspense fallback={<Text>Loading app...</Text>}>
          <AppCore />
        </Suspense>
      </Provider>
    </TailwindProvider>
  );
}

function AppCore() {
  useAuth();

  return (
    <NavigationContainer linking={getLinkingOptions()}>
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
  titleText: {
    marginLeft: 10,
    fontSize: 28,
  },
  container: {
    flex: 1,
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
});
