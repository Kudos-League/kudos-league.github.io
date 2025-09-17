import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { PostDTO, CreatePostDTO } from 'shared/api/types';

interface PostsState {
    posts: PostDTO[];
    loading: boolean;
    error: string | null;
}

const initialState: PostsState = {
    posts: [],
    loading: false,
    error: null
};

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
    const response = await apiGet<PostDTO[]>('/posts', { params: { includeSender: true, includeTags: true } });
    return response;
});

export const addNewPost = createAsyncThunk(
    'posts/addNewPost',
    async ({ post }: { post: CreatePostDTO }) => {
        return apiMutate<PostDTO, CreatePostDTO>('/posts', 'post', post, { as: 'form' });
    }
);

const postsSlice = createSlice({
    name: 'posts',
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
                state.error = action.error.message || 'Failed to fetch posts';
            })
            .addCase(addNewPost.fulfilled, (state, action) => {
                state.posts.unshift(action.payload);
            });
    }
});

export default postsSlice.reducer;
