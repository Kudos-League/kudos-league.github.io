import { StripeProvider, useStripe } from "@stripe/stripe-react-native";
import { useState, useEffect } from "react";
import { Button, View, Text, StyleSheet, Alert } from "react-native";
import { FormProvider, useForm } from "react-hook-form";
import DonationAmountPicker from "./DonationAmountPicker";

export default function StripeNative() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [publishableKey, setPublishableKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState(500);

  const formMethods = useForm();

  const fetchPaymentSheetParams = async () => {
    try {
      const response = await fetch(
        `${process.env.BACKEND_URI}/stripe/payment-sheet`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: donationAmount }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const { paymentIntent, ephemeralKey, customer, publishableKey } =
        await response.json();
      setPublishableKey(publishableKey);
      return { paymentIntent, ephemeralKey, customer };
    } catch (err) {
      console.error("Failed to fetch payment sheet parameters:", err);
      setError("Failed to load payment details. Please try again.");
      return null;
    }
  };

  const initializePaymentSheet = async () => {
    const params = await fetchPaymentSheetParams();
    if (!params) return;

    const { paymentIntent, ephemeralKey, customer } = params;
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: paymentIntent,
      customerId: customer,
      customerEphemeralKeySecret: ephemeralKey,
      merchantDisplayName: "Your Business Name",
      allowsDelayedPaymentMethods: true,
    });

    if (error) {
      setError(`Initialization error: ${error.message}`);
      console.error("Error in initPaymentSheet:", error);
    } else {
      setLoading(true);
    }
  };

  const openPaymentSheet = async () => {
    const { error } = await presentPaymentSheet();
    if (error) {
      Alert.alert(`Payment failed: ${error.message}`);
      console.warn("Error with presentPaymentSheet:", error);
    } else {
      Alert.alert("Thank you for your donation!");
    }
  };

  useEffect(() => {
    initializePaymentSheet();
  }, []);

  return (
    <StripeProvider publishableKey={publishableKey || ""}>
      <FormProvider {...formMethods}>
        <View style={styles.container}>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Text style={styles.headerText}>Support Us with a Donation</Text>
          <DonationAmountPicker onAmountChange={setDonationAmount} />
          <Button
            title="Donate"
            disabled={!loading}
            onPress={openPaymentSheet}
          />
        </View>
      </FormProvider>
    </StripeProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  errorText: { color: "red", marginBottom: 10 },
});
