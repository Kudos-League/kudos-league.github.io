import { View, Text } from "react-native";

import globalStyles from "shared/styles";
import Search from "shared/components/Search";

export default function SignIn() {
  return (
    <View style={globalStyles.container}>
      <Search />
    </View>
  );
}