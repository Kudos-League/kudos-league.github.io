import Constants from "expo-constants";

export enum Environment {
  LOCAL,
  DEV,
}

const BACKEND_URI = Constants.expoConfig?.extra?.backendUri ?? 'http://localhost';
const WSS_URI = Constants.expoConfig?.extra?.wssUri ?? 'ws://localhost:3001';


export function getEndpointUrl(): string {
  return BACKEND_URI;
}

export function getWSSURL(): string {
  const isHttps = BACKEND_URI.startsWith('https://');
  return isHttps ? WSS_URI.replace('ws://', 'wss://') : WSS_URI;
}
