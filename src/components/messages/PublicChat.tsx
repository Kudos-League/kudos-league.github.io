import React, { useEffect, useState, useRef, useMemo } from 'react';
import { apiGet } from '@/shared/api/apiClient';
import { useAuth } from '@/contexts/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { ChannelDTO, MessageDTO } from '@/shared/api/types';
import { usePublicChannels } from '@/shared/api/queries/messages';
import { useUpdateMessage, useDeleteMessage } from '@/shared/api/mutations/messages';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import TextWithLinks from '../common/TextWithLinks';
import { Edit2, Trash2 } from 'lucide-react';

// Enhanced MessageBubble with edit/delete functionality
interface EnhancedMessageBubbleProps {
    message: MessageDTO;
    isOwn?: boolean;
    compact?: boolean;
    onEdit?: (messageId: number, newContent: string) => void;
    onDelete?: (messageId: number) => void;
    editingMessageId?: number;
    onStartEdit?: (messageId: number, currentContent: string) => void;
    onCancelEdit?: () => void;
}


const EnhancedMessageBubble: React.FC<EnhancedMessageBubbleProps> = ({
    message,
    isOwn = false,
    editingMessageId,
    onEdit,
    onDelete,
    onStartEdit,
    onCancelEdit
}) => {
    const [editContent, setEditContent] = useState('');
    const [showActions, setShowActions] = useState(false);
    const isEditing = editingMessageId === message.id;

    React.useEffect(() => {
        if (isEditing) {
            setEditContent(message.content);
        }
    }, [isEditing, message.content]);

    const handleSaveEdit = () => {
        if (editContent.trim() && onEdit) {
            onEdit(message.id, editContent.trim());
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            handleSaveEdit();
        }
        else if (e.key === 'Escape') {
            onCancelEdit?.();
        }
    };

    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
            <div className={`max-w-md ${isOwn ? 'text-right' : 'text-left'} relative`}>
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-full p-3 text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <Button
                                onClick={handleSaveEdit}
                                disabled={!editContent.trim()}
                                className="text-xs px-3 py-1.5"
                                variant="success"
                            >
                                Save
                            </Button>
                            <Button
                                onClick={onCancelEdit}
                                className="text-xs px-3 py-1.5"
                                variant="secondary"
                            >
                                Cancel
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Press Ctrl+Enter to save, Esc to cancel
                        </p>
                    </div>
                ) : (
                    <div 
                        className="relative"
                        onMouseEnter={() => setShowActions(true)}
                        onMouseLeave={() => setShowActions(false)}
                    >
                        <div
                            className={`px-4 py-3 rounded-xl text-sm whitespace-pre-wrap break-words shadow-sm transition-all duration-200 ${
                                isOwn
                                    ? 'bg-teal-600 dark:bg-teal-500 text-white rounded-br-none'
                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-bl-none border border-zinc-300 dark:border-zinc-600'
                            } ${showActions && isOwn ? 'pr-20' : ''}`}
                        >
                            <TextWithLinks>{message.content}</TextWithLinks>
                        </div>
                        
                        {/* Action buttons */}
                        {isOwn && (
                            <div className={`absolute top-2 right-2 flex gap-1 transition-all duration-200 ${
                                showActions || window.innerWidth <= 768 
                                    ? 'opacity-100 translate-y-0' 
                                    : 'opacity-0 translate-y-1 pointer-events-none'
                            }`}>
                                <button
                                    onClick={() => onStartEdit?.(message.id, message.content)}
                                    className="group/btn p-1.5 rounded-md bg-black/10 hover:bg-black/20 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all duration-150 hover:scale-105"
                                    title="Edit message"
                                >
                                    <Edit2 size={12} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                                <button
                                    onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this message?')) {
                                            onDelete?.(message.id);
                                        }
                                    }}
                                    className="group/btn p-1.5 rounded-md bg-black/10 hover:bg-red-500/90 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all duration-150 hover:scale-105"
                                    title="Delete message"
                                >
                                    <Trash2 size={12} className="transition-transform group-hover/btn:scale-110" />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Enhanced MessageGroup with edit/delete support
interface EnhancedMessageGroupProps {
    messages: MessageDTO[];
    isOwn?: boolean;
    compact?: boolean;
    isPublic?: boolean;
    onEdit?: (messageId: number, newContent: string) => void;
    onDelete?: (messageId: number) => void;
    editingMessageId?: number;
    onStartEdit?: (messageId: number, currentContent: string) => void;
    onCancelEdit?: () => void;
}

const EnhancedMessageGroup: React.FC<EnhancedMessageGroupProps> = ({
    messages,
    isOwn = false,
    compact = false,
    isPublic = false,
    onEdit,
    onDelete,
    editingMessageId,
    onStartEdit,
    onCancelEdit
}) => {
    if (messages.length === 0) return null;

    const author = messages[0].author;
    const authorName = isPublic && isOwn ? 'You' : author?.username || 'Anonymous';
    const AuthorCard = <UserCard triggerVariant='name' user={{ ...author, username: authorName }} />;

    const createdAt = messages[0].createdAt
        ? new Date(messages[0].createdAt)
        : messages[0].updatedAt
            ? new Date(messages[0].updatedAt)
            : null;
    const timestamp =
        createdAt && !isNaN(createdAt.getTime())
            ? createdAt.toLocaleString()
            : 'Unknown time';

    return (
        <div className='mb-4'>
            {(!isOwn || isPublic) && (
                <div
                    className={`text-sm font-semibold mb-1 text-zinc-500 dark:text-zinc-400 ${
                        isOwn ? 'text-right mr-1' : 'text-left ml-1'
                    }`}
                >
                    {AuthorCard}
                </div>
            )}

            {messages.map((msg) => (
                <EnhancedMessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={isOwn}
                    compact={compact}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    editingMessageId={editingMessageId}
                    onStartEdit={onStartEdit}
                    onCancelEdit={onCancelEdit}
                />
            ))}

            <div
                className={`text-xs text-zinc-400 dark:text-zinc-500 opacity-70 mt-1 ${
                    isOwn ? 'text-right' : 'text-left'
                }`}
            >
                {timestamp}
            </div>
        </div>
    );
};

export default function PublicChat() {
    const { token, user } = useAuth();
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const { messages, setMessages, joinChannel, leaveChannel, send } = useWebSocketContext();

    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(messages),
        [messages]
    );

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const channelsQuery = usePublicChannels();
    useEffect(() => {
        if (channelsQuery.data) {
            setChannels(channelsQuery.data);
            if (channelsQuery.data.length > 0 && !selectedChannel) selectChannel(channelsQuery.data[0]);
        }
    }, [channelsQuery.data]);

    const selectChannel = async (channel: ChannelDTO) => {
        setSelectedChannel(channel);
        setLoading(true);
        if (!token) return;

        try {
            // messages are managed via react-query hooks elsewhere; fetch directly for initial population
            const messagesData = await apiGet<MessageDTO[]>(`/channels/${channel.id}/messages`);
            if (messagesData) setMessages(messagesData);

            if (selectedChannel && selectedChannel.id !== channel.id) {
                leaveChannel(selectedChannel.id);
            }

            joinChannel(channel.id);
        }
        catch (error) {
            console.error('Error selecting channel:', error);
        }
        finally {
            setLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedChannel) return;
        await send({ channel: selectedChannel, content: messageInput });
        setMessageInput('');
    };

    const updateMessageMutation = useUpdateMessage();
    const handleEditMessage = async (messageId: number, newContent: string) => {
        if (!newContent.trim()) return;
        try {
            const updated = await updateMessageMutation.mutateAsync({ id: messageId, content: newContent });
            setMessages(prev => prev.map(m => (m.id === messageId ? updated : m)));
            setEditingMessageId(null);
        }
        catch (err) {
            console.error('Failed to edit message:', err);
            alert('Failed to edit message. Please try again.');
        }
    };

    const deleteMessageMutation = useDeleteMessage();
    const handleDeleteMessage = async (messageId: number) => {
        try {
            await deleteMessageMutation.mutateAsync(messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
        }
        catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message. Please try again.');
        }
    };

    const handleStartEdit = (messageId: number) => {
        setEditingMessageId(messageId);
    };

    const handleCancelEdit = () => {
        setEditingMessageId(null);
    };

    return (
        <div className='flex h-full bg-white overflow-hidden'>
            <div className='w-48 border-r overflow-y-auto bg-gray-100 p-3'>
                {channels.map((channel) => (
                    <Button
                        key={channel.id}
                        onClick={() => selectChannel(channel)}
                        className={`block w-full text-left px-3 py-2 mb-1 rounded ${
                            selectedChannel?.id === channel.id
                                ? 'bg-blue-100 font-semibold text-blue-800'
                                : 'hover:bg-gray-200'
                        }`}
                    >
                        {channel.name}
                    </Button>
                ))}
            </div>

            <div className='flex-1 flex flex-col'>
                <div className='border-b p-4 text-center font-bold text-lg'>
                    {selectedChannel
                        ? selectedChannel.name
                        : 'Select a Chat Room'}
                </div>

                <div
                    ref={scrollRef}
                    className='flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50'
                >
                    {loading ? (
                        <div className='text-center text-gray-500 mt-4'>
                            Loading...
                        </div>
                    ) : messages.length === 0 ? (
                        <p className='text-center text-gray-400 italic'>
                            No messages in this channel.
                        </p>
                    ) : (
                        groupedMessages.map((group, idx) => (
                            <SlideInOnScroll key={group[0].id} index={idx}>
                                <EnhancedMessageGroup
                                    messages={group}
                                    isOwn={group[0].author?.id === user?.id}
                                    compact
                                    isPublic
                                    onEdit={handleEditMessage}
                                    onDelete={handleDeleteMessage}
                                    editingMessageId={editingMessageId}
                                    onStartEdit={handleStartEdit}
                                    onCancelEdit={handleCancelEdit}
                                />
                            </SlideInOnScroll>
                        ))
                    )}
                </div>

                {selectedChannel && (
                    <div className='border-t p-3 flex items-center'>
                        <input
                            type='text'
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder='Type a message...'
                            className='flex-1 border rounded px-3 py-2'
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendMessage();
                            }}
                            disabled={editingMessageId !== null}
                        />
                        <Button
                            onClick={sendMessage}
                            className='ml-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                            disabled={editingMessageId !== null}
                        >
                            Send
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
