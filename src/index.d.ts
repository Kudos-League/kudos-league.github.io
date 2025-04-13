import { CategoryDTO, LocationDTO } from "shared/api/types";
import { MapCoordinates } from "shared/components/Map";

interface Post {
  id: string;
  sender: {
    id: string; //TODO: number?
    email: string;
    username: string;
    kudos: number;
    avatar: string | null;
  };
  rewardOffer: {
    kudos: number;
    status: string;
    body: string;
    kudosFinal: number;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  tags: Tag[];
  location: LocationDTO;
  title: string;
  type: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  status: string;
  kudos: number; // TODO: Get this from post
  rewardOffers: any[]; // TODO
  messages: any[]; // TODO
  location: any; // TODO
  handshakes: any[]; // TODO
  images: string[]; // TODO
  category: CategoryDTO;
}

interface Badge {
  id: number;
  name: string;
  image: string;
}

interface UserDTO {
  id: number;
  username: string;
  email: string;
  avatar?: string | null;
  kudos: number;
  isEmailVerified?: boolean;
  password?: string | null;
  locationID: number | null;
  badges: Badge[]
  location?: MapCoordinates;
}
