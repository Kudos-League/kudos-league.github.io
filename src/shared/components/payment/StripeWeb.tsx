import { useEffect, useState } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Button, View, Text, StyleSheet } from "react-native";
import { FormProvider, useForm } from "react-hook-form";
import DonationAmountPicker from "./DonationAmountPicker";

export default function StripeWeb() {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState(500);

  const formMethods = useForm();

  const fetchPublishableKey = async () => {
    try {
      console.log(
        "Attempting to fetch publishable key...",
        process.env.BACKEND_URI
      );
      const response = await fetch(
        `${process.env.BACKEND_URI}/stripe/publishable-key`
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const { publishableKey } = await response.json();
      console.log("Fetched publishableKey:", publishableKey);
      return publishableKey;
    } catch (err) {
      console.error("Failed to fetch publishable key:", err);
      setError("Failed to load Stripe publishable key. Please try again.");
    }
  };

  useEffect(() => {
    console.log("Initializing Stripe");
    const initializeStripe = async () => {
      try {
        const publishableKey = await fetchPublishableKey();
        if (!publishableKey) {
          throw new Error("Publishable key not found");
        }

        const stripeInstance = await loadStripe(publishableKey);
        if (!stripeInstance) {
          throw new Error("Failed to initialize Stripe instance");
        }

        console.log("Stripe initialized successfully:", stripeInstance);
        setStripe(stripeInstance);
        setLoading(true);
      } catch (e) {
        console.error("Error in initializeStripe:", e);
        setError("Failed to initialize Stripe. Please try again later.");
      }
    };

    initializeStripe();
  }, []);

  const handlePayment = async () => {
    if (!stripe) return;

    const response = await fetch(
      `${process.env.BACKEND_URI}/stripe/checkout-session`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: donationAmount }),
      }
    );

    const session = await response.json();
    const { error } = await stripe.redirectToCheckout({
      sessionId: session.id,
    });
    if (error) console.warn("Error with redirectToCheckout:", error);
  };

  return (
    <FormProvider {...formMethods}>
      <View style={styles.container}>
        {error && <Text>{error}</Text>}
        <Text style={styles.headerText}>Support Us with a Donation</Text>
        <DonationAmountPicker onAmountChange={setDonationAmount} />
        <Button title="Donate" disabled={!loading} onPress={handlePayment} />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  headerText: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
