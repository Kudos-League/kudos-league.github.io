import { useAppDispatch, useAppSelector } from "redux_store/store";
import { fetchPosts, addNewPost } from "redux_store/slices/posts-slice";
import { CreatePostDTO } from "shared/api/types";

export const usePosts = () => {
  const dispatch = useAppDispatch();
  const posts = useAppSelector((state) => state.posts.posts);
  const loading = useAppSelector((state) => state.posts.loading);
  const error = useAppSelector((state) => state.posts.error);

  return {
    posts,
    loading,
    error,
    fetchPosts: () => dispatch(fetchPosts()),
    addPost: (post: CreatePostDTO, token: string) =>
      dispatch(addNewPost({ post, token })),
  };
};
