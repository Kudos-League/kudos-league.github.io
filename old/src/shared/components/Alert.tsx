import React from "react";
import { View, Text } from "react-native";
// import { useTailwind } from "tailwind-rn";

import tailwind from "./tailwind";

interface AlertProps {
  type: "success" | "danger" | "warning" | "info";
  message: string;
}

const Alert: React.FC<AlertProps> = ({ type, message }) => {
  // const tailwind = useTailwind();

  const typeStyles = {
    success: tailwind("bg-green-500 text-white"),
    danger: tailwind("bg-red-500 text-white"),
    warning: tailwind("bg-yellow-500 text-black"),
    info: tailwind("bg-blue-500 text-white"),
  };

  return (
    <View style={[tailwind("p-4 rounded-md mb-4"), typeStyles[type]]}>
      <Text style={tailwind("text-base font-medium")}>{message}</Text>
    </View>
  );
};

export default Alert;
