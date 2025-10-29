import React, { useEffect, useRef, useState, useCallback } from 'react';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { useAppSelector } from 'redux_store/hooks';
import { useAuth } from '@/contexts/useAuth';
import {
    ChannelDTO,
    CreateMessageDTO,
    MessageDTO,
    UserDTO
} from '@/shared/api/types';
import Button from '../common/Button';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import TextWithLinks from '../common/TextWithLinks';
import { ArrowUturnLeftIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSendDirectMessage } from '@/shared/api/mutations/messages';
import UserCard from '../users/UserCard';

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
        return 'Unknown time';
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);

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
    const diffInDays = Math.floor(diffInHours / 24);
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
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const token = useAppSelector((s) => s.auth.token);
    const sendDirectInitial = useSendDirectMessage(recipientID ?? undefined);

    const channelID = selectedChannel?.id ?? null;

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Initial setup when modal opens
    useEffect(() => {
        if (isChatOpen) {
            if (recipientID !== 0) fetchExistingChannel(recipientID);
            else if (initialSelected) {
                setSelectedChannel(initialSelected);
                fetchMessages(initialSelected.id);
            }
        }
    }, [isChatOpen]);

    // Join/leave channel
    useEffect(() => {
        if (selectedChannel && selectedChannel.id !== -1) {
            joinChannel(selectedChannel.id);
            return () => leaveChannel(selectedChannel.id);
        }

        return () => {
            if (channelID) leaveChannel(channelID);
        };
    }, [selectedChannel, channelID, joinChannel, leaveChannel]);

    const fetchExistingChannel = async (recipientId: number) => {
        if (!token) return;
        setLoading(true);
        try {
            const userDetails = await apiGet<any>('/users/me', { params: { dmChannels: true } });
            let channel = userDetails.dmChannels.find((ch: any) =>
                ch.users.some((u: any) => u.id === recipientId)
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
                    users: [user ?? ({} as any), { id: recipientId }],
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
            const msgs = await apiGet<MessageDTO[]>(`/channels/${channelId}/messages`);

            const processedMessages: MessageDTO[] = msgs.map((msg) => {
                const timestamp = getMessageTimestamp(msg);

                return {
                    ...msg,
                    createdAt: (parseMessageDate(timestamp) as Date) || new Date(),
                    author: (msg.author ?? ({
                        id: 0,
                        username: 'Unknown',
                        email: '',
                        admin: false,
                        kudos: 0,
                        locationID: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    } as any)) as UserDTO
                };
            });

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
            const msg: CreateMessageDTO = {
                content: messageInput,
                ...(replyTo?.id ? { replyToMessageID: replyTo.id } : {})
            };
            let response;

            if (!selectedChannel || selectedChannel.id === -1) {
                if (!recipientID || recipientID === 0) return;
                response = await sendDirectInitial.mutateAsync(msg as any);
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
                response = await apiMutate<MessageDTO, CreateMessageDTO>(`/users/${receiver.id}/dm`, 'post', msg);
            }

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
                createdAt: (parseMessageDate(getMessageTimestamp(response)) as Date) || new Date()
            };

            setMessages((prev) => [...prev, fullMessage]);
            setMessageInput('');
            setReplyTo(null);
            onMessageSent?.();
        }
        catch (err) {
            console.error('Send failed:', err);
        }
        finally {
            setLoading(false);
        }
    };

    const handleReplyClick = useCallback((msg: MessageDTO) => {
        if (msg.deletedAt) return;
        setReplyTo(msg);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    }, []);

    const handleCancelReply = useCallback(() => {
        setReplyTo(null);
    }, []);

    const handleDeleteMessage = useCallback(async (msg: MessageDTO) => {
        if (!token || msg.deletedAt) return;
        
        try {
            await apiMutate<void, void>(`/messages/${msg.id}`, 'delete');
            
            setMessages((prev) => {
                const idx = prev.findIndex((x) => x.id === msg.id);
                if (idx === -1) return prev;
                
                const original = prev[idx];
                if (
                    user &&
                    (user.admin ||
                        original.authorID === user.id ||
                        original.author?.id === user.id)
                ) {
                    const updated = {
                        ...original,
                        deletedAt: new Date().toISOString(),
                        content: `[deleted]: ${original.content}`
                    } as MessageDTO;
                    const copy = [...prev];
                    copy[idx] = updated;
                    return copy;
                }
                else {
                    return prev.filter((x) => x.id !== msg.id);
                }
            });
        }
        catch (e) {
            console.error('Failed to delete message', e);
        }
    }, [token, user, setMessages]);

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
                            setReplyTo(null);
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
                        .filter((msg) => {
                            if (!msg || typeof msg !== 'object') return false;
                            const isOwn =
                                !!user &&
                                (msg.authorID === user.id ||
                                    msg.author?.id === user.id);
                            const canSeeDeleted =
                                !!user && (user.admin || isOwn);
                            return !msg.deletedAt || canSeeDeleted;
                        })
                        .map((msg, i) => {
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

                            const isOwn =
                                (safeMsg.author?.id ?? safeMsg.authorID) ===
                                user?.id;
                            const previousMsg = i > 0 ? messages[i - 1] : null;
                            const showDateSeparator = shouldShowDateSeparator(
                                safeMsg,
                                previousMsg
                            );

                            const messageTimestamp =
                                getMessageTimestamp(safeMsg);

                            const repliedTo = safeMsg.replyToMessageID
                                ? messages.find(
                                    (mm) => mm.id === safeMsg.replyToMessageID
                                )
                                : null;
                            
                            return (
                                <React.Fragment
                                    key={`${safeMsg.id || 'temp'}-${i}`}
                                >
                                    {/* Date Separator */}
                                    {showDateSeparator && (
                                        <div className='flex items-center justify-center my-4'>
                                            <div className='flex-1 border-t border-gray-300 dark:border-zinc-600'></div>
                                            <span className='px-3 text-xs text-gray-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800'>
                                                {formatDateSeparator(
                                                    messageTimestamp
                                                )}
                                            </span>
                                            <div className='flex-1 border-t border-gray-300 dark:border-zinc-600'></div>
                                        </div>
                                    )}

                                    {/* Reply Preview */}
                                    {repliedTo && (
                                        <div
                                            className={`max-w-xs ${isOwn ? 'ml-auto' : ''} mb-1`}
                                        >
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    const el =
                                                        document.getElementById(
                                                            `msg-${repliedTo.id}`
                                                        );
                                                    if (el) {
                                                        el.scrollIntoView({
                                                            behavior: 'smooth',
                                                            block: 'center'
                                                        });
                                                        el.classList.add(
                                                            'ring-2',
                                                            'ring-teal-400'
                                                        );
                                                        setTimeout(() => {
                                                            el.classList.remove(
                                                                'ring-2',
                                                                'ring-teal-400'
                                                            );
                                                        }, 1200);
                                                    }
                                                }}
                                                className={`inline-flex items-center gap-1 max-w-full ${
                                                    isOwn
                                                        ? 'text-zinc-600 dark:text-zinc-300'
                                                        : 'text-zinc-700 dark:text-zinc-200'
                                                } text-xs pl-2 pr-2 py-1 border-l-2 ${
                                                    isOwn
                                                        ? 'border-teal-300/70'
                                                        : 'border-zinc-400/60'
                                                } bg-zinc-100/80 dark:bg-zinc-800/60 rounded hover:bg-zinc-200/80 dark:hover:bg-zinc-700/60 transition-colors`}
                                                title={`${
                                                    repliedTo.author
                                                        ?.username ?? 'Unknown'
                                                }: ${repliedTo.content}`}
                                            >
                                                <span className='font-semibold inline-flex items-center gap-1 shrink-0'>
                                                    <UserCard
                                                        triggerVariant='name'
                                                        user={repliedTo.author}
                                                    />
                                                </span>
                                                <span className='opacity-90 truncate'>
                                                    {repliedTo.content}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Message Bubble */}
                                    <div
                                        id={`msg-${safeMsg.id}`}
                                        className={`group relative max-w-xs px-4 py-3 rounded-xl text-sm shadow-sm transition-colors transform-gpu ${
                                            isOwn
                                                ? 'bg-teal-600 dark:bg-teal-500 text-white self-end ml-auto rounded-br-none'
                                                : 'bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 self-start rounded-bl-none'
                                        }`}
                                    >
                                        <TextWithLinks>
                                            {safeMsg.deletedAt
                                                ? `[deleted]: ${safeMsg.content}`
                                                : safeMsg.content}
                                        </TextWithLinks>
                                        
                                        {/* Action buttons - Only show for own messages or reply for all */}
                                        <div
                                            className={`absolute z-[60] ${
                                                isOwn ? '-left-20' : '-right-20'
                                            } top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-zinc-800 rounded-lg px-2 py-1 shadow-lg border border-zinc-200 dark:border-zinc-700`}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type='button'
                                                title={safeMsg.deletedAt ? 'Message deleted' : 'Reply'}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleReplyClick(safeMsg);
                                                }}
                                                disabled={Boolean(safeMsg.deletedAt)}
                                                className={`p-1.5 rounded transition-colors ${
                                                    safeMsg.deletedAt 
                                                        ? 'opacity-50 cursor-not-allowed' 
                                                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 active:bg-zinc-300 dark:active:bg-zinc-600'
                                                }`}
                                            >
                                                <ArrowUturnLeftIcon className={`w-4 h-4 ${safeMsg.deletedAt ? 'text-zinc-400 dark:text-zinc-200' : 'text-zinc-700 dark:text-zinc-200'}`} />
                                            </button>
                                            {isOwn && !safeMsg.deletedAt && (
                                                <button
                                                    type='button'
                                                    title='Delete'
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleDeleteMessage(safeMsg);
                                                    }}
                                                    className='p-1.5 rounded transition-colors hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/50'
                                                >
                                                    <TrashIcon className='w-4 h-4 text-red-600 dark:text-red-400' />
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Timestamp */}
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

                {/* Input Area */}
                <div className='flex flex-col gap-2'>
                    {/* Reply Preview in Input Area - Modern WhatsApp-style */}
                    {replyTo && (
                        <div className='flex items-start gap-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 border-l-4 border-teal-500 rounded-r-lg'>
                            <div className='flex-1 min-w-0'>
                                <div className='flex items-center gap-2 mb-1'>
                                    <ArrowUturnLeftIcon className='w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0' />
                                    <span className='text-xs font-semibold text-teal-700 dark:text-teal-300'>
                                        {replyTo.author?.username || 'Unknown'}
                                    </span>
                                </div>
                                <p className='text-sm text-zinc-600 dark:text-zinc-400 truncate'>
                                    {replyTo.content}
                                </p>
                            </div>
                            <button
                                onClick={handleCancelReply}
                                className='flex-shrink-0 p-1 hover:bg-teal-100 dark:hover:bg-teal-900/40 rounded transition-colors'
                                title='Cancel reply (Esc)'
                            >
                                <XMarkIcon className='w-4 h-4 text-zinc-500 dark:text-zinc-400' />
                            </button>
                        </div>
                    )}
                    
                    <div className='flex items-end gap-2'>
                        <textarea
                            ref={inputRef}
                            rows={2}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                                else if (e.key === 'Escape') {
                                    handleCancelReply();
                                }
                            }}
                            className='flex-1 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors resize-none'
                            placeholder='Type a message...'
                        />
                        <Button
                            disabled={!validateMessage(messageInput) || loading}
                            onClick={sendMessage}
                            className={`px-4 py-2 rounded-lg text-white transition-colors flex-shrink-0 ${
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
        </div>
    );
}
