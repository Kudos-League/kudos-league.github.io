// TODO Delete and replace with Redux once AsyncStorage integration is complete
import { createContext } from "react";

export const TokenContext = createContext<string|null>(null);