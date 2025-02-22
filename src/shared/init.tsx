import { UIManager } from 'react-native';

if (!UIManager.hasViewManagerConfig) {
  UIManager.hasViewManagerConfig = (viewName: string) => {
    return false;
  };
}
