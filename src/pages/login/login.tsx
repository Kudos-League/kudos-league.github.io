import React, { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";

import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";
import { useAuth } from "../../shared/hooks/useAuth";

export default function SignIn() {
  const { login, logout, token } = useAuth();
  const form: UseFormReturn<UserLoginFormValues> =
    useForm<UserLoginFormValues>();
  const navigation = useNavigation<any>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async ({ username, password }: UserLoginFormValues) => {
    setErrorMessage(null);
    try {
      await login(username, password);
      navigation.navigate("Home", { screen: "Feed" });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login failed");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate("SignIn");
    } catch (error) {
      setErrorMessage("Failed to log out. Please try again.");
    }
  };

  if (token) {
    return (
      <View style={globalStyles.container}>
        <Text>You are logged in.</Text>
        <Button onPress={handleLogout} mode="contained">
          Log Out
        </Button>
      </View>
    );
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
