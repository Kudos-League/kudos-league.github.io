import 'dotenv/config';

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
      googlePlacesKey: process.env.REACT_APP_GOOGLE_PLACES_KEY || "",
    },
  },
};
