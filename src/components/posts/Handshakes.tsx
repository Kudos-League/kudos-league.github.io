import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
}

const Handshakes: React.FC<HandshakesProps> = ({
    handshakes,
    sender,
    currentUserId,
    showAll,
    onShowAll
}) => {
    const { token } = useAuth();
    const navigate = useNavigate();

    const [kudosMap, setKudosMap] = useState<Record<string, number>>({});

    useEffect(() => {
        const uniqueSenders = Array.from(
            new Set(handshakes.map(h => h.senderID).filter(Boolean))
        );
        uniqueSenders.forEach(async (uid) => {
            if (uid && !(uid in kudosMap)) {
                try {
                    const val = await getUserKudos(uid, token);
                    setKudosMap(prev => ({ ...prev, [uid]: val }));
                }
                catch (e) {
                    console.error(`Error fetching kudos for user ${uid}:`, e);
                    setKudosMap(prev => ({ ...prev, [uid]: 0 })); // Fallback to 0 if error
                }
            }
        });
        // eslint-disable-next-line
    }, [handshakes]);

    const isPostOwner = String(currentUserId) === String(sender.id);
    const visibleHandshakes = showAll ? handshakes : handshakes.slice(0, 2);

    if (!handshakes.length) {
        return <p className='text-sm text-gray-500'>Nothing yet!</p>;
    }

    return (
        <div className='space-y-4'>
            {visibleHandshakes.map((handshake) => {
                const isAcceptable = handshake.status === 'new' && isPostOwner;
                const senderUser = handshake.sender;
                const senderId = senderUser?.id;
                const kudos = senderId ? kudosMap[senderId] : undefined;

                return (
                    <div
                        key={handshake.id}
                        className='flex items-center gap-4 bg-gray-100 p-3 rounded'
                    >
                        {/* Avatar as a link to user profile */}
                        <Link to={senderUser?.id ? `/user/${senderUser.id}` : '#'}>
                            <AvatarComponent
                                avatar={senderUser?.avatar}
                                username={senderUser?.username || 'Anonymous'}
                                size={40}
                            />
                        </Link>
                        <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
                                <span className='font-semibold truncate'>
                                    {senderUser?.username || 'Unnamed'}
                                </span>
                                <span className={`px-2 py-1 rounded text-xs text-white 
                                    ${handshake.status === 'new' ? 'bg-yellow-500'
                        : handshake.status === 'accepted' ? 'bg-blue-600'
                            : 'bg-green-600'}`}>
                                    {handshake.status}
                                </span>
                            </div>
                            <p className='text-xs text-gray-500 truncate'>
                                Kudos: {kudos !== undefined ? kudos : '...'}
                            </p>
                            <p className='text-xs text-gray-400'>
                                {new Date(handshake.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        {isAcceptable && (
                            <button
                                className='bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700'
                                onClick={() => navigate(`/post/${handshake.postID}`)}
                                title='Accept and view post'
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
