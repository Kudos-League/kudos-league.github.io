import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Home from './search';
import User from './entities/user';
import Post from './entities/post';

const Stack = createNativeStackNavigator();

export default function Search() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="User" component={User} />
      <Stack.Screen name="Post" component={Post} />
    </Stack.Navigator>
  );
}