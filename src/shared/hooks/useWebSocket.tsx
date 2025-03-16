import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { Events } from 'shared/constants';
import { MessageDTO } from 'shared/api/types';

export const useWebSocket = (token: string | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);

  useEffect(() => {
    if (!token) {
      console.warn('[WebSocket] No token provided, skipping connection');
      return;
    }

    console.log('[WebSocket] Connecting to', getWSSURL());

    const newSocket: Socket = io(getWSSURL(), {
      transports: ['websocket'],
      query: { token },
    });

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[WebSocket] Disconnected:', reason);
    });

    newSocket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
    });

    setSocket(newSocket);

    return () => {
      console.log('[WebSocket] Disconnecting...');
      newSocket.disconnect();
    };
  }, [token]);

  const joinChannel = (channelID: number) => {
    if (!socket) {
      console.warn('[WebSocket] Cannot join channel, socket not initialized');
      return;
    }

    console.log(`[WebSocket] Joining channel ${channelID}`);
    socket.emit('joinChannel', { channelID });

    socket.off(Events.MESSAGE_CREATE);
    socket.on(Events.MESSAGE_CREATE, (newMessage: MessageDTO) => {
      console.log(`[WebSocket] Received message in channel ${channelID}:`, newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });
  };

  const leaveChannel = (channelID: number) => {
    if (!socket) {
      console.warn('[WebSocket] Cannot leave channel, socket not initialized');
      return;
    }

    console.log(`[WebSocket] Leaving channel ${channelID}`);
    socket.emit('leaveChannel', { channelID });
  };

  return { socket, messages, joinChannel, leaveChannel };
};
