import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { View, Text, TextInput, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "shared/hooks/useAuth";
import Input from "shared/components/forms/input";

type LoginFormProps = {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
};

type FormValues = {
  username: string;
  password: string;
};

export default function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { login, token, logout } = useAuth();
  const form = useForm<FormValues>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const onSubmit = async (data: FormValues) => {
    setErrorMessage(null);
    try {
      await login(data.username, data.password);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Login failed. Please try again.";
      setErrorMessage(message);
      onError?.(message);
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
      <View style={styles.container}>
        <Text>You are logged in.</Text>
        <Button onPress={handleLogout} mode="contained">
          Log Out
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.formRow}>
        <Input
          name="username"
          label="Username"
          form={form}
          registerOptions={{ required: true }}
        />
      </View>
      <View style={styles.formRow}>
        <Input
          name="password"
          label="Password"
          form={form}
          registerOptions={{ required: true }}
          type="password"
        />
      </View>
      <View style={styles.formRow}>
        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid}
          mode="contained"
        >
          Sign In
        </Button>
      </View>
      {errorMessage && (
        <View style={styles.formRow}>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  formRow: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
  },
  errorMessage: {
    color: "red",
    marginBottom: 10,
  },
  submitButton: {
    marginTop: 10,
  },
});
