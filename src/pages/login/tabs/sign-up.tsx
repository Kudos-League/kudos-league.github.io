import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useNavigation } from "@react-navigation/native";

import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";

import AsyncStorage from "@react-native-async-storage/async-storage";

import globalStyles from "shared/styles";
import Input from "shared/components/forms/input";
import { register } from "shared/api/actions";
import { CreateUserDTO, UserLoginResponseDTO } from "shared/api/types";

import { useAppDispatch } from "redux_store/hooks";

import { AuthState, updateAuth } from "redux_store/slices/auth-slice";
import { AxiosError } from "axios";
import { ASYNC_STORAGE_KEY__AUTH_DATA } from "shared/constants";

export default function SignUp() {
  const dispatch = useAppDispatch();
  const form: UseFormReturn<SignUpFormValues> = useForm<SignUpFormValues>();
  const navigation = useNavigation<any>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formIssues, setFormIssues] = useState<FormIssues | null>(null);

  const password = form.watch("password");

  const onInvalid = (e) => {
    // TODO: Handle invalid submission (I'm not sure if this is a real case)
    console.error(e);
  };

  function handleError(error: AxiosError) {
    const serverMessage = (error.response?.data as any)?.message;
    switch (typeof serverMessage) {
      case "string":
        setErrorMessage(serverMessage);
        return;
      case "object":
        const issues = (serverMessage as any).issues;
        if (Array.isArray(issues)) {
          const newFormIssues: Partial<FormIssues> = {};
          for (const issue of issues) {
            const registrationField = registrationFieldByPath[issue.path[0]];
            newFormIssues[registrationField] = issue.message;
          }
          setFormIssues(newFormIssues);
        } else {
          console.error(error);
          setErrorMessage("There was an unrecognized error. Try again later");
        }
        return;
    }
  }

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

  async function onSubmit({ username, email, password }: CreateUserDTO) {
    setErrorMessage(null);
    setFormIssues(null);
    try {
      // TODO: Switch this to a Thunk
      const response = await register({ username, email, password });
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
          name="email"
          label="Email"
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
        <Input
          name="confirmedPassword"
          label="Confirm Password"
          form={form}
          registerOptions={{ validate: (value) => value === password }}
          type="password"
        />
      </View>
      <View style={globalStyles.formRow}>
        <Button
          onPress={form.handleSubmit(onSubmit, onInvalid)}
          disabled={!form.formState.isValid}
          mode="contained"
        >
          Sign Up
        </Button>
      </View>
      {errorMessage && (
        <View style={globalStyles.formRow}>
          <Text style={globalStyles.errorMessage}>{errorMessage}</Text>
        </View>
      )}
      {formIssues && (
        <View>
          <Text style={globalStyles.errorMessage}>
            Some fields were invalid
          </Text>
          <List style={globalStyles.errorMessage}>
            {Object.entries(formIssues).map(([field, issue]) => (
              <ListItem key={field}>
                {field}: {issue}
              </ListItem>
            ))}
          </List>
        </View>
      )}
    </View>
  );
}

export type SignUpFormValues = {
  username: string;
  email: string;
  password: string;
  confirmedPassword: string;
};
type RegistrationField = "Email" | "Password" | "Username";
type FormIssues = Partial<Record<RegistrationField, string>>;
const registrationFieldByPath: Record<string, RegistrationField> = {
  email: "Email",
  password: "Password",
  username: "Username",
};
