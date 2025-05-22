import React, { useState } from "react";
import Message from "./Message";
import { CreateMessageDTO, MessageDTO } from "@/shared/api/types";
import { sendMessage } from "@/shared/api/actions";
import { useAuth } from "@/hooks/useAuth";
import { useAppSelector } from "redux_store/hooks";

interface Props {
  messages: MessageDTO[];
  title?: string;
  callback?: (data: any) => void;
  postID?: number;
  showSendMessage?: boolean;
}

const MessageList: React.FC<Props> = ({ messages, title, callback, postID, showSendMessage }) => {
  const { user } = useAuth();
  const token = useAppSelector((state) => state.auth.token);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [messageContent, setMessageContent] = useState("");

  const handleSubmitMessage = async () => {
    if (!messageContent.trim() || !user || !token || !postID) return;

    const newMessage: CreateMessageDTO = {
      content: messageContent,
      authorID: user.id,
      postID,
    };

    try {
      const response = await sendMessage(newMessage, token);
      callback?.(response);
      setMessageContent("");
    } catch (err) {
      console.error("Send failed:", err);
    }
  };

  const displayedMessages = showAllMessages ? messages : messages.slice(0, 3);

  return (
    <div>
      {title && <h2 className="text-lg font-bold mb-3">{title}</h2>}

      <div className="max-h-72 overflow-y-auto mb-3">
        {messages.length === 0 && (
          <p className="text-red-500 text-sm mb-2">No comments yet</p>
        )}
        {displayedMessages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>

      {showSendMessage && (
        <div className="flex border-t pt-3 items-center gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            value={messageContent}
            onChange={(e) => setMessageContent(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-full"
          />
          <button
            onClick={handleSubmitMessage}
            className="bg-blue-600 text-white px-3 py-2 rounded-full"
          >
            ➤
          </button>
        </div>
      )}

      {messages.length > 3 && !showAllMessages && (
        <button
          onClick={() => setShowAllMessages(true)}
          className="mt-3 px-4 py-2 bg-gray-700 text-white rounded"
        >
          Show more messages
        </button>
      )}
    </div>
  );
};

export default MessageList;
