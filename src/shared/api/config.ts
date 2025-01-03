export enum Environment {
  LOCAL,
  DEV,
}

// TODO: Read this from a flag or environment variable
const env: Environment = Environment.LOCAL;

export function getEndpointUrl(): string {
  return process.env.BACKEND_URI || "https://localhost";
  switch (env) {
    case Environment.LOCAL:
      return "http://localhost:3005";
    case Environment.DEV:
      return "http://67.207.81.174:3005";
    default:
      throw new Error(`No endpoint specified for environment ${env}`);
  }
}
