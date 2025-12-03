import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import ChannelDrawer from './ChannelDrawer';
import { apiGet } from '@/shared/api/apiClient';
import { MessageDTO, ChannelDTO } from '@/shared/api/types';
import { useAuth } from '@/contexts/useAuth';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useMobileChat } from '@/contexts/MobileChatContext';
import DMList from './DMList';
import ChatWindow from './ChatWindow';
import { usePublicChannels } from '@/shared/api/queries/messages';
import { useDeleteMessage, useUpdateMessage } from '@/shared/api/mutations/messages';
import Button from '@/components/common/Button';

type Props = {
    channelType?: 'dm' | 'public'
};

export default function Chat({ channelType }: Props) {
    const [pageHeaderHeight, setPageHeaderHeight] = useState<number>(0);
    const { id: targetUserID } = useParams<{ id: string }>();
    const { token, user } = useAuth();
    const { messages, setMessages, joinChannel, leaveChannel, send } = useWebSocketContext();
    const { setIsInMobileChat } = useMobileChat();

    const [channels, setChannels] = useState<ChannelDTO[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<ChannelDTO | null>(null);
    const [pendingChannel, setPendingChannel] = useState<ChannelDTO | null>(null);
    const [searchQuery] = useState('');
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isLoadingChannels, setIsLoadingChannels] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const channelsQuery = usePublicChannels();
    const location = useLocation();
    const deleteMessageMutation = useDeleteMessage();
    const updateMessageMutation = useUpdateMessage();

    const routeIsDM = location.pathname.includes('/dms') || Boolean(targetUserID);
    const isDMFromProp = channelType === 'dm';
    const resolvedIsDM = channelType ? isDMFromProp : routeIsDM;

    // Track previous value to detect actual mode changes
    const prevResolvedIsDM = useRef<boolean | null>(null);

    // Update mobile chat context when showChatOnMobile changes (DMs only, mobile only)
    useEffect(() => {
        const isMobile = window.innerWidth < 768; // md breakpoint
        setIsInMobileChat(showChatOnMobile && resolvedIsDM && isMobile);
    }, [showChatOnMobile, resolvedIsDM, setIsInMobileChat]);

    useEffect(() => {
        // Only reset when actually switching between DM and Forum modes
        if (prevResolvedIsDM.current !== null && prevResolvedIsDM.current !== resolvedIsDM) {
            setSelectedChannel(null);
            setMessages([]);
            setShowChatOnMobile(false);
            setIsLoadingMessages(false);
            setIsLoadingChannels(false);
        }
        prevResolvedIsDM.current = resolvedIsDM;
    }, [resolvedIsDM]);

    useEffect(() => {
        if (resolvedIsDM) return;

        if (channelsQuery.data && channelsQuery.data.length > 0) {
            setChannels(channelsQuery.data);

            // Auto-select first public channel if none selected
            if (!selectedChannel) {
                selectChannel(channelsQuery.data[0]);
                setShowChatOnMobile(true);
            }
        }
    }, [channelsQuery.data, resolvedIsDM, selectedChannel]);

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
            setIsLoadingMessages(true);
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
            setIsLoadingMessages(false);
            setPendingChannel(null);
        }
    };

    useEffect(() => {
        if (token && pendingChannel) {
            (async () => {
                try {
                    setIsLoadingMessages(true);
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
                    setIsLoadingMessages(false);
                    setPendingChannel(null);
                }
            })();
        }
    }, [token, pendingChannel]);

    useEffect(() => {
        const fetchDMChannels = async () => {
            if (!(user && token)) return;

            try {
                setIsLoadingChannels(true);
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
                            if (channelMessages && channelMessages.length > 0) {
                                // Sort messages by createdAt to ensure we get the actual last message
                                const sortedMessages = [...channelMessages].sort((a, b) => {
                                    const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                                    const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                                    return dateB - dateA; // Descending order (newest first)
                                });
                                const lastMessage = sortedMessages[0]; // Get the most recent message
                                return { ...channel, lastMessage } as ChannelDTO;
                            }
                            return channel;
                        }
                        catch (error) {
                            console.error(`Error fetching messages for channel ${channel.id}:`, error);
                            return channel;
                        }
                    })
                );

                // Sort channels by last message timestamp (most recent first)
                const sortedChannels = channelsWithLastMessage.sort((a, b) => {
                    const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt || a.lastMessage.updatedAt || 0).getTime() : 0;
                    const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt || b.lastMessage.updatedAt || 0).getTime() : 0;
                    return dateB - dateA; // Most recent first
                });

                setChannels(sortedChannels);

                if (targetUserID) {
                    const parsedId = Number(targetUserID);
                    const matchedChannel = channelsWithLastMessage.find((channel) => channel.users.some((u: any) => u.id === parsedId));

                    if (matchedChannel) {
                        // Use selectChannel to properly fetch messages and set loading states
                        await selectChannel(matchedChannel);
                        setShowChatOnMobile(true);
                    }
                }
            }
            catch (e) {
                console.error('Failed to load DM channels', e);
            }
            finally {
                setIsLoadingChannels(false);
            }
        };

        if (resolvedIsDM) {
            fetchDMChannels();
        }
    }, [user, token, targetUserID, joinChannel, resolvedIsDM, channelType]);

    useEffect(() => {
        if (messages.length > 0 && selectedChannel) {
            // Sort messages to get the actual last message (most recent)
            const sortedMessages = [...messages].sort((a, b) => {
                const dateA = new Date(a.createdAt || a.updatedAt || 0).getTime();
                const dateB = new Date(b.createdAt || b.updatedAt || 0).getTime();
                return dateB - dateA; // Descending order (newest first)
            });
            const lastMessage = sortedMessages[0];

            setChannels((prevChannels) => {
                // Update the channel with the new last message
                const updatedChannels = prevChannels.map((channel) =>
                    channel.id === selectedChannel.id
                        ? { ...channel, lastMessage }
                        : channel
                );

                // Re-sort channels by last message timestamp (most recent first)
                return updatedChannels.sort((a, b) => {
                    const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt || a.lastMessage.updatedAt || 0).getTime() : 0;
                    const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt || b.lastMessage.updatedAt || 0).getTime() : 0;
                    return dateB - dateA; // Most recent first
                });
            });
        }
    }, [messages, selectedChannel]);

    const openChat = async (channel: ChannelDTO) => {
        await selectChannel(channel);
        setShowChatOnMobile(true);
    };

    const sendMessage = async (text?: string, replyToId?: number) => {
        if (!text || !text.trim() || !selectedChannel) return;
        if (selectedChannel.type !== 'dm') {
            await send({ 
                channel: selectedChannel, 
                content: text,
                ...(replyToId ? { replyToMessageID: replyToId } : {})
            });
        }
        else {
            const receiver = selectedChannel.users.find((u: any) => u.id !== user?.id);
            if (!receiver) return;
            await send({ 
                receiverID: receiver.id, 
                content: text,
                ...(replyToId ? { replyToMessageID: replyToId } : {})
            });
        }
    };

    const handleEditMessage = async (messageId: number, content: string) => {
        if (!content.trim()) return;
        
        try {
            // Find the original message to preserve data
            const originalMessage = messages.find(m => m.id === messageId);
            if (!originalMessage) return;

            // Update via API
            const response = await updateMessageMutation.mutateAsync({
                id: messageId,
                content: content.trim()
            });

            // Update local state with merged data (preserve author info)
            const updatedMessage: MessageDTO = {
                ...response,
                author: response.author || originalMessage.author
            };

            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? updatedMessage : m))
            );
        }
        catch (err) {
            console.error('Failed to edit message:', err);
            alert('Failed to edit message. Please try again.');
        }
    };

    const handleDeleteMessage = async (messageId: number) => {
        try {
            await deleteMessageMutation.mutateAsync(messageId);
            const original = messages.find((m) => m.id === messageId);
            if (!original) {
                setMessages((prev) => prev.filter((m) => m.id !== messageId));
                return;
            }

            // Mark as deleted but don't expose content
            const enriched = {
                ...original,
                content: '', // Clear the content
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

    // On mobile when in a DM chat, use full viewport height (navbar is hidden)
    // For forum, always use header height calculation (navbar stays visible)
    const pageContainerStyle: React.CSSProperties = showChatOnMobile && resolvedIsDM && window.innerWidth < 768
        ? { boxSizing: 'border-box', height: '100vh', minHeight: '100vh' }
        : pageHeaderHeight > 0
            ? { boxSizing: 'border-box', height: `calc(100vh - ${pageHeaderHeight}px)` }
            : { minHeight: '60vh', boxSizing: 'border-box' };

    return (
        <div style={pageContainerStyle} className='flex flex-1 min-h-0 bg-white dark:bg-zinc-900 overflow-hidden'>
            <div className='md:hidden w-full h-full min-h-0 overflow-hidden'>
                <div className='flex flex-col h-full min-h-0 overflow-hidden'>
                    <div className='flex items-center justify-between mb-2'>
                    </div>
                    {!showChatOnMobile && isDMView ? (
                        <DMList
                            channels={channels}
                            onSelect={openChat}
                            searchQuery={searchQuery}
                            selectedChannel={selectedChannel}
                            isMobile={true}
                            isLoading={isLoadingChannels}
                        />
                    ) : (
                        <div className='flex-1 min-h-0 flex flex-col overflow-hidden'>
                            <ChatWindow
                                user={user}
                                channel={selectedChannel}
                                messages={messages}
                                onSend={sendMessage}
                                onBack={isDMView ? () => setShowChatOnMobile(false) : undefined}
                                isMobile={true}
                                allowEdit={true}
                                onEdit={handleEditMessage}
                                isLoading={isLoadingMessages}
                                hideHeader={!isDMView}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className='hidden md:flex w-full h-full min-h-0 overflow-hidden'>
                {isDMView && (
                    <DMList
                        channels={channels}
                        onSelect={openChat}
                        searchQuery={searchQuery}
                        selectedChannel={selectedChannel}
                        isMobile={false}
                        isLoading={isLoadingChannels}
                    />
                )}

                <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
                    <ChatWindow
                        user={user}
                        channel={selectedChannel}
                        messages={messages}
                        onSend={(text, replyToId) => sendMessage(text, replyToId)}
                        onBack={() => {
                            if (selectedChannel) leaveChannel(selectedChannel.id);
                            setSelectedChannel(null);
                        }}
                        isMobile={false}
                        onDelete={(m) => handleDeleteMessage(m.id)}
                        allowDelete={true}
                        allowEdit={true}
                        onEdit={handleEditMessage}
                        isLoading={isLoadingMessages}
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
