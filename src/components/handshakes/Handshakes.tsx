import React from 'react';
import { HandshakeDTO, UserDTO } from '@/shared/api/types';
import HandshakeCard from './HandshakeCard';
import Button from '../common/Button';

interface HandshakesProps {
    handshakes: HandshakeDTO[];
    currentUserId: number | undefined;
    showAll: boolean;
    onShowAll: () => void;
    onHandshakeCreated?: (handshake: HandshakeDTO) => void;
    showPostDetails?: boolean;
    onHandshakeDeleted?: (id: number) => void;
    showSenderOrReceiver?: 'sender' | 'receiver';
    showUserKudos?: boolean;
    onHandshakeInteraction?: () => void;
}

const Handshakes: React.FC<HandshakesProps> = ({
    handshakes,
    currentUserId,
    showAll,
    onShowAll,
    onHandshakeCreated,
    showPostDetails,
    onHandshakeDeleted,
    showSenderOrReceiver,
    showUserKudos = false,
    onHandshakeInteraction
}) => {
    // Filter out cancelled handshakes
    const activeHandshakes = handshakes.filter(
        (handshake) => handshake.status !== 'cancelled'
    );

    const visibleHandshakes = showAll
        ? activeHandshakes
        : activeHandshakes.slice(0, 2);

    if (!activeHandshakes.length) {
        return <p className='text-sm text-gray-500'>Nothing yet!</p>;
    }

    return (
        <div className='space-y-4'>
            {visibleHandshakes.map((handshake) => (
                <HandshakeCard
                    key={handshake.id}
                    handshake={handshake}
                    userID={currentUserId}
                    onHandshakeCreated={onHandshakeCreated}
                    showPostDetails={showPostDetails}
                    onDelete={onHandshakeDeleted}
                    showSenderOrReceiver={showSenderOrReceiver}
                    showUserKudos={showUserKudos}
                    onInteraction={onHandshakeInteraction}
                />
            ))}

            {activeHandshakes.length > 2 && !showAll && (
                <Button
                    onClick={onShowAll}
                    className='mt-2 text-sm hover:underline'
                >
                    Show all handshakes
                </Button>
            )}
        </div>
    );
};

export default Handshakes;
