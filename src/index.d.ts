interface Post {
  _id: string;
  sender: {
    id: string;
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
}
