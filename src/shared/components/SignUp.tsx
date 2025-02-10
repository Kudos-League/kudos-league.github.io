import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "shared/hooks/useAuth";
import Input from "shared/components/forms/input";

type SignUpFormProps = {
  onSuccess?: () => void;
  onError?: (errorMessage: string) => void;
};

type SignUpFormValues = {
  username: string;
  email: string;
  password: string;
  confirmedPassword: string;
};

export default function SignUpForm({ onSuccess, onError }: SignUpFormProps) {
  const { register } = useAuth();
  const form = useForm<SignUpFormValues>({ mode: "onChange" });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const password = form.watch("password");

  const onSubmit = async (data: SignUpFormValues) => {
    setErrorMessage(null);
    try {
      await register(data.username, data.email, data.password);
      onSuccess?.();
      navigation.navigate("Home", { screen: "Feed" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign-up failed. Try again.";
      setErrorMessage(message);
      onError?.(message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <View style={{ marginBottom: 15 }}>
        <Input
          name="username"
          label="Username"
          form={form}
          registerOptions={{ required: true }}
        />
      </View>
      <View style={{ marginBottom: 15 }}>
        <Input
          name="email"
          label="Email"
          form={form}
          registerOptions={{ required: true }}
        />
      </View>
      <View style={{ marginBottom: 15 }}>
        <Input
          name="password"
          label="Password"
          form={form}
          registerOptions={{ required: true }}
          type="password"
        />
      </View>
      <View style={{ marginBottom: 15 }}>
        <Input
          name="confirmedPassword"
          label="Confirm Password"
          form={form}
          registerOptions={{
            validate: (value) => value === password || "Passwords do not match",
          }}
          type="password"
        />
      </View>
      <View style={{ marginBottom: 15 }}>
        <Button
          onPress={form.handleSubmit(onSubmit)}
          disabled={!form.formState.isValid}
          mode="contained"
        >
          Sign Up
        </Button>
      </View>
      {errorMessage && (
        <View style={{ marginBottom: 15 }}>
          <Text style={{ color: "red" }}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}
