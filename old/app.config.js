import * as dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === "development" ? "./.env.dev" : "./.env";
dotenv.config({ path: envFile });

export default {
  expo: {
    name: "KudosLeague",
    slug: "KudosLeague",
    scheme: "https",
    userInterfaceStyle: "automatic",
    web: {
      bundler: "webpack",
    },
    extra: {
      backendUri: process.env.REACT_APP_BACKEND_URI || "http://localhost",
      googleMapsKey: process.env.REACT_APP_GOOGLE_MAPS_KEY || "",
      wssUri: process.env.REACT_APP_WSS_URI || "http://localhost:3001",
    },
  },
};
