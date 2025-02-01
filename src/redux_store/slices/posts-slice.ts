import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getPosts, createPost } from "shared/api/actions";
import { PostDTO, CreatePostDTO } from "shared/api/types";

interface PostsState {
  posts: PostDTO[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

export const fetchPosts = createAsyncThunk("posts/fetchPosts", async () => {
  const response = await getPosts({ includeSender: true, includeTags: true });
  return response.data;
});

export const addNewPost = createAsyncThunk(
  "posts/addNewPost",
  async ({ post, token }: { post: CreatePostDTO; token: string }) => {
    return createPost(post, token);
  }
);

const postsSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch posts";
      })
      .addCase(addNewPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      });
  },
});

export default postsSlice.reducer;
