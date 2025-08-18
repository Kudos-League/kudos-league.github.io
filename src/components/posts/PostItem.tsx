import React, { useState, MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import UserCard from '@/components/users/UserCard';
import HandshakeCard from '@/components/handshakes/HandshakeCard';
import Pill from '@/components/common/Pill';
import { getImagePath } from '@/shared/api/config';
import { PostDTO } from '@/shared/api/types';
import { useAuth } from '@/hooks/useAuth';

function truncateBody(body: string, max = 100) {
    return body.length <= max ? body : body.slice(0, max) + '…';
}

function getUserHandshake(post: Partial<PostDTO>, viewerID?: number) {
    if (!viewerID || !post.handshakes?.length) return;
    return post.handshakes.find(h => h.senderID === viewerID || h.receiverID === viewerID);
}

export type ActivityItemProps = {
  post: PostDTO;
  showHandshakeShortcut?: boolean;
  rightTimeLabel?: string;
  rightTimeDateTime?: string;
};

export default function PostCard({
    post,
    showHandshakeShortcut = false,
    rightTimeLabel,
    rightTimeDateTime,
}: ActivityItemProps) {
    const { id, title, body, images, sender, status, handshakes, tags = [] } = post;

    const { user } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    const imageSrc = images?.[0] ? getImagePath(images[0]) : undefined;
    const hasImage = !!imageSrc && !imgError;
    const viewerHandshake = getUserHandshake({ handshakes }, user?.id);

    const onCardClick = () => navigate(`/post/${id}`);

    return (
        <li className="relative">
            <div
                className="flex items-stretch gap-3 rounded-md ring-1 ring-inset ring-gray-200 dark:ring-white/15 bg-white dark:bg-gray-900 p-3 hover:ring-gray-300 dark:hover:ring-white/25 transition cursor-pointer"
                onClick={onCardClick}
            >
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        {status === 'closed' && (
                            <span className="bg-red-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded whitespace-nowrap">
                                CLOSED
                            </span>
                        )}

                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white break-words">
                            {title}
                        </h2>

                        {rightTimeLabel && (
                            <>
                                <span aria-hidden className="text-gray-300 dark:text-white/30">•</span>
                                <time
                                    dateTime={rightTimeDateTime}
                                    className="text-xs text-gray-500 dark:text-gray-400"
                                >
                                    {rightTimeLabel}
                                </time>
                            </>
                        )}
                    </div>

                    {sender && (
                        <div className="mt-2">
                            <UserCard
                                userID={sender.id}
                                username={sender.username}
                                avatar={sender.avatar}
                                kudos={sender.kudos}
                            />
                        </div>
                    )}

                    {!!tags.length && (
                        <div className="mt-2 flex flex-wrap gap-1">
                            {tags.map((tag, i) => (
                                <Pill key={i} name={tag.name} />
                            ))}
                        </div>
                    )}

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3 break-words">
                        {body}
                    </p>

                    {viewerHandshake && showHandshakeShortcut && (
                        <div
                            className="mt-3"
                            onClick={(e: MouseEvent) => {
                                e.stopPropagation();
                            }}
                        >
                            <HandshakeCard
                                handshake={{ ...viewerHandshake, post }}
                                userID={user?.id}
                                showPostDetails={false}
                            />
                        </div>
                    )}
                </div>

                <div className="my-auto w-48 sm:w-56 md:w-64 shrink-0 overflow-hidden rounded">
                    {hasImage ? (
                        <img
                            src={imageSrc}
                            alt={title}
                            className="h-full w-auto object-contain"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="flex items-center justify-center bg-gray-100 dark:bg-white/5 px-2 rounded">
                            <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center leading-snug">
                                {truncateBody(body)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </li>
    );
}