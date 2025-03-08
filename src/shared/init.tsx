import { UIManager, Platform } from 'react-native';

if (Platform.OS === 'web' && typeof UIManager.hasViewManagerConfig !== 'function') {
  UIManager.hasViewManagerConfig = () => false;
}
