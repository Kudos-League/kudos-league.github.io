import React from 'react';
import { HandshakeDTO, UserDTO } from '@/shared/api/types';
import HandshakeCard from './HandshakeCard';

interface HandshakesProps {
    handshakes: HandshakeDTO[];
    sender: UserDTO;
    currentUserId: number | string | undefined;
    showAll: boolean;
    onShowAll: () => void;
    onHandshakeCreated?: (handshake: HandshakeDTO) => void;
    showPostDetails?: boolean;
}

const Handshakes: React.FC<HandshakesProps> = ({
    handshakes,
    currentUserId,
    showAll,
    onShowAll,
    onHandshakeCreated,
    showPostDetails
}) => {
    const visibleHandshakes = showAll ? handshakes : handshakes.slice(0, 2);

    if (!handshakes.length) {
        return <p className='text-sm text-gray-500'>Nothing yet!</p>;
    }

    return (
        <div className='space-y-4'>
            {visibleHandshakes.map((handshake) => (
                <HandshakeCard
                    key={handshake.id}
                    handshake={handshake}
                    userID={String(currentUserId)}
                    onHandshakeCreated={onHandshakeCreated}
                    showPostDetails={showPostDetails}
                />
            ))}

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
