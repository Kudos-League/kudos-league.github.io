import React, { useState, useEffect } from 'react';
import AvatarComponent from '@/components/Avatar';
import { getUserKudos } from '@/shared/api/actions';
import type { HandshakeDTO, UserDTO } from '@/shared/api/types';
import { useAuth } from '@/hooks/useAuth';

interface HandshakesProps {
    handshakes: HandshakeDTO[];
    sender: UserDTO;
    currentUserId: number | string | undefined;
    showAll: boolean;
    onShowAll: () => void;
    onAccept: (index: number) => void;
}

const Handshakes: React.FC<HandshakesProps> = ({
    handshakes,
    sender,
    currentUserId,
    showAll,
    onShowAll,
    onAccept
}) => {
    const { token } = useAuth();

    // Map: handshake.id => kudos
    const [kudosMap, setKudosMap] = useState<Record<string, number>>({});

    useEffect(() => {
        // Fetch kudos for all unique sender IDs in the displayed handshakes
        const uniqueSenders = Array.from(
            new Set(handshakes.map(h => h.senderID).filter(Boolean))
        );
        uniqueSenders.forEach(async (uid) => {
            try {
                if (uid && !(uid in kudosMap)) {
                    const val = await getUserKudos(uid, token);
                    setKudosMap(prev => ({ ...prev, [uid]: val }));
                }
            }
            catch (e) {
                console.error('Failed to fetch user kudos:', e);
            }
        });
        // eslint-disable-next-line
    }, [handshakes]);

    const isPostOwner = currentUserId === String(sender.id);

    const visibleHandshakes = showAll ? handshakes : handshakes.slice(0, 2);

    if (!handshakes.length) {
        return <p className='text-sm text-gray-500'>No handshakes yet.</p>;
    }

    return (
        <div className='space-y-4'>
            {visibleHandshakes.map((handshake, index) => {
                const isAcceptable = handshake.status === 'new' && isPostOwner;
                const senderUser = handshake.sender;
                const senderId = senderUser?.id;
                const kudos = senderId ? kudosMap[senderId] : undefined;

                return (
                    <div
                        key={handshake.id}
                        className='flex items-center gap-4 bg-gray-100 p-3 rounded'
                    >
                        <AvatarComponent
                            username={senderUser?.username || 'Anonymous'}
                            avatar={senderUser?.avatar}
                            size={40}
                        />
                        <div className='flex-1'>
                            <p className='font-semibold'>
                                {senderUser?.username || 'Unnamed'}
                            </p>
                            <p className='text-sm text-gray-600'>
                                Status: {handshake.status}
                            </p>
                            <p className='text-sm text-gray-600'>
                                Kudos:{' '}
                                {kudos || 0}
                            </p>
                        </div>
                        {isAcceptable && (
                            <button
                                onClick={() => onAccept(index)}
                                className='bg-green-600 text-white px-3 py-1 rounded'
                            >
                                Accept
                            </button>
                        )}
                    </div>
                );
            })}
            {handshakes.length > 2 && !showAll && (
                <button
                    onClick={onShowAll}
                    className='mt-2 text-sm text-blue-600 hover:underline'
                >
                    Show all handshakes
                </button>
            )}
        </div>
    );
};

export default Handshakes;
