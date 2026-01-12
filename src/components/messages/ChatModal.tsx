import React, { useEffect, useRef, useState } from 'react';
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
import {
    ArrowUturnLeftIcon,
    TrashIcon,
    PencilIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import {
    useSendDirectMessage,
    useUpdateMessage
} from '@/shared/api/mutations/messages';
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
    if (date instanceof Date) {
        return isNaN(date.getTime()) ? null : date;
    }
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
};

// Helper function to get the best available timestamp from a message
const getMessageTimestamp = (msg: any): string | Date | null => {
    return msg.createdAt || msg.readAt || msg.updatedAt || null;
};

// Helper function for better date formatting
const formatMessageTime = (date: string | Date | null | undefined): string => {
    const messageDate = parseMessageDate(date);
    if (!messageDate) {
        return 'Unknown time';
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - messageDate.getTime();
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
        return 'Just now';
    }
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }
    if (diffInHours < 24 && messageDate.getDate() === now.getDate()) {
        return messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
        messageDate.getDate() === yesterday.getDate() &&
        messageDate.getMonth() === yesterday.getMonth() &&
        messageDate.getFullYear() === yesterday.getFullYear()
    ) {
        return `Yesterday ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

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

// Helper function to sort messages chronologically
const sortMessagesByTime = (messages: MessageDTO[]): MessageDTO[] => {
    return [...messages].sort((a, b) => {
        const timeA = parseMessageDate(getMessageTimestamp(a))?.getTime() || 0;
        const timeB = parseMessageDate(getMessageTimestamp(b))?.getTime() || 0;

        if (timeA !== timeB) {
            return timeA - timeB;
        }
        return (a.id || 0) - (b.id || 0);
    });
};

// Helper to get display name (prioritize displayName, fallback to name or username)
const getDisplayName = (user: any) => {
    return user?.displayName || user?.name || user?.username || 'Unknown';
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
    const [editingMessageId, setEditingMessageId] = useState<number | null>(
        null
    );
    const [editContent, setEditContent] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const token = useAppSelector((s) => s.auth.token);
    const sendDirectInitial = useSendDirectMessage(recipientID ?? undefined);
    const updateMessageMutation = useUpdateMessage();

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
            const userDetails = await apiGet<any>('/users/me', {
                params: { dmChannels: true }
            });
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
            const msgs = await apiGet<MessageDTO[]>(
                `/channels/${channelId}/messages`
            );

            const processedMessages: MessageDTO[] = msgs.map((msg) => {
                const timestamp = getMessageTimestamp(msg);

                return {
                    ...msg,
                    createdAt:
                        (parseMessageDate(timestamp) as Date) || new Date(),
                    author: (msg.author ??
                        ({
                            id: 0,
                            username: 'Unknown',
                            email: '',
                            admin: false,
                            kudos: 0,
                            locationID: null,
                            createdAt: new Date(),
                            updatedAt: new Date()
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
                ...(replyTo ? { replyToMessageID: replyTo.id } : {})
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
                response = await apiMutate<MessageDTO, CreateMessageDTO>(
                    `/users/${receiver.id}/dm`,
                    'post',
                    msg
                );
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
                createdAt:
                    (parseMessageDate(getMessageTimestamp(response)) as Date) ||
                    new Date()
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

    const handleEditStart = (message: MessageDTO) => {
        if (!user || user.id !== message.authorID || message.deletedAt) return;
        setEditingMessageId(message.id);
        setEditContent(message.content);
        setReplyTo(null); // Cancel any ongoing reply
    };

    const handleEditSave = async (messageId: number) => {
        if (!editContent.trim() || !token) return;

        const originalMessage = messages.find((m) => m.id === messageId);
        if (!originalMessage) return;

        try {
            const response = await updateMessageMutation.mutateAsync({
                id: messageId,
                content: editContent.trim()
            });

            const updatedMessage: MessageDTO = {
                ...response,
                author: response.author || originalMessage.author
            };

            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? updatedMessage : m))
            );

            setEditingMessageId(null);
            setEditContent('');
        }
        catch (err) {
            console.error('Failed to edit message:', err);
            alert('Failed to edit message. Please try again.');
        }
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    if (!isChatOpen) return null;

    const sortedMessages = sortMessagesByTime(messages);

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] flex flex-col transition-transform duration-300'>
                {/* Header */}
                <div className='flex justify-between items-center border-b border-zinc-200 dark:border-zinc-700 pb-3 mb-4'>
                    <h2 className='text-lg font-semibold text-zinc-900 dark:text-zinc-100'>
                        {getDisplayName(selectedChannel?.otherUser) ||
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
                    className='flex-1 overflow-y-auto space-y-1 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg mb-4'
                >
                    {loading && (
                        <p className='text-center text-gray-400'>
                            Loading messages...
                        </p>
                    )}
                    {!loading && sortedMessages.length === 0 && (
                        <p className='text-center text-gray-400'>
                            No messages yet.
                        </p>
                    )}
                    {sortedMessages
                        .filter((msg) => {
                            if (!msg || typeof msg !== 'object') return false;
                            const isOwn =
                                !!user &&
                                (msg.authorID === user.id ||
                                    msg.author?.id === user.id);
                            const canSeeDeleted =
                                !!user && (user.admin || isOwn);
                            // Only show non-deleted messages, or deleted messages if user can see them
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
                            const previousMsg =
                                i > 0 ? sortedMessages[i - 1] : null;
                            const showDateSeparator = shouldShowDateSeparator(
                                safeMsg,
                                previousMsg
                            );

                            const messageTimestamp =
                                getMessageTimestamp(safeMsg);

                            const canDelete = !!user && isOwn;
                            const canEdit =
                                !!user && isOwn && !safeMsg.deletedAt;
                            const isEditing = editingMessageId === safeMsg.id;
                            const repliedTo = safeMsg.replyToMessageID
                                ? sortedMessages.find(
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
                                            <span className='px-3 text-xs text-gray-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800'>
                                                {formatDateSeparator(
                                                    messageTimestamp
                                                )}
                                            </span>
                                            <div className='flex-1 border-t border-gray-300'></div>
                                        </div>
                                    )}

                                    {/* Reply Preview - WhatsApp style */}
                                    {repliedTo && !isEditing && (
                                        <div
                                            className={`max-w-xs ${isOwn ? 'ml-auto mr-1' : 'ml-1'} mb-1`}
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
                                                            'ring-brand-400'
                                                        );
                                                        setTimeout(() => {
                                                            el.classList.remove(
                                                                'ring-2',
                                                                'ring-brand-400'
                                                            );
                                                        }, 1200);
                                                    }
                                                }}
                                                className={`block w-full text-left px-2 py-1.5 rounded-t-lg border-l-4 ${
                                                    isOwn
                                                        ? 'text-zinc-600 dark:text-zinc-300'
                                                        : 'text-zinc-700 dark:text-zinc-200'
                                                } text-xs pl-2 pr-2 py-1 border-l-2 ${
                                                    isOwn
                                                        ? 'border-brand-300/70'
                                                        : 'border-zinc-400/60'
                                                } bg-zinc-100/80 dark:bg-zinc-800/60 rounded`}
                                                title={`${
                                                    repliedTo.author
                                                        ?.username ?? 'Unknown'
                                                }: ${repliedTo.content}`}
                                            >
                                                <div
                                                    className={`text-xs font-semibold mb-0.5 ${
                                                        isOwn
                                                            ? 'text-brand-200'
                                                            : 'text-brand-600 dark:text-brand-300'
                                                    }`}
                                                >
                                                    <UserCard
                                                        triggerVariant='name'
                                                        user={replyTo.author}
                                                    />
                                                </div>
                                                <div
                                                    className={`text-xs line-clamp-2 ${
                                                        isOwn
                                                            ? 'text-brand-200'
                                                            : 'text-zinc-600 dark:text-zinc-300'
                                                    }`}
                                                >
                                                    {repliedTo.content}
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    <div
                                        id={`msg-${safeMsg.id}`}
                                        className={`group relative max-w-xs px-4 py-3 ${
                                            repliedTo && !isEditing
                                                ? 'rounded-b-xl'
                                                : 'rounded-xl'
                                        } ${
                                            isOwn
                                                ? 'rounded-br-none'
                                                : 'rounded-bl-none'
                                        } text-sm shadow-sm transition-colors transform-gpu break-words overflow-wrap-anywhere ${
                                            isOwn
                                                ? 'bg-brand-600 dark:bg-brand-400 text-white self-end ml-auto'
                                                : 'bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 self-start'
                                        }`}
                                    >
                                        {isEditing ? (
                                            // Edit mode
                                            <div className='space-y-2'>
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) =>
                                                        setEditContent(
                                                            e.target.value
                                                        )
                                                    }
                                                    className='w-full max-w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 text-zinc-900 bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-white overflow-y-auto'
                                                    style={{
                                                        WebkitOverflowScrolling:
                                                            'touch',
                                                        touchAction: 'pan-y'
                                                    }}
                                                    rows={3}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'Enter' &&
                                                            e.ctrlKey
                                                        ) {
                                                            e.preventDefault();
                                                            handleEditSave(
                                                                safeMsg.id
                                                            );
                                                        }
                                                        else if (
                                                            e.key === 'Escape'
                                                        ) {
                                                            e.preventDefault();
                                                            handleEditCancel();
                                                        }
                                                    }}
                                                />
                                                <div className='flex gap-2'>
                                                    <Button
                                                        onClick={() =>
                                                            handleEditSave(
                                                                safeMsg.id
                                                            )
                                                        }
                                                        disabled={
                                                            !editContent.trim()
                                                        }
                                                        className='text-xs px-3 py-1 bg-brand-600 hover:bg-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 text-white rounded'
                                                    >
                                                        Save
                                                    </Button>
                                                    <Button
                                                        onClick={
                                                            handleEditCancel
                                                        }
                                                        variant='secondary'
                                                        className='text-xs px-3 py-1'
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                                <p className='text-xs text-zinc-500 dark:text-zinc-400'>
                                                    Press Ctrl+Enter to save,
                                                    Esc to cancel
                                                </p>
                                            </div>
                                        ) : (
                                            // View mode
                                            <>
                                                {/* Show sender name for non-own messages */}
                                                {!isOwn && (
                                                    <div className='text-xs font-semibold mb-1 text-brand-600 dark:text-brand-300'>
                                                        <UserCard
                                                            triggerVariant='name'
                                                            user={
                                                                replyTo.author
                                                            }
                                                        />
                                                    </div>
                                                )}

                                                {safeMsg.deletedAt ? (
                                                    <div className='text-zinc-300 dark:text-zinc-300 italic opacity-90'>
                                                        [deleted message]
                                                    </div>
                                                ) : (
                                                    <>
                                                        {safeMsg.updatedAt !==
                                                            safeMsg.createdAt && (
                                                            <span className='italic opacity-80 text-xs mr-1'>
                                                                [edited]
                                                            </span>
                                                        )}
                                                        <TextWithLinks>
                                                            {safeMsg.content}
                                                        </TextWithLinks>
                                                    </>
                                                )}

                                                <div
                                                    className={`absolute z-10 -top-3 ${
                                                        isOwn
                                                            ? 'left-2'
                                                            : 'right-2'
                                                    } opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 dark:bg-zinc-800/90 rounded px-1 py-0.5 shadow`}
                                                >
                                                    <button
                                                        type='button'
                                                        title='Reply'
                                                        onClick={() =>
                                                            setReplyTo(safeMsg)
                                                        }
                                                        className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                    >
                                                        <ArrowUturnLeftIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                                                    </button>
                                                    {canEdit && (
                                                        <button
                                                            type='button'
                                                            title='Edit'
                                                            onClick={() =>
                                                                handleEditStart(
                                                                    safeMsg
                                                                )
                                                            }
                                                            className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        >
                                                            <PencilIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type='button'
                                                            title='Delete'
                                                            onClick={async () => {
                                                                if (!token)
                                                                    return;
                                                                try {
                                                                    await apiMutate<
                                                                        void,
                                                                        void
                                                                    >(
                                                                        `/messages/${safeMsg.id}`,
                                                                        'delete'
                                                                    );
                                                                }
                                                                catch (e) {
                                                                    console.error(
                                                                        'Failed to delete message',
                                                                        e
                                                                    );
                                                                    return;
                                                                }
                                                                setMessages(
                                                                    (prev) => {
                                                                        const idx =
                                                                            prev.findIndex(
                                                                                (
                                                                                    x
                                                                                ) =>
                                                                                    x.id ===
                                                                                    safeMsg.id
                                                                            );
                                                                        if (
                                                                            idx ===
                                                                            -1
                                                                        )
                                                                            return prev;
                                                                        const original =
                                                                            prev[
                                                                                idx
                                                                            ];
                                                                        if (
                                                                            user &&
                                                                            (user.admin ||
                                                                                original.authorID ===
                                                                                    user.id ||
                                                                                original
                                                                                    .author
                                                                                    ?.id ===
                                                                                    user.id)
                                                                        ) {
                                                                            const updated =
                                                                                {
                                                                                    ...original,
                                                                                    content:
                                                                                        '', // Clear content
                                                                                    deletedAt:
                                                                                        new Date().toISOString()
                                                                                } as MessageDTO;
                                                                            const copy =
                                                                                [
                                                                                    ...prev
                                                                                ];
                                                                            copy[
                                                                                idx
                                                                            ] =
                                                                                updated;
                                                                            return copy;
                                                                        }
                                                                        else {
                                                                            return prev.filter(
                                                                                (
                                                                                    x
                                                                                ) =>
                                                                                    x.id !==
                                                                                    safeMsg.id
                                                                            );
                                                                        }
                                                                    }
                                                                );
                                                            }}
                                                            className='p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        >
                                                            <TrashIcon className='w-4 h-4 text-zinc-700 dark:text-zinc-200' />
                                                        </button>
                                                    )}
                                                </div>
                                                <div
                                                    className={`text-xs text-right mt-2 ${
                                                        isOwn
                                                            ? 'text-brand-200'
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
                                            </>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                </div>

                {/* Input */}
                <div className='flex flex-col gap-2'>
                    {replyTo && (
                        <div className='flex flex-col bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border-l-4 border-brand-600 dark:border-brand-300'>
                            <div className='flex items-center justify-between mb-1'>
                                <span className='text-xs font-semibold text-zinc-900 dark:text-zinc-100'>
                                    Replying to {getDisplayName(replyTo.author)}
                                </span>
                                <button
                                    className='text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 ml-2'
                                    onClick={() => setReplyTo(null)}
                                    title='Cancel reply'
                                >
                                    ✕
                                </button>
                            </div>
                            <span className='text-xs text-zinc-600 dark:text-zinc-300 truncate'>
                                {replyTo.content.slice(0, 100)}
                            </span>
                        </div>
                    )}
                    <div className='flex items-center gap-2'>
                        <textarea
                            rows={2}
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            className='flex-1 border border-zinc-300 dark:border-zinc-600 rounded-lg px-3 py-2 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-300 transition-colors overflow-y-auto'
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                touchAction: 'pan-y'
                            }}
                            placeholder='Type your message...'
                        />
                        <Button
                            disabled={!validateMessage(messageInput) || loading}
                            onClick={sendMessage}
                            className={`px-4 py-2 rounded-lg text-white transition-colors ${
                                validateMessage(messageInput) && !loading
                                    ? 'bg-brand-600 hover:bg-brand-500 dark:bg-brand-400 dark:hover:bg-brand-300 dark:bg-teal-500 dark:hover:bg-teal-600'
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
