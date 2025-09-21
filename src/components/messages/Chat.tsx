import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChannelDrawer from './ChannelDrawer';
import { apiGet } from '@/shared/api/apiClient';
import { MessageDTO, ChannelDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import DMList from './DMList';
import ChatWindow from './ChatWindow';
import { usePublicChannels } from '@/shared/api/queries/messages';
import { useDeleteMessage } from '@/shared/api/mutations/messages';
import Button from '@/components/common/Button';

type Props = {
    channelType?: 'dm' | 'public'
};

export default function Chat({ channelType }: Props) {
    const [pageHeaderHeight, setPageHeaderHeight] = useState<number>(0);
    const { id: targetUserID } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const { messages, setMessages, joinChannel, leaveChannel, send } = useWebSocketContext();

    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
    const [pendingChannel, setPendingChannel] = useState<ChannelDTO | null>(null);
    const [searchQuery] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const channelsQuery = usePublicChannels();
    const location = useLocation();

    const routeIsDM = location.pathname.includes('/dms') || Boolean(targetUserID);
    const isDMFromProp = channelType === 'dm';
    const resolvedIsDM = channelType ? isDMFromProp : routeIsDM;

    useEffect(() => {
        if (resolvedIsDM) return;

        if (channelsQuery.data) {
            setChannels(channelsQuery.data);

            if (channelsQuery.data.length > 0 && (!selectedChannel || selectedChannel.type === 'dm')) {
                selectChannel(channelsQuery.data[0]);
            }
        }
    }, [channelsQuery.data, routeIsDM, selectedChannel, resolvedIsDM, channelType]);

    useEffect(() => {
        setSelectedChannel(null);
        setMessages([]);
        setShowChatOnMobile(false);
    }, [resolvedIsDM]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const selectedChannelRef = useRef<ChannelDTO | null>(null);

    useEffect(() => {
        selectedChannelRef.current = selectedChannel;
    }, [selectedChannel]);

    const selectChannel = async (channel: ChannelDTO) => {
        setSelectedChannel(channel);

        if (!token) {
            setPendingChannel(channel);
            return;
        }

        try {
            const messagesData = await apiGet<MessageDTO[]>(`/channels/${channel.id}/messages`);
            if (messagesData) setMessages(messagesData);

            const prev = selectedChannelRef.current;
            if (prev && prev.id !== channel.id) {
                leaveChannel(prev.id);
            }

            joinChannel(channel.id);
        }
        catch (error) {
            console.error('Error selecting channel:', error);
        }
        finally {
            setPendingChannel(null);
        }
    };

    useEffect(() => {
        if (token && pendingChannel) {
            (async () => {
                try {
                    const channel = pendingChannel;
                    const messagesData = await apiGet<MessageDTO[]>(`/channels/${channel.id}/messages`);
                    if (messagesData) setMessages(messagesData);

                    const prev = selectedChannelRef.current;
                    if (prev && prev.id !== channel.id) {
                        leaveChannel(prev.id);
                    }

                    joinChannel(channel.id);
                }
                catch (err) {
                    console.error('Error processing pending channel selection:', err);
                }
                finally {
                    setPendingChannel(null);
                }
            })();
        }
    }, [token, pendingChannel]);

    useEffect(() => {
        const fetchDMChannels = async () => {
            if (!(user && token)) return;

            try {
                const res = await apiGet<any>(`/users/${user.id}`, { params: { dmChannels: true } });

                const formatted = res.dmChannels
                    .map((channel: any) => {
                        const otherUser = channel.users.find((u: any) => u.id !== user.id);
                        return otherUser ? { ...channel, otherUser } : null;
                    })
                    .filter(Boolean) as ChannelDTO[];

                const channelsWithLastMessage = await Promise.all(
                    formatted.map(async (channel) => {
                        try {
                            const channelMessages = await apiGet<MessageDTO[]>(`/channels/${channel.id}/messages`);
                            const lastMessage = channelMessages && channelMessages.length > 0 ? channelMessages[channelMessages.length - 1] : null;
                            return { ...channel, lastMessage } as ChannelDTO;
                        }
                        catch (error) {
                            console.error(`Error fetching messages for channel ${channel.id}:`, error);
                            return channel;
                        }
                    })
                );

                setChannels(channelsWithLastMessage);

                if (targetUserID) {
                    const parsedId = Number(targetUserID);
                    const matchedChannel = channelsWithLastMessage.find((channel) => channel.users.some((u: any) => u.id === parsedId));

                    if (matchedChannel) {
                        joinChannel(matchedChannel.id);
                        setSelectedChannel(matchedChannel);
                        setShowChatOnMobile(true);
                    }
                }
            }
            catch (e) {
                console.error('Failed to load DM channels', e);
            }
        };

        if (resolvedIsDM) {
            fetchDMChannels();
        }
    }, [user, token, targetUserID, joinChannel, resolvedIsDM, channelType]);

    useEffect(() => {
        if (messages.length > 0 && selectedChannel) {
            const lastMessage = messages[messages.length - 1];
            setChannels((prevChannels) => prevChannels.map((channel) => (channel.id === selectedChannel.id ? { ...channel, lastMessage } : channel)));
        }
    }, [messages, selectedChannel]);

    const openChat = async (channel: ChannelDTO) => {
        await selectChannel(channel);
        setShowChatOnMobile(true);
    };

    const sendMessage = async (text?: string) => {
        if (!text || !text.trim() || !selectedChannel) return;
        if (selectedChannel.type !== 'dm') {
            await send({ channel: selectedChannel, content: text });
        }
        else {
            const receiver = selectedChannel.users.find((u: any) => u.id !== user?.id);
            if (!receiver) return;
            await send({ receiverID: receiver.id, content: text });
        }
    };

    const deleteMessageMutation = useDeleteMessage();
    const handleDeleteMessage = async (messageId: number) => {
        try {
            await deleteMessageMutation.mutateAsync(messageId);
            const original = messages.find((m) => m.id === messageId);
            if (!original) {
                setMessages((prev) => prev.filter((m) => m.id !== messageId));
                return;
            }

            const enriched = {
                ...original,
                deletedAt: new Date().toISOString()
            } as any;

            setMessages((prev) => prev.map((m) => (m.id === messageId ? enriched : m)));
        }
        catch (err) {
            console.error('Failed to delete message:', err);
            alert('Failed to delete message. Please try again.');
        }
    };

    const isDMView = channelType ? channelType === 'dm' : routeIsDM;
    useEffect(() => {
        const headerEl: HTMLElement | null = document.querySelector('#app-header') || document.querySelector('header');
        if (!headerEl) return;
        const update = () => setPageHeaderHeight(headerEl ? headerEl.getBoundingClientRect().height : 0);
        update();
        const ro = new ResizeObserver(() => update());
        ro.observe(headerEl);
        window.addEventListener('resize', update);
        return () => {
            ro.disconnect();
            window.removeEventListener('resize', update);
        };
    }, []);

    const pageContainerStyle: React.CSSProperties = pageHeaderHeight > 0
        ? { height: `calc(100vh - ${pageHeaderHeight}px - 1px)`, boxSizing: 'border-box', overflow: 'hidden' }
        : { minHeight: '60vh', boxSizing: 'border-box', overflow: 'hidden' };

    return (
        <div style={pageContainerStyle} className='flex flex-1 min-h-0 bg-white dark:bg-zinc-900 overflow-hidden'>
            <div className='md:hidden w-full h-full min-h-0'>
                <div className='p-3 flex flex-col h-full min-h-0'>
                    <div className='flex items-center justify-between mb-2'>
                        <div className='text-sm font-semibold'>Messages</div>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className='rounded-md bg-gray-950/5 p-2 text-sm font-semibold text-gray-900 hover:bg-gray-950/10 dark:bg-white/10 dark:text-white'
                            aria-label='Open channels'
                        >
                            <svg xmlns='http://www.w3.org/2000/svg' className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
                                <path fillRule='evenodd' d='M3 5h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2zm0 4h14a1 1 0 010 2H3a1 1 0 110-2z' clipRule='evenodd' />
                            </svg>
                        </button>
                    </div>
                    {!showChatOnMobile ? (
                        isDMView ? (
                            <DMList
                                channels={channels}
                                onSelect={openChat}
                                searchQuery={searchQuery}
                                selectedChannel={selectedChannel}
                                isMobile={true}
                            />
                        ) : (
                            <div className='p-3'>
                                {channels.map((channel) => (
                                    <Button
                                        key={channel.id}
                                        onClick={() => openChat(channel)}
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
                        )
                    ) : (
                        <div className='flex-1 min-h-0 flex flex-col'>
                            <ChatWindow
                                user={user}
                                channel={selectedChannel}
                                messages={messages}
                                onSend={sendMessage}
                                onBack={() => setShowChatOnMobile(false)}
                                isMobile={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className='hidden md:flex w-full h-full min-h-0'>
                {isDMView ? (
                    <DMList
                        channels={channels}
                        onSelect={openChat}
                        searchQuery={searchQuery}
                        selectedChannel={selectedChannel}
                        isMobile={false}
                    />
                ) : (
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
                )}

                <div className='flex-1 flex flex-col'>
                    <ChatWindow
                        user={user}
                        channel={selectedChannel}
                        messages={messages}
                        onSend={(text) => sendMessage(text)}
                        onBack={() => {
                            if (selectedChannel) leaveChannel(selectedChannel.id);
                            setSelectedChannel(null);
                        }}
                        isMobile={false}
                        onDelete={(m) => handleDeleteMessage(m.id)}
                        allowDelete={true}
                    />
                </div>

                <ChannelDrawer
                    open={drawerOpen}
                    onClose={setDrawerOpen}
                    channels={channels}
                    onSelect={(c) => {
                        if (c.type === 'dm') {
                            const otherUser = (c as any).otherUser;
                            if (otherUser) navigate(`/dms/${otherUser.id}`);
                        }
                        selectChannel(c);
                        setShowChatOnMobile(true);
                    }}
                    isDMView={isDMView}
                />
            </div>
        </div>
    );
}
