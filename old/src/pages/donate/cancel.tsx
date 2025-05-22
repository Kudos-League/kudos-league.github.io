import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRoute } from "@react-navigation/native";
import PaymentStatusListener from "shared/components/payment/Paymentstatus";

// TODO: Show sidebar

export default function CancelPage() {
  const route = useRoute();
  const initialErrorMessage =
    (route.params as any)?.error || "Payment was canceled.";
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Payment Canceled</Text>
      <Text>{errorMessage}</Text>

      <PaymentStatusListener onStatusUpdate={setErrorMessage} />
    </View>
  );
}
