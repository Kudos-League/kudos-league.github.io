import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Home from 'pages/home/home';
import CreatePost from 'pages/create-post/create-post';
import Donate from "pages/donate/donate";
import Search from 'pages/search/home';
import { useAuth } from 'shared/hooks/useAuth';
import tailwind from "shared/components/tailwind";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getEndpointUrl } from 'shared/api/config';

const Drawer = createDrawerNavigator();

function HeaderRight() {
  const { logout, isLoggedIn, user } = useAuth();
  const navigation = useNavigation();
  const [showDropdown, setShowDropdown] = useState(false);

  return isLoggedIn && user ? (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
      <TouchableOpacity
        onPress={() => setShowDropdown(prev => !prev)}
        style={tailwind("flex-row items-center mr-4")}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: `${getEndpointUrl()}${user.avatar}` }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.username?.charAt(0) || "U"}</Text>
            </View>
          )}
          <View style={styles.statusIndicator} />
        </View>
      </TouchableOpacity>

      {showDropdown && (
        <View style={styles.dropdown}>
          <TouchableOpacity
            onPress={() => {
              setShowDropdown(false);
              navigation.navigate("UserProfile");
            }}
            style={styles.dropdownItem}
          >
            <Text style={tailwind("text-gray-700")}>Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setShowDropdown(false);
              logout();
            }}
            style={styles.dropdownItem}
          >
            <Text style={tailwind("text-red-500")}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ) : (
    <View style={{ display: "flex", flexDirection: "row", gap: 8, marginRight: 16 }}>
      <TouchableOpacity
        onPress={() =>     navigation.navigate("Home", {
          screen: "Login" // First ensure we're on the Home screen
        })}

        style={[tailwind("py-1.5 px-3 rounded-md mr-2"), styles.signInButton]}
        activeOpacity={0.8}
      >
        <Text style={tailwind("text-blue-500 font-medium text-sm")}>LOG IN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate("Home", { screen: "Register" })}
        style={[tailwind("py-1.5 px-3 rounded-md"), styles.signUpButton]}
        activeOpacity={0.8}
      >
        <Text style={tailwind("text-white font-medium text-sm")}>SIGN UP</Text>
      </TouchableOpacity>
    </View>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{ paddingLeft: 16, paddingRight: 8, paddingTop: 8, paddingBottom: 8, marginLeft: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        ),
        headerRight: () => <HeaderRight />,
        headerStyle: [tailwind("bg-white"), styles.header],
        headerTitleStyle: tailwind("text-gray-800 text-lg font-semibold"),
        headerTitleAlign: "center",
        drawerActiveTintColor: "#3B82F6",
        drawerInactiveTintColor: "#4B5563",
      })}
    >
      <Drawer.Screen name="Home" component={Home} options={{ headerTitle: "Kudos League" }} />
      <Drawer.Screen name="Create Post" component={CreatePost} />
      <Drawer.Screen name="Donate" component={Donate} />
      <Drawer.Screen name="Search" component={Search} />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  avatarContainer: { position: 'relative', width: 32, height: 32 },
  avatar: { width: 40, height: 40, borderRadius: 16, borderWidth: 1.5, borderColor: '#E5E7EB' },
  avatarPlaceholder: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#F3F4F6' },
  avatarText: { fontSize: 14, fontWeight: 'bold', color: '#6B7280' },
  statusIndicator: { position: 'absolute', bottom: -5, right: -5, width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', borderWidth: 1.5, borderColor: '#FFFFFF' },
  signInButton: { backgroundColor: '#EBF5FF', borderWidth: 1, borderColor: '#BFDBFE' },
  signUpButton: { backgroundColor: '#3B82F6' },
  header: { elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  dropdown: { position: 'absolute', top: 40, right: 10, backgroundColor: '#FFF', padding: 8, borderRadius: 6, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5 },
  dropdownItem: { padding: 8 },
});

export default DrawerNavigator;
