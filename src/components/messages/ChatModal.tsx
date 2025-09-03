import React, { useEffect, useRef, useState } from 'react';
import {
    getMessages,
    getUserDetails,
    sendDirectMessage
} from 'shared/api/actions';
import { useAppSelector } from 'redux_store/hooks';
import { useAuth } from '@/contexts/useAuth';
// import { useWebSocket } from '@/hooks/useWebSocket';
import {
    ChannelDTO,
    CreateMessageDTO,
    MessageDTO,
    UserDTO
} from '@/shared/api/types';
import Button from '../common/Button';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import TextWithLinks from '../common/TextWithLinks';

interface ChatModalProps {
    isChatOpen: boolean;
    setIsChatOpen: (open: boolean) => void;
    recipientID?: number;
    selectedChannel?: ChannelDTO | null;
    onChannelCreated?: (channel: ChannelDTO) => void;
    initialMessage?: string;
    onMessageSent?: () => void;
}

// Helper function to safely parse dates
const parseMessageDate = (
    date: string | Date | null | undefined
): Date | null => {
    if (!date) return null;

    // If it's already a Date object, return it
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date;
    }

    // Try to parse string dates
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// Helper function to get the best available timestamp from a message
const getMessageTimestamp = (msg: any): string | Date | null => {
    // Prefer createdAt, but fall back to readAt or other timestamp fields
    return msg.createdAt || msg.readAt || msg.updatedAt || null;
};

// Helper function for better date formatting
const formatMessageTime = (date: string | Date | null | undefined): string => {
    const messageDate = parseMessageDate(date);

    // Handle null/invalid dates
    if (!messageDate) {
        console.warn('Invalid or missing date in formatMessageTime:', date);
        return 'Unknown time';
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Debug logging - remove this once you've confirmed it's working
    console.log('Date formatting debug:', {
        originalDate: date,
        parsedDate: messageDate,
        now: now,
        diffInMinutes: diffInMinutes,
        diffInHours: diffInHours
    });

    // Less than 1 minute ago
    if (diffInMinutes < 1) {
        return 'Just now';
    }

    // Less than 1 hour ago
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    // Less than 24 hours ago (same day)
    if (diffInHours < 24 && messageDate.getDate() === now.getDate()) {
        return messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
        messageDate.getDate() === yesterday.getDate() &&
        messageDate.getMonth() === yesterday.getMonth() &&
        messageDate.getFullYear() === yesterday.getFullYear()
    ) {
        return `Yesterday ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Less than a week ago
    if (diffInDays < 7) {
        const dayName = messageDate.toLocaleDateString([], {
            weekday: 'short'
        });
        const time = messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${dayName} ${time}`;
    }

    // Older than a week
    return messageDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Helper function to check if we need a date separator
const shouldShowDateSeparator = (
    currentMsg: MessageDTO,
    previousMsg: MessageDTO | null
): boolean => {
    if (!previousMsg) return true;

    const currentDate = parseMessageDate(getMessageTimestamp(currentMsg));
    const previousDate = parseMessageDate(getMessageTimestamp(previousMsg));

    // If either message has no valid date, don't show separator
    if (!currentDate || !previousDate) return false;

    return (
        currentDate.getDate() !== previousDate.getDate() ||
        currentDate.getMonth() !== previousDate.getMonth() ||
        currentDate.getFullYear() !== previousDate.getFullYear()
    );
};

// Helper function to format date separator
const formatDateSeparator = (
    date: string | Date | null | undefined
): string => {
    const dateObj = parseMessageDate(date);

    if (!dateObj) return 'Unknown date';

    const now = new Date();
    const diffInDays = Math.floor(
        (now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7)
        return dateObj.toLocaleDateString([], { weekday: 'long' });

    return dateObj.toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
};

export default function ChatModal({
    isChatOpen,
    setIsChatOpen,
    recipientID = 0,
    selectedChannel: initialSelected,
    onChannelCreated,
    initialMessage = "Hello! I'm interested in your post.",
    onMessageSent
}: ChatModalProps) {
    const { user } = useAuth();
    const { messages, setMessages, joinChannel, leaveChannel } =
        useWebSocketContext();

    const [messageInput, setMessageInput] = useState(initialMessage);
    const [loading, setLoading] = useState(false);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(
        initialSelected || null
    );
    const scrollRef = useRef<HTMLDivElement>(null);
    const token = useAppSelector((s) => s.auth.token);

    const channelID = selectedChannel?.id ?? null;

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isChatOpen) {
            if (recipientID !== 0) fetchExistingChannel(recipientID);
            else if (initialSelected) {
                setSelectedChannel(initialSelected);
                fetchMessages(initialSelected.id);
            }
        }
    }, [isChatOpen]);

    useEffect(() => {
        if (selectedChannel && selectedChannel.id !== -1) {
            joinChannel(selectedChannel.id);
            return () => leaveChannel(selectedChannel.id);
        }

        return () => leaveChannel(channelID);
    }, [selectedChannel]);

    const fetchExistingChannel = async (recipientId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const userDetails = await getUserDetails('me', token, {
                dmChannels: true
            });
            let channel = userDetails.dmChannels.find((ch) =>
                ch.users.some((u) => u.id === recipientId)
            );
            if (channel) {
                const otherUser = channel.users.find((u) => u.id !== user?.id);
                channel = { ...channel, otherUser };
                setSelectedChannel(channel);
                fetchMessages(channel.id);
            }
            else {
                setSelectedChannel({
                    id: -1,
                    name: 'Pending Channel',
                    type: 'direct',
                    users: [user!, { id: recipientId }],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                } as any);
                setLoading(false);
            }
        }
        catch (err) {
            console.error('Failed to fetch DM channel:', err);
            setLoading(false);
        }
    };

    const fetchMessages = async (channelId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const msgs = await getMessages(channelId, token);

            // Debug: Log the raw messages from the API
            console.log('Raw messages from API:', msgs);

            // Process messages but preserve original timestamps
            const processedMessages: MessageDTO[] = msgs.map((msg) => {
                // Get the best available timestamp
                const timestamp = getMessageTimestamp(msg);

                // Debug: Log each message's timestamp info
                console.log('Processing message timestamps:', {
                    createdAt: msg.createdAt,
                    readAt: msg.readAt,
                    updatedAt: msg.updatedAt,
                    selectedTimestamp: timestamp
                });

                return {
                    ...msg,
                    // Use the best available timestamp
                    createdAt: timestamp,
                    author: msg.author || {
                        id: 0,
                        username: 'Unknown',
                        email: '',
                        admin: false,
                        kudos: 0,
                        locationID: null,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    }
                };
            });

            console.log('Processed messages:', processedMessages);
            setMessages(processedMessages);
        }
        catch (err) {
            console.error('Error fetching messages:', err);
        }
        finally {
            setLoading(false);
        }
    };

    const validateMessage = (msg: string) =>
        msg.trim().length > 0 && msg.trim().length <= 1000;

    const sendMessage = async () => {
        if (!token || !validateMessage(messageInput)) return;
        try {
            setLoading(true);
            const msg: CreateMessageDTO = { content: messageInput };
            let response;

            if (!selectedChannel || selectedChannel.id === -1) {
                if (!recipientID || recipientID === 0) return;
                response = await sendDirectMessage(+recipientID, msg, token);
                if (response.channel) {
                    const newChannel = {
                        ...response.channel,
                        otherUser: response.channel.users.find(
                            (u) => u.id !== user?.id
                        )
                    };
                    setSelectedChannel(newChannel);
                    joinChannel(newChannel.id);
                    onChannelCreated?.(newChannel);
                }
            }
            else {
                const receiver = selectedChannel.users.find(
                    (u) => u.id !== user?.id
                );
                if (!receiver) return;
                response = await sendDirectMessage(receiver.id, msg, token);
            }

            // Debug: Log the response from sending a message
            console.log('Send message response:', response);

            const fullMessage: MessageDTO = {
                ...response,
                author: response.author ||
                    user || {
                    id: 0,
                    username: 'Unknown',
                    email: '',
                    admin: false,
                    kudos: 0,
                    locationID: null,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                // IMPORTANT: Preserve the server's timestamp if available, fallback to current time for new messages
                createdAt:
                    getMessageTimestamp(response) || new Date().toISOString()
            };

            setMessages((prev) => [...prev, fullMessage]);
            setMessageInput('');
            onMessageSent?.();
        }
        catch (err) {
            console.error('Send failed:', err);
        }
        finally {
            setLoading(false);
        }
    };

    if (!isChatOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col transition-transform duration-300'>
                {/* Header */}
                <div className='flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 pb-3 mb-4'>
                    <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                        {selectedChannel?.otherUser?.username ||
                            'Direct Message'}
                    </h2>
                    <Button
                        className='text-sm text-red-500 hover:text-red-600'
                        onClick={() => {
                            if (selectedChannel && selectedChannel.id !== -1) {
                                leaveChannel(selectedChannel.id);
                            }
                            setIsChatOpen(false);
                            setMessages([]);
                            setSelectedChannel(null);
                        }}
                    >
                        Close
                    </Button>
                </div>

                {/* Messages */}
                <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto space-y-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4'
                >
                    {loading && (
                        <p className='text-center text-gray-400'>
                            Loading messages...
                        </p>
                    )}
                    {!loading && messages.length === 0 && (
                        <p className='text-center text-gray-400'>
                            No messages yet.
                        </p>
                    )}
                    {messages
                        .filter((msg) => msg && typeof msg === 'object')
                        .map((msg, i) => {
                            // Don't override the timestamp - use what we have
                            const safeMsg: MessageDTO = {
                                ...msg,
                                content: msg.content || '',
                                author:
                                    msg.author ||
                                    ({
                                        id: 0,
                                        username: 'Unknown',
                                        email: '',
                                        admin: false,
                                        kudos: 0,
                                        locationID: null
                                    } as UserDTO)
                            };

                            const isOwn = safeMsg.author?.id === user?.id;
                            const previousMsg = i > 0 ? messages[i - 1] : null;
                            const showDateSeparator = shouldShowDateSeparator(
                                safeMsg,
                                previousMsg
                            );

                            // Get the best available timestamp for display
                            const messageTimestamp =
                                getMessageTimestamp(safeMsg);

                            return (
                                <React.Fragment
                                    key={`${safeMsg.id || 'temp'}-${i}`}
                                >
                                    {/* Date Separator */}
                                    {showDateSeparator && (
                                        <div className='flex items-center justify-center my-4'>
                                            <div className='flex-1 border-t border-gray-300'></div>
                                            <span className='px-3 text-xs text-gray-500 bg-gray-50'>
                                                {formatDateSeparator(
                                                    messageTimestamp
                                                )}
                                            </span>
                                            <div className='flex-1 border-t border-gray-300'></div>
                                        </div>
                                    )}

                                    {/* Message */}
                                    <div
                                        className={`max-w-xs px-4 py-3 rounded-xl text-sm shadow-sm transition-colors transform-gpu ${
                                            isOwn
                                                ? 'bg-teal-600 dark:bg-teal-500 text-white self-end ml-auto rounded-br-none'
                                                : 'bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 self-start rounded-bl-none'
                                        }`}
                                    >
                                        <TextWithLinks>
                                            {safeMsg.content}
                                        </TextWithLinks>
                                        <div
                                            className={`text-xs text-right mt-2 ${
                                                isOwn
                                                    ? 'text-teal-200'
                                                    : 'text-zinc-400 dark:text-zinc-500'
                                            }`}
                                            title={
                                                messageTimestamp
                                                    ? new Date(
                                                        messageTimestamp
                                                    ).toLocaleString()
                                                    : 'No timestamp available'
                                            }
                                        >
                                            {formatMessageTime(
                                                messageTimestamp
                                            )}
                                        </div>
                                    </div>
                                </React.Fragment>
                            );
                        })}
                </div>

                {/* Input */}
                <div className='flex items-center gap-2'>
                    <textarea
                        rows={2}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className='flex-1 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors'
                        placeholder='Type your message...'
                    />
                    <Button
                        disabled={!validateMessage(messageInput) || loading}
                        onClick={sendMessage}
                        className={`px-4 py-2 rounded-lg text-white transition-colors ${
                            validateMessage(messageInput) && !loading
                                ? 'bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600'
                                : 'bg-gray-400 dark:bg-zinc-600 cursor-not-allowed'
                        }`}
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}
