import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { Events } from 'shared/constants';
import { MessageDTO } from 'shared/api/types';

export const useWebSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);

  useEffect(() => {
    if (!token) return;

    const newSocket: Socket = io(getWSSURL(), {
      transports: ['websocket'],
      query: { token },
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinChannel = (channelID: number) => {
    if (socket) {
      socket.emit('joinChannel', { channelID });
      console.log(`Joined channel ${channelID}`);

      socket.off(Events.MESSAGE_CREATE);
      socket.on(Events.MESSAGE_CREATE, (newMessage: MessageDTO) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });
    }
  };

  const leaveChannel = (channelID: number) => {
    if (socket) {
      socket.emit('leaveChannel', { channelID });
      console.log(`Left channel ${channelID}`);
    }
  };

  return { socket, messages, joinChannel, leaveChannel };
};
