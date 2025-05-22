import { StyleSheet } from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";

import Stripe from "shared/components/payment/Stripe"; //FIXME

// TODO: Show sidebar

// import globalStyles from "shared/styles";

const DonatePage = () => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Stripe />
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
