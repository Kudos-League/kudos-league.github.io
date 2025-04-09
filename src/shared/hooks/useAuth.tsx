import React, { createContext, useState, useEffect, useContext } from "react";
import * as Linking from 'expo-linking';
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthState, updateAuth } from "redux_store/slices/auth-slice";
import { useAppDispatch } from "redux_store/hooks";
import { getUserDetails, login, register } from "shared/api/actions";
import { ASYNC_STORAGE_KEY__AUTH_DATA } from "shared/constants";
import { AxiosError } from "axios";
import { View, Text, Platform } from "react-native";
import { UserDTO } from "index";

type AuthContextType = {
  token: string | null;
  authState: AuthState | null;
  user: UserDTO | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [userProfile, setUserProfile] = useState<UserDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();

  const token = authState?.token || null;

  const storeTokenAndFetchProfile = async (token: string) => {
    const newAuthState: AuthState = {
      token,
      tokenTimestamp: Date.now(),
      username: '',
    };
  
    setAuthState(newAuthState);
    dispatch(updateAuth(newAuthState));
    await AsyncStorage.setItem(ASYNC_STORAGE_KEY__AUTH_DATA, JSON.stringify(newAuthState));
  
    const profile = await getUserDetails(undefined, token);
    setUserProfile(profile);
  };  

  const loginHandler = async (username: string, password: string) => {
    setErrorMessage(null);
    try {
      const response = await login({ username, password });
      const newAuthState: AuthState = {
        token: response.data.token,
        username: response.data.user.username,
        tokenTimestamp: Date.now(),
      };
      setAuthState(newAuthState);
      dispatch(updateAuth(newAuthState));
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY__AUTH_DATA,
        JSON.stringify(newAuthState)
      );
    } catch (error) {
      const serverMessage = (error as AxiosError<{ message: string }>)?.response
        ?.data?.message;
      setErrorMessage(
        typeof serverMessage === "string"
          ? serverMessage
          : "Login failed. Please try again."
      );
      console.error("Login failed:", error);
      await AsyncStorage.removeItem(ASYNC_STORAGE_KEY__AUTH_DATA);
      setAuthState(null);
      dispatch(updateAuth({} as any));
  
      throw error;
    }
  };
  
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const profile = await getUserDetails('me', token);
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          await AsyncStorage.removeItem(ASYNC_STORAGE_KEY__AUTH_DATA);
          setAuthState(null);
          dispatch(updateAuth({} as any));
        }
      }
    };
  
    fetchUser();
  }, [token]);

  // Check on new page load if token is already stored
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        let token: string | null = null;
  
        if (initialUrl) {
          const urlObj = new URL(initialUrl);
          token = urlObj.searchParams.get("token");
  
          if (token && Platform.OS === 'web') {
            window.history.replaceState({}, '', '/');
          }
        }
  
        if (!token) {
          const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY__AUTH_DATA);
          if (stored) {
            const parsed: AuthState = JSON.parse(stored);
            token = parsed.token;
          }
        }
  
        if (token) {
          await storeTokenAndFetchProfile(token);
        }
      } catch (err) {
        console.error("Failed to initialize auth:", err);
      } finally {
        setLoading(false);
      }
    };
  
    initializeAuth();
  
    const handleDeepLink = async (event: Linking.EventType) => {
      const urlObj = new URL(event.url);
      const token = urlObj.searchParams.get("token");
  
      if (token) {
        await storeTokenAndFetchProfile(token);
      }
    };
  
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);  

  const logoutHandler = async () => {
    setAuthState(null);
    setUserProfile(null);
    dispatch(updateAuth({} as any));
    await AsyncStorage.removeItem(ASYNC_STORAGE_KEY__AUTH_DATA);
  };

  const signUpHandler = async (
    username: string,
    email: string,
    password: string
  ) => {
    try {
      const response = await register({ username, email, password });
      await loginHandler(username, password);
    } catch (error) {
      throw new Error("Sign-up failed. Please try again.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        authState,
        isLoggedIn: !!userProfile,
        user: userProfile,
        loading,
        login: loginHandler,
        logout: logoutHandler,
        register: signUpHandler,
      }}
    >
      {children}
      {errorMessage && (
        <View style={{ padding: 10, backgroundColor: "red" }}>
          <Text style={{ color: "white" }}>{errorMessage}</Text>
        </View>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
