import React, { useRef, useEffect, useState, useMemo } from 'react';
import { ChannelDTO, MessageDTO, UserDTO } from '@/shared/api/types';
import MessageBubble from './MessageBubble';
import MessageGroup from './MessageGroup';
import SlideInOnScroll from '../common/SlideInOnScroll';
import { groupMessagesByAuthor } from '@/shared/groupMessagesByAuthor';
import Button from '../common/Button';
import UserCard from '../users/UserCard';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/contexts/useAuth';
import { deleteMessage as deleteMessageApi } from '@/shared/api/actions';

interface Props {
    user: UserDTO | null;
    channel: ChannelDTO | null;
    messages: MessageDTO[];
    onSend: (text: string) => void;
    onBack: () => void;
}

const ChatWindow: React.FC<Props> = ({
    user,
    channel,
    messages,
    onSend,
    onBack
}) => {
    const [messageInput, setMessageInput] = useState('');
    const [replyTo, setReplyTo] = useState<MessageDTO | null>(null);
    const { setMessages, send } = useWebSocketContext();
    const { token } = useAuth();
    const bottomRef = useRef<HTMLDivElement>(null);
    const visibleMessages = useMemo(() => {
        return messages
            .map((m) => {
                const isOwn =
                    !!user &&
                    (m.authorID === user.id || m.author?.id === user.id);
                const canSeeDeleted = !!user && (user.admin || isOwn);
                if (m.deletedAt && !canSeeDeleted) return null;
                if (m.deletedAt && canSeeDeleted) {
                    return {
                        ...m,
                        content: `[deleted]: ${m.content}`
                    } as MessageDTO;
                }
                return m;
            })
            .filter(Boolean) as MessageDTO[];
    }, [messages, user]);

    const groupedMessages = useMemo(
        () => groupMessagesByAuthor(visibleMessages),
        [visibleMessages]
    );
    const byId = useMemo(() => {
        const map = new Map<number, MessageDTO>();
        for (const m of messages) map.set(m.id, m);
        return map;
    }, [messages]);
    // Always scroll to bottom when messages change

    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    if (!channel) {
        return (
            <div className='flex-1 flex items-center justify-center text-gray-500'>
                Select a conversation to start chatting.
            </div>
        );
    }

    const otherUser = channel.users.find((u) => u.id !== user?.id);

    return (
        <div className='w-2/3 flex flex-col h-full'>
            {/* Header */}
            <div className='flex items-center justify-between px-4 py-3 border-b bg-white'>
                <Button
                    onClick={onBack}
                    className='text-blue-600 font-semibold text-sm'
                >
                    ← Back
                </Button>
                <h2 className='text-lg font-bold'>
                    <UserCard user={otherUser} />
                </h2>
                <div className='w-16' /> {/* spacer */}
            </div>

            {/* Message list */}
            <div className='flex-1 overflow-y-auto p-4 bg-gray-50'>
                {groupedMessages.map((group, idx) => (
                    <SlideInOnScroll key={group[0].id} index={idx}>
                        <MessageGroup
                            messages={group}
                            isOwn={
                                !!user?.id &&
                                (group[0].author?.id ?? group[0].authorID) ===
                                    user.id
                            }
                            onReply={(m) => setReplyTo(m)}
                            onDelete={async (m) => {
                                if (!token) return;
                                const canDelete =
                                    !!user &&
                                    (m.authorID === user.id ||
                                        m.author?.id === user.id);
                                if (!canDelete) return;
                                try {
                                    await deleteMessageApi(m.id, token);
                                }
                                catch (e) {
                                    console.error(
                                        'Failed to delete message',
                                        e
                                    );
                                    return;
                                }

                                setMessages((prev) => {
                                    const idx = prev.findIndex(
                                        (x) => x.id === m.id
                                    );
                                    if (idx === -1) return prev;
                                    const original = prev[idx];
                                    if (
                                        user &&
                                        (original.authorID === user.id ||
                                            original.author?.id === user.id)
                                    ) {
                                        const updated = {
                                            ...original,
                                            content: `[deleted]: ${original.content}`
                                        } as MessageDTO;
                                        const copy = [...prev];
                                        copy[idx] = updated;
                                        return copy;
                                    }
                                    else {
                                        return prev.filter(
                                            (x) => x.id !== m.id
                                        );
                                    }
                                });
                            }}
                            canDelete={(m) =>
                                !!user &&
                                (m.authorID === user.id ||
                                    m.author?.id === user.id)
                            }
                            findMessageById={(id) => byId.get(id)}
                        />
                    </SlideInOnScroll>
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Message input */}
            <div className='p-4 border-t bg-white flex flex-col gap-2'>
                {replyTo && (
                    <div className='flex items-center justify-between text-xs text-zinc-600 bg-zinc-100 px-2 py-1 rounded'>
                        <span>Replying to: {replyTo.content.slice(0, 80)}</span>
                        <button
                            className='text-blue-600 hover:underline'
                            onClick={() => setReplyTo(null)}
                        >
                            Cancel
                        </button>
                    </div>
                )}
                <div className='flex gap-3'>
                    <input
                        type='text'
                        placeholder='Type a message...'
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        className='flex-1 px-3 py-2 border rounded'
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (messageInput) {
                                    if (channel && user) {
                                        const other = channel.users.find(
                                            (u) => u.id !== user.id
                                        );
                                        if (other) {
                                            send({
                                                receiverID: other.id,
                                                content: messageInput.trim(),
                                                replyToMessageID: replyTo?.id
                                            });
                                        }
                                    }
                                    else {
                                        onSend(messageInput.trim());
                                    }
                                }
                                setMessageInput('');
                                setReplyTo(null);
                            }
                        }}
                    />
                    <Button
                        onClick={() => {
                            if (!messageInput.trim()) return;
                            if (channel && user) {
                                const other = channel.users.find(
                                    (u) => u.id !== user.id
                                );
                                if (other) {
                                    send({
                                        receiverID: other.id,
                                        content: messageInput.trim(),
                                        replyToMessageID: replyTo?.id
                                    });
                                }
                            }
                            else {
                                onSend(messageInput.trim());
                            }
                            setMessageInput('');
                            setReplyTo(null);
                        }}
                        className='bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;
