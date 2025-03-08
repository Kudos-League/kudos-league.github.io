import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, } from 'react-native';
import { Button } from 'react-native-paper';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Home from 'pages/home/home';
import CreatePost from 'pages/create-post/create-post';
import Donate from "pages/donate/donate";
import Search from 'pages/search/home';
import ProfilePage from 'pages/profile/ProfilePage';
import { useAuth } from 'shared/hooks/useAuth';
import { TailwindProvider } from "tailwind-rn";
import tailwind from "shared/components/tailwind";


const Drawer = createDrawerNavigator();


function HeaderRight() {
  
const { login, token, logout, isLoggedIn, user } = useAuth();
const navigation = useNavigation();


  if (isLoggedIn && user) {
    return (
        <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-end",
        }}>
            <TouchableOpacity
                onPress={() => navigation.navigate("UserProfile")}
                style={tailwind("flex-row items-center mr-4")}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                        {user?.username?.charAt(0) || "U"}
                    </Text>
                    </View>
                )}
                <View style={styles.statusIndicator} />
                </View>
                <Text style={tailwind("ml-2 text-gray-700 font-medium")}>
                {user?.username || "User"}
                </Text>
            </TouchableOpacity>
        </View>
    );
  }

  return (
    <View 
        style={{
            display: "flex",
            flexDirection: "row",
            gap: 8,
            marginRight: 16
        }}>
      {isLoggedIn ? (
        <>
            <TouchableOpacity
                onPress={() => navigation.navigate("Auth", { screen: "SignIn" })}
                style={[tailwind("py-1.5 px-3 rounded-md mr-2"), styles.signInButton]}
                activeOpacity={0.8}
            >
                <Text style={tailwind("text-blue-500 font-medium text-sm")}>
                LOG IN
                </Text>
            </TouchableOpacity>
            <TouchableOpacity
                onPress={() => navigation.navigate("Auth", { screen: "SignUp" })}
                style={[tailwind("py-1.5 px-3 rounded-md"), styles.signUpButton]}
                activeOpacity={0.8}
            >
                <Text style={tailwind("text-white font-medium text-sm")}>
                SIGN UP
                </Text>
            </TouchableOpacity>
        </>
        ): (
            <View style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
                <Text>{user?.username}</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate("UserProfile")}
                    style={tailwind("flex-row items-center mr-4")}
                    activeOpacity={0.7}
                >
                    <View style={styles.avatarContainer}>
                    {user?.avatar ? (
                        <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                            {user?.username?.charAt(0) || "U"}
                        </Text>
                        </View>
                    )}
                    <View style={styles.statusIndicator} />
                    </View>
                    <Text style={tailwind("ml-2 text-gray-700 font-medium")}>
                    {user?.username || "User"}
                    </Text>
                </TouchableOpacity>
            </View>
        )}
    </View>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={({ navigation, route }) => ({
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.toggleDrawer()}
            style={{
                paddingLeft: 16,
                paddingRight: 8,
                paddingTop: 8,
                paddingBottom: 8,
                marginLeft: 8
            }}
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
      <Drawer.Screen
        name="Home"
        component={Home}
        options={{
          headerTitle: "Kudos League",
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />
      <Drawer.Screen 
        name="Create Post" 
        component={CreatePost}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="add-circle-outline" size={22} color={color} />
          ),
        }} 
      />
      <Drawer.Screen 
        name="Donate" 
        component={Donate}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="heart-outline" size={22} color={color} />
          ),
        }} 
      />
      <Drawer.Screen 
        name="Search" 
        component={Search}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="search-outline" size={22} color={color} />
          ),
        }} 
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfilePage}
        options={{
          drawerIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }} 
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
    headerRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginRight: 16,
        // Add a background color to see the container bounds
        backgroundColor: 'rgba(0, 255, 0, 0.1)',
        height: 50,
      },
      profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
        // Add a background color to see the bounds
        backgroundColor: 'rgba(255, 0, 0, 0.1)',
      },
      avatarContainer: {
        position: 'relative',
        width: 32,
        height: 32,
      },
      avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
      },
      avatarPlaceholder: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F3F4F6',
      },
      avatarText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6B7280',
      },
      statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
      },
      usernameText: {
        marginLeft: 8,
        color: '#4B5563',
        fontWeight: '500',
      },
      logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        // Add a background color to see the bounds
        backgroundColor: 'rgba(0, 0, 255, 0.1)',
      },
      logoutText: {
        marginLeft: 4,
        color: '#EF4444',
        fontWeight: '500',
        fontSize: 12,
      },
      authButtonsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16,
      },
      signInButton: {
        backgroundColor: '#EBF5FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        marginRight: 8,
      },
      signInText: {
        color: '#3B82F6',
        fontWeight: '500',
        fontSize: 14,
      },
      signUpButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
      },
      signUpText: {
        color: '#FFFFFF',
        fontWeight: '500',
        fontSize: 14,
      },

  header: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
 
 });

export default DrawerNavigator;