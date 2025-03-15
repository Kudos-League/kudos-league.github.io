import Constants from "expo-constants";

export enum Environment {
  LOCAL,
  DEV,
}

const BACKEND_URI = Constants.expoConfig?.extra?.backendUri ?? 'http://localhost';
const WSS_URI = Constants.expoConfig?.extra?.wssUri ?? 'ws://localhost';


export function getEndpointUrl(): string {
  return BACKEND_URI;
}

export function getWSSURL(): string {
  return WSS_URI;
}
