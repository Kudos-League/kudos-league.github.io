import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthState, updateAuth } from "redux_store/slices/auth-slice";
import { useAppDispatch } from "redux_store/hooks";
import { getUserDetails, login } from "shared/api/actions";
import { ASYNC_STORAGE_KEY__AUTH_DATA } from "shared/constants";
import { AxiosError } from "axios";
import { View, Text } from "react-native";

type AuthContextType = {
  token: string | null;
  authState: AuthState | null;
  user: UserDTO | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [userProfile, setUserProfile] = useState<UserDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  const token = authState?.token || null;

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedAuthState = await AsyncStorage.getItem(
          ASYNC_STORAGE_KEY__AUTH_DATA
        );
        if (storedAuthState) {
          const parsedAuthState: AuthState = JSON.parse(storedAuthState);
          setAuthState(parsedAuthState);
          dispatch(updateAuth(parsedAuthState));
        }
      } catch (error) {
        console.error("Failed to load auth state:", error);
      }
    };
    loadAuthState();
  }, [dispatch]);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const profile = await getUserDetails(undefined, token);
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
        }
      }
    };

    fetchUser();
  }, [token]);

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
      throw error;
    }
  };

  const logoutHandler = async () => {
    setAuthState(null);
    setUserProfile(null);
    dispatch(updateAuth({} as any));
    await AsyncStorage.removeItem(ASYNC_STORAGE_KEY__AUTH_DATA);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        authState,
        isLoggedIn: !!userProfile,
        user: userProfile,
        login: loginHandler,
        logout: logoutHandler,
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
