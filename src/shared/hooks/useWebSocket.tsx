import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { getWSSURL } from 'shared/api/config';
import { Events } from 'shared/constants';
import { getMessages } from 'shared/api/actions';
import { MessageDTO } from 'shared/api/types';

export const useWebSocket = (
  token: string | null,
  messages: MessageDTO[],
  setMessages: React.Dispatch<React.SetStateAction<MessageDTO[]>>
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!token) {
      console.warn('[WebSocket] No token provided, skipping socket connection');
      return;
    }

    const newSocket: Socket = io(getWSSURL(), {
      transports: ['websocket', 'polling'],
      query: { token },
      withCredentials: true,
      rejectUnauthorized: false
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      clearPolling();
    });

    newSocket.on('connect_error', (err) => {
      console.error('[WebSocket] Connection error:', err);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('error', (err) => {
      console.error('[WebSocket] Socket error:', err);
    });

    return () => {
      console.log('[WebSocket] Cleaning up');
      newSocket.disconnect();
      clearPolling();
    };
  }, [token]);

  const clearPolling = () => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  };

  const joinChannel = (channelID: number) => {
    if (!token) {
      console.warn('[WebSocket] No token available');
      return;
    }

    if (!socket || !isConnected) {
      console.warn('[WebSocket] Fallback to polling messages every 5s');

      clearPolling();
      pollInterval.current = setInterval(async () => {
        try {
          const freshMessages = await getMessages(channelID, token);
          setMessages(freshMessages.data);
        } catch (err) {
          console.error('[Polling] Failed to fetch messages:', err);
        }
      }, 5000);

      return;
    }

    clearPolling(); 

    console.log(`[WebSocket] Joining channel ${channelID}`);
    socket.emit('joinChannel', { channelID });

    socket.off('joinedChannel');
    socket.on('joinedChannel', (data) => {
      if (data.channelID === channelID && data.success) {
        console.log(`[WebSocket] Successfully joined channel ${channelID}`);
      }
    });

    socket.off(Events.MESSAGE_CREATE);
    socket.on(Events.MESSAGE_CREATE, (newMessage: MessageDTO) => {
      console.log(`[WebSocket] New message in channel ${channelID}`, newMessage);
      setMessages((prev) => [...prev, newMessage]);
    });
  };

  const leaveChannel = (channelID: number) => {
    if (socket) {
      console.log(`[WebSocket] Leaving channel ${channelID}`);
      socket.emit('leaveChannel', { channelID });
    }
    clearPolling();
  };

  return { socket, messages, joinChannel, leaveChannel };
};
