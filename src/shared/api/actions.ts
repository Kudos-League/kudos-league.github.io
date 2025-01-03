import { getEndpointUrl } from "./config";
import {
  CreatePostDTO,
  CreateUserDTO,
  PostDTO,
  UserLoginRequestSchemaDTO,
  UserLoginResponseDTO,
} from "./types";
import axios from "axios";

/**
 * Converts a DTO object into a FormData object.
 * Supports nested fields and array data types.
 */
function toFormData(dto: Record<string, any>): FormData {
  const formData = new FormData();

  for (const key in dto) {
    const value = dto[key];

    if (Array.isArray(value)) {
      value.forEach((v) => formData.append(`${key}[]`, v));
    } else {
      formData.append(key, value);
    }
  }

  return formData;
}

// TODO: Type all request/response values if/when we factor API types into a codebase shared by FE/BE

/** @throws {AxiosError} */
export async function createPost(request: CreatePostDTO, token: string) {
  const formData = toFormData(request);
  const response = await axios.post(`${getEndpointUrl()}/posts`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

/** @throws {AxiosError} */
export async function register(
  request: CreateUserDTO
): Promise<{ data: UserLoginResponseDTO }> {
  return await axios.post(`${getEndpointUrl()}/users/register`, request);
}

/** @throws {AxiosError} */
export async function login(
  request: UserLoginRequestSchemaDTO
): Promise<{ data: UserLoginResponseDTO }> {
  return await axios.post(`${getEndpointUrl()}/users/login`, request);
}

/** @throws {AxiosError} */
export async function getPosts(): Promise<PostDTO[]> {
  return await axios.get(`${getEndpointUrl()}/posts`);
}
