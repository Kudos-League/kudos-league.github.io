import React from "react";
import { View } from "react-native";
import SignUpForm from "shared/components/SignUp";

export default function SignUpScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center"}}>
      <SignUpForm />
    </View>
  );
}
