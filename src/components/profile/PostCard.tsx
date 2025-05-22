import React from "react";
import { useNavigate } from "react-router-dom";
import type { PostDTO } from "shared/api/types";

interface Props {
  post: PostDTO;
}

const PostCard: React.FC<Props> = ({ post }) => {
  const navigate = useNavigate();

  return (
    <div
      className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer relative"
      onClick={() => navigate(`/post/${post.id}`)}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold text-gray-800">{post.title}</h2>
        <span
          className={`text-xs px-2 py-1 rounded-full text-white ${
            post.type === "gift" ? "bg-green-500" : "bg-blue-500"
          }`}
        >
          {post.type === "gift" ? "Gift" : "ReQuest"}
        </span>
      </div>

      {post.images && post.images.length > 0 ? (
        <img
          src={post.images[0]}
          alt="post"
          className="w-full h-40 object-cover rounded mb-3"
        />
      ) : (
        <p className="text-gray-600 text-sm mb-3">{post.body.slice(0, 100)}...</p>
      )}

      <div className="text-sm text-gray-500">
        {post.isActive ? (
          <span className="text-green-600 font-semibold">Active</span>
        ) : (
          `${post.kudos} Kudos`
        )}
      </div>
    </div>
  );
};

export default PostCard;
