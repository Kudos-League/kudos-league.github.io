import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";

import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";
import { login } from "shared/api/actions";
import { UserLoginResponseDTO } from "shared/api/types";

import { useAppDispatch } from "redux_store/hooks";

import { AuthState, updateAuth } from "redux_store/slices/auth-slice";
import { AxiosError } from "axios";
import { ASYNC_STORAGE_KEY__AUTH_DATA } from "shared/constants";

export default function SignIn() {
  const dispatch = useAppDispatch();
  const form: UseFormReturn<UserLoginFormValues> =
    useForm<UserLoginFormValues>();
  const navigation = useNavigation<any>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSuccess(response: { data: UserLoginResponseDTO }) {
    const authState: AuthState = {
      token: response.data.token,
      username: response.data.user.username,
      tokenTimestamp: Date.now(),
    };
    dispatch(updateAuth(authState));
    navigation.navigate("Home", { screen: "Feed" });
    try {
      await AsyncStorage.setItem(
        ASYNC_STORAGE_KEY__AUTH_DATA,
        JSON.stringify(authState)
      );
    } catch (e) {
      console.error(
        `Failed to save auth data to persist between sessions. Error: ${e}`
      );
    }
  }

  async function handleError(error: AxiosError) {
    const serverMessage = (error.response?.data as any)?.message;
    setErrorMessage(
      typeof serverMessage === "string"
        ? serverMessage
        : "Login failed. Please try again."
    );
  }

  async function onSubmit({ username, password }) {
    setErrorMessage(null);
    try {
      // TODO: Switch this to a Thunk
      const response = await login({ username, password });
      await handleSuccess(response);
    } catch (e) {
      handleError(e);
    }
  }

  return (
    <View style={globalStyles.container}>
      <View style={globalStyles.formRow}>
        <Input
          name="username"
          label="Username"
          form={form}
          registerOptions={{ required: true }}
        />
      </View>
      <View style={globalStyles.formRow}>
        <Input
          name="password"
          label="Password"
          form={form}
          registerOptions={{ required: true }}
          type="password"
        />
      </View>
      <View style={globalStyles.formRow}>
        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid}
          mode="contained"
        >
          Sign In
        </Button>
      </View>
      {errorMessage && (
        <View style={globalStyles.formRow}>
          <Text style={globalStyles.errorMessage}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

export type UserLoginFormValues = {
  username: string;
  password: string;
};
