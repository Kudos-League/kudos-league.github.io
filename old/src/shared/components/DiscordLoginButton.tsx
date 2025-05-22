import { Platform, TouchableOpacity, Text, StyleSheet } from 'react-native';
import * as Linking from 'expo-linking';
import { getEndpointUrl } from 'shared/api/config';

export default function DiscordLoginButton() {
  const handleDiscordLogin = () => {
    const discordLoginUrl = `${getEndpointUrl()}/users/discord`;

    if (Platform.OS === 'web') {
      window.location.href = discordLoginUrl;
    } else {
      Linking.openURL(discordLoginUrl);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleDiscordLogin}>
      <Text style={styles.text}>D</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7289DA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
});
