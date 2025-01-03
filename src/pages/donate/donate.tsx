import { StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

import ErrorBoundary from "shared/components/ErrorBoundary";
import Stripe from "shared/components/payment";

// TODO: Show sidebar

// import globalStyles from "shared/styles";

const DonatePage = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ErrorBoundary>
          <Stripe />
        </ErrorBoundary>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  baseText: {
    fontWeight: "bold",
  },
  innerText: {
    color: "red",
  },
});

export default DonatePage;
