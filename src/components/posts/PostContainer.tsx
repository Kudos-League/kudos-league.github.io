import React from "react";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";
import Alert from "../Alert";
import type { PostDTO } from "shared/api/types";

export default function PostsContainer({ posts }: { posts: PostDTO[] }) {
  const navigate = useNavigate();

  if (!posts || posts.length === 0) {
    return <Alert type="danger" message="No posts found." />;
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          {...post}
          onPress={() => navigate(`/post/${post.id}`)}
        />
      ))}
    </div>
  );
}
