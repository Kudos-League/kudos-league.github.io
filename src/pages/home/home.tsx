import { ComponentProps } from "react";
import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import FontAwesome from "@expo/vector-icons/FontAwesome";

import Feed from "./tabs/feed";
import Profile from "pages/search/entities/user";
import SignIn from "pages/login/login";
import SignUp from "pages/login/tabs/sign-up";
import Chat from "shared/components/messages/Chat";
import PublicChat from "shared/components/messages/PublicChat";
import { useAuth } from "shared/hooks/useAuth";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function Home() {
  const { isLoggedIn } = useAuth();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Feed"
        options={getTabOptions("history")}
        component={Feed}
      />
      {isLoggedIn ? (
        <>
          <Tab.Screen
            name="Public Chats"
            options={getTabOptions("comments")}
            component={PublicChat}
          />
          <Tab.Screen
            name="DMs"
            options={getTabOptions("envelope")}
            component={Chat}
          />
          <Tab.Screen
            name="My Profile"
            options={getTabOptions("user-circle")}
            component={Profile}
          />
        </>
      ) : (
        <>
          <Tab.Screen
            name="Login"
            options={getTabOptions("sign-in")}
            component={SignIn}
          />
          <Tab.Screen
            name="Register"
            options={getTabOptions("user-plus")}
            component={SignUp}
          />
        </>
      )}
    </Tab.Navigator>
  );
}

function getTabOptions(
  iconName: ComponentProps<typeof FontAwesome>["name"]
): BottomTabNavigationOptions {
  return {
    tabBarIcon: ({ color }) => (
      <FontAwesome
        size={20}
        style={{ marginBottom: -3 }}
        name={iconName}
        color={color}
      />
    ),
  };
}
