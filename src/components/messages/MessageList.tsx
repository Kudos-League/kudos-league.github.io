import React, { useState, useMemo } from 'react';
import { CreateMessageDTO, MessageDTO, UpdateMessageDTO } from '@/shared/api/types';
import { sendMessage, updateMessage, deleteMessage } from '@/shared/api/actions';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from 'redux_store/hooks';


interface Props {
    messages: MessageDTO[];
    title?: string;
    callback?: (data: any) => void;
    onMessageUpdate?: (updatedMessage: MessageDTO) => void;
    onMessageDelete?: (deletedMessageId: number) => void;
    postID?: number;
    showSendMessage?: boolean;
    allowEdit?: boolean;
    allowDelete?: boolean;
}

const MessageList: React.FC<Props> = ({
    messages,
    title,
    callback,
    onMessageUpdate,
    onMessageDelete,
    postID,
    showSendMessage,
    allowEdit = false,
    allowDelete = false
}) => {
    const { user } = useAuth();
    const token = useAppSelector((state) => state.auth.token);
    const [showAllMessages, setShowAllMessages] = useState(false);
    const [messageContent, setMessageContent] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');

    // Simple processing - just sort by ID
    const processedMessages = useMemo(() => {
        if (!messages || messages.length === 0) return [];
        
        return [...messages].sort((a, b) => a.id - b.id);
    }, [messages]);

    const handleSubmitMessage = async () => {
        if (!messageContent.trim() || !user || !token || !postID) return;

        const newMessage: CreateMessageDTO = {
            content: messageContent,
            authorID: user.id,
            postID
        };

        try {
            const response = await sendMessage(newMessage, token);
            callback?.(response);
            setMessageContent('');
        }
        catch (err) {
            console.error('Failed to send message:', err);
            alert('Failed to send message. Please try again.');
        }
    };

    const handleEditStart = (message: MessageDTO) => {
        setEditingMessageId(message.id);
        setEditContent(message.content);
    };

    const handleEditSave = async (messageId: number) => {
        if (!editContent.trim() || !token) return;

        // Find the original message to preserve author data
        const originalMessage = processedMessages.find(msg => msg.id === messageId);
        if (!originalMessage) return;

        try {
            const response = await updateMessage(messageId, { content: editContent }, token);
            
            // Merge the response with original author data to ensure we don't lose it
            const updatedMessage: MessageDTO = {
                ...response,
                author: response.author || originalMessage.author // Preserve original author if not in response
            };
            
            // Use specific callback for updates, fallback to general callback
            if (onMessageUpdate) {
                onMessageUpdate(updatedMessage);
            } 
            else {
                callback?.(updatedMessage);
            }
            
            setEditingMessageId(null);
            setEditContent('');
        } 
        catch (err) {
            console.error('Failed to update message:', err);
            alert('Failed to update message. Please try again.');
        }
    };

    const handleEditCancel = () => {
        setEditingMessageId(null);
        setEditContent('');
    };

    const handleDelete = async (messageId: number) => {
        if (!token) return;
        
        // Simple confirmation
        if (!window.confirm('Are you sure you want to delete this message?')) {
            return;
        }

        try {
            await deleteMessage(messageId, token);
            
            // Use specific callback for deletions, fallback to general callback
            if (onMessageDelete) {
                onMessageDelete(messageId);
            }
            else {
                // For general callback, just trigger a refresh without passing the deleted message
                callback?.({ type: 'delete', messageId });
            }
        } 
        catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message. Please try again.');
        }
    };

    const canEditMessage = (message: MessageDTO) => {
        return allowEdit && user && user.id === message.authorID;
    };

    const canDeleteMessage = (message: MessageDTO) => {
        return allowDelete && user && user.id === message.authorID;
    };

    // Enhanced Message Component with edit/delete functionality
    const renderMessage = (msg: MessageDTO) => {
        const isEditing = editingMessageId === msg.id;
        const showEditButton = canEditMessage(msg);
        const showDeleteButton = canDeleteMessage(msg);

        return (
            <div key={msg.id} className="border-b border-gray-200 py-3 last:border-b-0">
                <div className="mb-2 flex justify-between items-start">
                    <span className="font-semibold text-gray-900">
                        {msg.author?.username || `User ${msg.authorID}`}
                    </span>
                    
                    {/* Action buttons */}
                    {(showEditButton || showDeleteButton) && !isEditing && (
                        <div className="flex gap-1">
                            {showEditButton && (
                                <button
                                    onClick={() => handleEditStart(msg)}
                                    className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                                >
                                    Edit
                                </button>
                            )}
                            {showDeleteButton && (
                                <button
                                    onClick={() => handleDelete(msg.id)}
                                    className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                {/* Message content or edit form */}
                {isEditing ? (
                    <div className="space-y-2">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && e.ctrlKey) {
                                    e.preventDefault();
                                    handleEditSave(msg.id);
                                } 
                                else if (e.key === 'Escape') {
                                    handleEditCancel();
                                }
                            }}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEditSave(msg.id)}
                                disabled={!editContent.trim()}
                                className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Save
                            </button>
                            <button
                                onClick={handleEditCancel}
                                className="text-xs bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Press Ctrl+Enter to save, Esc to cancel
                        </p>
                    </div>
                ) : (
                    <div className="text-gray-800 whitespace-pre-wrap">
                        {msg.content}
                    </div>
                )}
            </div>
        );
    };

    const displayedMessages = showAllMessages ? processedMessages : processedMessages.slice(0, 3);
    const hasMoreMessages = processedMessages.length > 3;

    return (
        <div>
            {title && (
                <div className="mb-3">
                    <h2 className='text-lg font-bold'>{title}</h2>
                </div>
            )}

            <div className='max-h-72 overflow-y-auto mb-3'>
                {processedMessages.length === 0 && (
                    <p className='text-red-500 text-sm mb-2'>No comments yet</p>
                )}
                
                {displayedMessages.map(renderMessage)}
            </div>

            {showSendMessage && (
                <div className='flex border-t pt-3 items-center gap-2'>
                    <input
                        type='text'
                        placeholder='Type a message...'
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSubmitMessage();
                            }
                        }}
                        className='flex-1 px-3 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                    <button
                        onClick={handleSubmitMessage}
                        disabled={!messageContent.trim()}
                        className='bg-blue-600 text-white px-3 py-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                    >
                        ➤
                    </button>
                </div>
            )}

            {hasMoreMessages && !showAllMessages && (
                <div className="flex justify-between items-center mt-3">
                    <button
                        onClick={() => setShowAllMessages(true)}
                        className='px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition-colors'
                    >
                        Show more messages ({processedMessages.length - 3} more)
                    </button>
                    
                    <span className="text-xs text-gray-500">
                        {processedMessages.length} message{processedMessages.length !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {showAllMessages && hasMoreMessages && (
                <button
                    onClick={() => setShowAllMessages(false)}
                    className='mt-3 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors w-full'
                >
                    Show less
                </button>
            )}
        </div>
    );
};

export default MessageList;
