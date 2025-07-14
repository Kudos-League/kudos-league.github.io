import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEndpointUrl, getImagePath } from '@/shared/api/config';
import UserCard from '@/components/users/UserCard';
import { PostDTO } from '@/shared/api/types';
import { useAuth } from '@/hooks/useAuth';
import HandshakeCard from '@/components/handshakes/HandshakeCard';

function truncateBody(body: string, max = 100) {
    return body.length <= max ? body : body.slice(0, max) + '…';
}

function getUserHandshake(post: Partial<PostDTO>, viewerID?: number) {
    if (!viewerID || !post.handshakes?.length) return;
    return post.handshakes.find(
        h => h.senderID === viewerID || h.receiverID === viewerID
    );
}

interface Props extends PostDTO {
  fake?: boolean;
  showHandshakeShortcut?: boolean;
}

export default function PostCard(props: Props) {
    const {
        id, title, body, images, sender, status, handshakes,
        fake, showHandshakeShortcut = false
    } = props;

    const { user } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const imageSrc = fake ? images?.[0] : images?.[0] ? getImagePath(images[0]): undefined;
    const showBodyInImageBox = imgError || !images?.length || !imageSrc;

    const viewerHandshake = getUserHandshake(
        { handshakes },
        user?.id
    );

    return (
        <div
            className="border rounded p-4 mb-4 bg-white shadow hover:shadow-md cursor-pointer transition"
            onClick={() => navigate(`/post/${id}`)}
        >
            <div className="flex justify-between items-start gap-4 w-full">
                <div className="flex-1 pr-4 w-4/5">
                    <div className="flex items-center gap-2 mb-2">
                        {status === 'closed' && (
                            <span className="bg-red-600 text-white text-xs font-semibold
                               px-2 py-1 rounded whitespace-nowrap">
                                CLOSED
                            </span>
                        )}
                        <h2 className="text-lg font-bold break-words">{title}</h2>
                    </div>

                    {sender && (
                        <div className="mb-2">
                            <UserCard
                                userID={sender.id}
                                username={sender.username}
                                avatar={sender.avatar}
                                kudos={sender.kudos}
                            />
                        </div>
                    )}

                    <p className="text-sm text-gray-600 line-clamp-3 mr-2 break-words">{body}</p>
                </div>

                <div className="w-20 h-20 flex items-center justify-center mt-2">
                    {showBodyInImageBox ? (
                        <div className="w-full h-full bg-gray-100 text-xs text-gray-600
                            rounded flex items-center justify-center text-center
                            p-2 overflow-hidden">
                            {truncateBody(body)}
                        </div>
                    ) : (
                        <img
                            src={imageSrc}
                            alt={title}
                            className="w-20 h-20 object-cover rounded"
                            onError={() => setImgError(true)}
                        />
                    )}
                </div>
            </div>

            {viewerHandshake && showHandshakeShortcut && (
                <div
                    className="mt-4"
                    onClick={e => e.stopPropagation()}
                >
                    <HandshakeCard
                        handshake={{
                            ...viewerHandshake,
                            post: props
                        }}
                        userID={user?.id}
                        showPostDetails={false}
                    />
                </div>
            )}
        </div>
    );
}
