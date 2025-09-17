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
}

const Handshakes: React.FC<HandshakesProps> = ({
    handshakes,
    currentUserId,
    showAll,
    onShowAll,
    onHandshakeCreated,
    showPostDetails,
    onHandshakeDeleted
}) => {
    const visibleHandshakes = showAll ? handshakes : handshakes.slice(0, 2);

    if (!handshakes.length) {
        return <p className='text-sm text-gray-500'>Nothing yet!</p>;
    }

    return (
        <div className='space-y-4'>
            {visibleHandshakes.reverse().map((handshake) => (
                handshake.post.isRequest ?
                    // If it's request
                    (<HandshakeCard
                        key={handshake.id}
                        handshake={handshake}
                        userID={handshake.post.senderID}
                        onHandshakeCreated={onHandshakeCreated}
                        showPostDetails={showPostDetails}
                        onDelete={onHandshakeDeleted}
                    />) :
                    // If it's gift
                    (<HandshakeCard
                        key={handshake.id}
                        handshake={handshake}
                        userID={handshake.post.senderID}
                        onHandshakeCreated={onHandshakeCreated}
                        showPostDetails={showPostDetails}
                        onDelete={onHandshakeDeleted}
                    />)
            ))}

            {handshakes.length > 2 && !showAll && (
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
