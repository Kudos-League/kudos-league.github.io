import { Platform, Text } from "react-native";
import React, { Suspense } from "react";

const StripeNative = React.lazy(() => import("./StripeNative"));
const StripeWeb = React.lazy(() => import("./StripeWeb"));

export default function StripeWrapper() {
  const Stripe = Platform.select({
    ios: () => <StripeNative />,
    android: () => <StripeNative />,
    web: () => <StripeWeb />,
  });

  return (
    <Suspense fallback={<Text>Loading Stripe...</Text>}>
      {Stripe ? Stripe() : <Text>Platform not supported</Text>}
    </Suspense>
  );
}
