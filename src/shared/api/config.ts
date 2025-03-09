import Constants from "expo-constants";

export enum Environment {
  LOCAL,
  DEV,
}

const BACKEND_URI = Constants.expoConfig?.extra?.backendUri ?? 'http://localhost';
const WSS_URI = Constants.expoConfig?.extra?.wssUri ?? 'ws://localhost';

// TODO: Read this from a flag or environment variable
const env: Environment = Environment.LOCAL;

export function getEndpointUrl(): string {
  return BACKEND_URI;
  switch (env) {
    case Environment.LOCAL:
      return "http://localhost:3005";
    case Environment.DEV:
      return "http://67.207.81.174:3005";
    default:
      throw new Error(`No endpoint specified for environment ${env}`);
  }
}

export function getWSSURL(): string {
  return WSS_URI;
}
