import React, { useMemo } from 'react';
import Tippy from '@tippyjs/react/headless';
import { useNavigate } from 'react-router-dom';
import {
    ShieldCheckIcon,
    ShieldExclamationIcon
} from '@heroicons/react/24/outline';

import AvatarComponent from '@/components/users/Avatar';
import { getImagePath } from '@/shared/api/config';
import Pill from '@/components/common/Pill';

import type { UserDTO } from '@/shared/api/types';

const DISCORD_ICON_SRC = '/images/discord.svg';
const GOOGLE_ICON_SRC = '/images/google.png';

const SocialBadgeIcon = ({ src, alt, bg, label }: { src?: string; alt: string; bg?: string; label?: string }) => {
    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                title={alt}
                width={16}
                height={16}
                className='inline-block rounded-[3px] align-middle'
            />
        );
    }

    return (
        <span
            className='inline-flex items-center justify-center rounded-full text-[10px] font-bold text-white'
            style={{ width: 16, height: 16, backgroundColor: bg || '#6b7280' }}
            title={alt}
        >
            {label ?? ''}
        </span>
    );
};

type TriggerVariant = 'name' | 'avatar-name';

interface Props {
    user?: UserDTO;
    large?: boolean;
    triggerVariant?: TriggerVariant;
    className?: string;
    hoverDelayOpenMs?: number;
    hoverDelayCloseMs?: number;
    panelWidth?: number;
    sideOffset?: number;
    interactive?: boolean;
    triggerMode?: 'hover' | 'click' | 'focus' | 'hover+focus';
    subtitle?: React.ReactNode;
    centered?: boolean;
    nameClassName?: string;
    subtitleClassName?: string;
    disableTooltip?: boolean;
}

function fmtDate(d?: Date | string) {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

const UserCard: React.FC<Props> = ({
    user,
    large = false,
    triggerVariant = 'avatar-name',
    className = '',
    hoverDelayOpenMs = 60,
    hoverDelayCloseMs = 120,
    panelWidth = 320,
    sideOffset = 10,
    interactive = true,
    triggerMode = 'hover+focus',
    subtitle,
    centered = false,
    nameClassName = '',
    subtitleClassName = '',
    disableTooltip = false
}) => {
    const navigate = useNavigate();

    const username = user?.username;
    const displayName = user?.displayName || username || 'Anonymous';

    const trigger = useMemo(() => {
        const baseNameClasses = [
            'font-semibold',
            large ? 'text-lg' : 'text-sm',
            'truncate',
            'hover:underline',
            'cursor-pointer',
            nameClassName
        ].join(' ');

        const nameEl = (
            <span
                className={baseNameClasses}
                onClick={() => user?.id && navigate(`/user/${user.id}`)}
                title={username ? displayName : undefined}
            >
                {username ? (
                    <>
                        <span
                            className='block group-hover:hidden'
                            aria-hidden={true}
                        >
                            {displayName}
                        </span>
                        <span
                            className='hidden group-hover:block truncate'
                            aria-label={username}
                        >
                            {username}
                        </span>
                    </>
                ) : (
                    <span className='block'>{displayName}</span>
                )}
            </span>
        );

        const wrapperClasses =
            centered && subtitle
                ? 'group inline-flex flex-col items-center text-center gap-1'
                : 'group inline-flex items-center gap-2';

        const avatar = (
            <div
                onClick={() => user?.id && navigate(`/user/${user.id}`)}
                className='cursor-pointer'
            >
                <AvatarComponent
                    username={displayName}
                    avatar={user?.avatar ? getImagePath(user.avatar) : null}
                    size={large ? 48 : 28}
                />
            </div>
        );

        const content = (
            <div
                className={
                    centered && subtitle
                        ? 'min-w-0 flex flex-col items-center'
                        : 'min-w-0'
                }
            >
                {nameEl}
                {subtitle ? (
                    <div
                        className={[
                            'text-xs text-gray-500 dark:text-gray-400 truncate',
                            subtitleClassName
                        ].join(' ')}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </div>
        );

        if (triggerVariant === 'name') {
            return <div className={wrapperClasses}>{content}</div>;
        }

        return (
            <div className={wrapperClasses}>
                {avatar}
                {content}
            </div>
        );
    }, [
        triggerVariant,
        large,
        user?.id,
        user?.avatar,
        displayName,
        user?.username,
        navigate,
        subtitle,
        centered,
        nameClassName,
        subtitleClassName
    ]);

    const tippyTrigger =
        triggerMode === 'hover'
            ? 'mouseenter'
            : triggerMode === 'click'
                ? 'click'
                : triggerMode === 'focus'
                    ? 'focus'
                    : 'mouseenter focus';

    if (disableTooltip) {
        return (
            <div
                className={[
                    centered && subtitle
                        ? 'inline-flex w-full flex-col items-center text-center gap-2'
                        : 'inline-flex items-center gap-2',
                    'text-neutral-900 dark:text-neutral-100',
                    className
                ].join(' ')}
            >
                {trigger}
            </div>
        );
    }

    return (
        <Tippy
            placement='auto'
            offset={[0, sideOffset]}
            appendTo={() => document.body}
            interactive={interactive}
            delay={[hoverDelayOpenMs, hoverDelayCloseMs]}
            trigger={tippyTrigger}
            animation={false}
            duration={0}
            onMount={(inst) => {
                const el = inst.popper.firstElementChild as HTMLElement | null;
                if (!el) return;
                el.removeAttribute('data-open');
                requestAnimationFrame(() =>
                    el.setAttribute('data-open', 'true')
                );
            }}
            onHidden={(inst) => {
                const el = inst.popper.firstElementChild as HTMLElement | null;
                if (!el) return;
                el.removeAttribute('data-open');
                return new Promise<void>((resolve) => {
                    const done = () => resolve();
                    el.addEventListener('transitionend', done, { once: true });
                    setTimeout(done, 250);
                });
            }}
            render={(attrs) => (
                <div
                    {...attrs}
                    tabIndex={-1}
                    className={[
                        'rounded-2xl shadow-2xl ring-1 ring-black/5',
                        'bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md',
                        'p-3 w-[var(--card-w)] z-[1000] pointer-events-auto',
                        'opacity-0 scale-[0.99] transition-all duration-150',
                        "[data-placement^='top']:translate-y-2",
                        "[data-placement^='bottom']:-translate-y-2",
                        "data-[open='true']:opacity-100",
                        "data-[open='true']:scale-100",
                        "data-[open='true']:translate-y-0"
                    ].join(' ')}
                    style={
                        {
                            ['--card-w' as any]: `${panelWidth}px`
                        } as React.CSSProperties
                    }
                >
                    {user ? (
                        <div className='flex items-start gap-3'>
                            <AvatarComponent
                                username={displayName}
                                avatar={
                                    user.avatar
                                        ? getImagePath(user.avatar)
                                        : null
                                }
                                size={40}
                            />
                            <div className='min-w-0'>
                                <div className='flex items-center gap-2'>
                                    <button
                                        onClick={() =>
                                            user.id &&
                                            navigate(`/user/${user.id}`)
                                        }
                                        className='text-sm font-bold hover:underline truncate'
                                        title={username ?? 'View profile'}
                                    >
                                        {displayName}
                                    </button>

                                    {user.admin ? (
                                        <Pill
                                            tone='success'
                                            size='sm'
                                            leftIcon={
                                                <ShieldCheckIcon className='h-4 w-4' />
                                            }
                                        >
                                            Admin
                                        </Pill>
                                    ) : null}

                                    {user.isEmailVerified ? (
                                        <Pill
                                            tone='info'
                                            size='sm'
                                            leftIcon={
                                                <ShieldCheckIcon className='h-4 w-4' />
                                            }
                                        >
                                            Verified
                                        </Pill>
                                    ) : (
                                        <Pill
                                            tone='danger'
                                            size='sm'
                                            leftIcon={
                                                <ShieldExclamationIcon className='h-4 w-4' />
                                            }
                                        >
                                            Not Verified
                                        </Pill>
                                    )}
                                    <div className='ml-1 inline-flex items-center gap-1'>
                                        {user.discordID ? (
                                            <SocialBadgeIcon
                                                src={DISCORD_ICON_SRC}
                                                alt='Discord connected'
                                                bg='#7289DA'
                                                label='D'
                                            />
                                        ) : null}
                                        {user.googleID ? (
                                            <SocialBadgeIcon
                                                src={GOOGLE_ICON_SRC}
                                                alt='Google connected'
                                                bg='#4285F4'
                                                label='G'
                                            />
                                        ) : null}
                                    </div>
                                </div>

                                <div className='mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300'>
                                    <div className='truncate'>
                                        <span className='opacity-70'>
                                            Kudos:
                                        </span>{' '}
                                        {typeof user.kudos === 'number'
                                            ? user.kudos
                                            : 0}
                                    </div>
                                    <div className='truncate'>
                                        <span className='opacity-70'>
                                            Joined:
                                        </span>{' '}
                                        {fmtDate(user.createdAt) || '—'}
                                    </div>
                                    {user.email ? (
                                        <div className='truncate col-span-2'>
                                            <span className='opacity-70'>
                                                Email:
                                            </span>{' '}
                                            {user.email}
                                        </div>
                                    ) : null}
                                </div>

                                <div className='mt-3'>
                                    <button
                                        onClick={() =>
                                            user.id &&
                                            navigate(`/user/${user.id}`)
                                        }
                                        className='inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium
                                            bg-neutral-900 text-white dark:bg-white dark:text-neutral-900
                                            hover:opacity-90 active:opacity-80 transition'
                                    >
                                        View Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className='flex items-center justify-center py-6'>
                            <div className='h-5 w-5 rounded-full border-2 border-neutral-400 border-t-transparent animate-spin' />
                            <span className='ml-2 text-xs text-neutral-600 dark:text-neutral-300'>
                                Loading…
                            </span>
                        </div>
                    )}
                </div>
            )}
        >
            <div
                className={[
                    centered && subtitle
                        ? 'inline-flex w-full flex-col items-center text-center gap-2'
                        : 'inline-flex items-center gap-2',
                    'text-neutral-900 dark:text-neutral-100',
                    className
                ].join(' ')}
            >
                {trigger}
            </div>
        </Tippy>
    );
};

export default UserCard;
