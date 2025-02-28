import { Suspense } from "react";
import { Image, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import {
  Link,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { createURL } from "expo-linking";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import ErrorBoundary from "react-native-error-boundary";
import { useNavigation } from "@react-navigation/native";

import 'shared/init';

import Home from "pages/home/home";
import CreatePost from "pages/create-post/create-post";
import Post from "pages/search/entities/post";
import Donate from "pages/donate/donate";
import Success from "pages/donate/success";
import Cancel from "pages/donate/cancel";
import SignIn from "pages/login/login";
import SignUp from "pages/login/tabs/sign-up";
import Search from "pages/search/search";
import Profile from "pages/search/entities/user";

import { store } from "redux_store/store";
import { Provider } from "react-redux";
import { useAuth, AuthProvider } from "shared/hooks/useAuth";

import { TailwindProvider } from "tailwind-rn";
import tailwind from "shared/components/tailwind";

import utilities from "./tailwind.json";

const Drawer = createDrawerNavigator();
const Stack = createStackNavigator();

function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={DrawerNavigator} />
      <Stack.Screen name="Success" component={Success} />
      <Stack.Screen name="Cancel" component={Cancel} />
      <Stack.Screen
        name="Post"
        component={Post}
        options={{ headerShown: true }}
      />
      <Stack.Screen
        name="UserProfile"
        component={Profile}
        options={{ headerShown: true }}
      />
      <Stack.Screen name="Auth" component={AuthStack} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  const Stack = createStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{ headerShown: true }}
      />
    </Stack.Navigator>
  );
}

function DrawerNavigator() {
  const navigation = useNavigation();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={tailwind("pl-4 pr-2 py-2")}
          >
            <FontAwesome name="bars" size={24} color="black" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View style={tailwind("flex-row items-center justify-end mr-4")}>
            <TouchableOpacity
              onPress={() => navigation.navigate("Create Post")}
              style={tailwind("mr-4")}
            >
              <FontAwesome
                name="plus"
                size={24}
                style={tailwind("text-blue-500")}
              />
            </TouchableOpacity>

            {isLoggedIn ? (
              <View style={tailwind("flex-row items-center gap-4")}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("UserProfile")}
                >
                  <View style={[styles.avatarPlaceholder, tailwind("ml-2")]}>
                    {user?.avatar && (
                      <Image
                        source={{ uri: user.avatar }}
                        style={styles.avatar}
                      />
                    )}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={logout}>
                  <Text style={tailwind("text-red-500 font-bold")}>Logout</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.container}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Auth", { screen: "SignIn" })
                  }
                  style={tailwind("mr-4")}
                >
                  <Text style={tailwind("text-blue-500 font-bold")}>
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Auth", { screen: "SignUp" })
                  }
                >
                  <Text style={tailwind("text-blue-500 font-bold")}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ),
        drawerStyle: tailwind("bg-white px-4"),
        headerStyle: tailwind("bg-white shadow-md"),
        headerTitleStyle: tailwind("text-black text-xl font-bold"),
        headerTitleAlign: "center",
      })}
    >
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{
          headerTitle: "Kudos League",
        }}
      />
      <Drawer.Screen name="Create Post" component={CreatePost} />
      <Drawer.Screen name="Donate" component={Donate} />
      <Drawer.Screen name="Search" component={Search} />
    </Drawer.Navigator>
  );
}

function ErrorFallback() {
  return <Text>Error loading</Text>;
}

export default function App() {
  return (
    // @ts-ignore
    <TailwindProvider utilities={utilities}>
      <Provider store={store}>
        <Suspense fallback={<Text>Loading app...</Text>}>
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={console.error}
          >
            <AuthProvider>
              <AppCore />
            </AuthProvider>
          </ErrorBoundary>
        </Suspense>
      </Provider>
    </TailwindProvider>
  );
}

function AppCore() {
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
