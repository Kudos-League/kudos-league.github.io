import React, { useEffect, useState, useRef } from "react";
import {
  getMessages,
  getPublicChannels,
  sendMessage as sendChatMessage,
} from "@/shared/api/actions";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ChannelDTO, MessageDTO } from "@/shared/api/types";

export default function PublicChat() {
  const { token } = useAuth();
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { joinChannel, leaveChannel } = useWebSocket(token, messages, setMessages);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const fetchChannels = async () => {
      if (!token) return;

      try {
        const publicChannels = await getPublicChannels(token);
        setChannels(publicChannels);
        if (publicChannels.length > 0 && !selectedChannel) {
          selectChannel(publicChannels[0]);
        }
      } catch (error) {
        console.error("Error fetching public channels:", error);
      }
    };

    fetchChannels();
  }, []);

  const selectChannel = async (channel: ChannelDTO) => {
    setSelectedChannel(channel);
    setLoading(true);
    if (!token) return;

    try {
      const messagesData = await getMessages(channel.id, token);
      setMessages(messagesData);

      if (selectedChannel && selectedChannel.id !== channel.id) {
        leaveChannel(selectedChannel.id);
      }

      joinChannel(channel.id);
    } catch (error) {
      console.error("Error selecting channel:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!token || !messageInput.trim() || !selectedChannel) return;

    try {
      const newMessage = await sendChatMessage(
        { channelID: selectedChannel.id, content: messageInput },
        token
      );
      setMessages((prevMessages) => [...prevMessages, newMessage] as any);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Left: Channel List */}
      <div className="w-48 border-r overflow-y-auto bg-gray-100 p-3">
        {channels.map((channel) => (
          <button
            key={channel.id}
            onClick={() => selectChannel(channel)}
            className={`block w-full text-left px-3 py-2 mb-1 rounded ${
              selectedChannel?.id === channel.id
                ? "bg-blue-100 font-semibold text-blue-800"
                : "hover:bg-gray-200"
            }`}
          >
            {channel.name}
          </button>
        ))}
      </div>

      {/* Right: Chat Window */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b p-4 text-center font-bold text-lg">
          {selectedChannel ? selectedChannel.name : "Select a Public Chat"}
        </div>

        {/* Message List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50"
        >
          {loading ? (
            <div className="text-center text-gray-500 mt-4">Loading...</div>
          ) : messages.length === 0 ? (
            <p className="text-center text-gray-400 italic">
              No messages in this channel.
            </p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="text-sm">
                <strong className="text-gray-800">{msg.author?.username}: </strong>
                <span className="text-gray-700">{msg.content}</span>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        {selectedChannel && (
          <div className="border-t p-3 flex items-center">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded px-3 py-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
