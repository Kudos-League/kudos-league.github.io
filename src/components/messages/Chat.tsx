import React, { useEffect, useState } from "react";
import { getUserDetails, sendDirectMessage } from "@/shared/api/actions";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { ChannelDTO, CreateMessageDTO, MessageDTO } from "@/shared/api/types";
import DMList from "./DMList";
import ChatWindow from "./ChatWindow";

export default function ChatDashboard() {
  const { user, token } = useAuth();
  const [channels, setChannels] = useState<ChannelDTO[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { joinChannel, leaveChannel } = useWebSocket(token, messages, setMessages);

  useEffect(() => {
    if (user && token) {
      getUserDetails(user.id, token, { dmChannels: true })
        .then(res => {
          const formatted = res.dmChannels.map((channel) => {
            const otherUser = channel.users.find(u => u.id !== user.id);
            return otherUser ? { ...channel, otherUser } : null;
          }).filter(Boolean);
          setChannels(formatted);
        });
    }
  }, [user, token]);

  const openChat = async (channel: ChannelDTO) => {
    if (selectedChannel) leaveChannel(selectedChannel.id);
    joinChannel(channel.id);
    setSelectedChannel(channel);
  };

  const handleSend = async (content: string) => {
    if (!token || !selectedChannel) return;
    const receiver = selectedChannel.users.find(u => u.id !== user.id);
    if (!receiver) return;

    const payload: CreateMessageDTO = { content };
    const sent = await sendDirectMessage(receiver.id, payload, token);
    setMessages((prev) => [...prev, { ...sent, status: "sent" }] as any);
  };

  return (
    <div className="flex h-screen">
      <DMList
        channels={channels}
        onSearch={setSearchQuery}
        onSelect={openChat}
        searchQuery={searchQuery}
        selectedChannel={selectedChannel}
      />
      <ChatWindow
        user={user}
        channel={selectedChannel}
        messages={messages}
        onSend={handleSend}
        onBack={() => {
          if (selectedChannel) leaveChannel(selectedChannel.id);
          setSelectedChannel(null);
        }}
      />
    </div>
  );
}
