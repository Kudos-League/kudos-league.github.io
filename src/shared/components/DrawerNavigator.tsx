import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Home from 'pages/home/home';
import CreatePost from 'pages/create-post/create-post';
import Donate from "pages/donate/donate";
import Search from 'pages/search/home';
import { useAuth } from 'shared/hooks/useAuth';
import tailwind from "shared/components/tailwind";
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getAvatarURL } from 'shared/api/config';
import Leaderboard from './Leaderboard';
import CreateEvent from './events/CreateEvent';
import AvatarComponent from './Avatar';
import Chat from './messages/Chat';

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
            <AvatarComponent
              username={user.username}
              avatar={user.avatar}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user?.username?.charAt(0) || "U"}</Text>
            </View>
          )}
          <View style={styles.statusIndicator} />
        </View>
      </TouchableOpacity>

      {showDropdown && (
        <Modal
          transparent
          visible={showDropdown}
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 12 }}>
      <TouchableOpacity
        onPress={() => navigation.navigate("Home", { screen: "Login" })}
        style={{
          backgroundColor: 'transparent',
          paddingVertical: 10,
          paddingHorizontal: 24,
          borderRadius: 25,
          borderWidth: 2,
          borderColor: '#3b82f6',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        }}
        activeOpacity={0.6}
      >
        <Text style={{ color: '#3b82f6', fontWeight: '700', textAlign: 'center' }}>LOG IN</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        onPress={() => navigation.navigate("Home", { screen: "Register" })}
        style={{
          backgroundColor: '#3b82f6',
          paddingVertical: 10,
          paddingHorizontal: 24,
          borderRadius: 25,
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          marginRight: 30 
        }}
        activeOpacity={0.6}
      >
        <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>SIGN UP</Text>
      </TouchableOpacity>
    </View>
  );
}

function DrawerNavigator() {
  const { isLoggedIn, user } = useAuth();
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
      <Drawer.Screen name="Home" component={Home} options={{ headerTitle: " " }} />
      {isLoggedIn && 
      <>
        <Drawer.Screen name="Create Post" component={CreatePost} />
        <Drawer.Screen name="Donate" component={Donate} />
        <Drawer.Screen name="Search" component={Search} />
        <Drawer.Screen name="Leaderboard" component={Leaderboard} />
        <Drawer.Screen name="Chat" component={Chat} />
        <Drawer.Screen name="Create Event" component={CreateEvent} />
      </>
      }
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  dropdown: { 
    position: 'absolute', 
    top: 65, 
    right: 10, 
    backgroundColor: '#FFF', 
    padding: 8, 
    borderRadius: 6, 
    shadowOpacity: 0.1, 
    shadowRadius: 4, 
    elevation: 5,
    minWidth: 120,
  },
  dropdownItem: { padding: 8 },
});

export default DrawerNavigator;
