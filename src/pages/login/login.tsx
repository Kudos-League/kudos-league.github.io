import React from "react";
import Login from "shared/components/Login";
import { useNavigation } from "@react-navigation/native";

export default function LoginPage() {
  const navigation = useNavigation<any>();
  return (
    <Login
      onSuccess={() => {
        navigation.navigate("Home", { screen: "Feed" });
      }}
      onError={console.error}
    />
  );
}
