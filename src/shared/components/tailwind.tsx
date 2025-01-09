import { create } from "tailwind-rn";

import utilities from "../../../tailwind.json";

// @ts-ignore
const tailwind = create(utilities); // ! Do not ask me about this, it's in the docs - https://www.npmjs.com/package/tailwind-rn/v/3.0.1#3-create-a-custom-tailwind-function

export default tailwind;
