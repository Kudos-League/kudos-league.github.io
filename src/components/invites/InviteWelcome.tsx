import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { routes } from '@/routes';
import { useAuth } from '@/contexts/useAuth';
import {
    readPendingInvite,
    savePendingInvite
} from '@/shared/invites/inviteCookie';

/** After this many page changes, nudge the visitor to sign up once. */
const PAGES_BEFORE_NUDGE = 3;
const HIDDEN_KEY = 'kudos_invite_banner_hidden';

type Mode = 'welcome' | 'bar' | 'nudge' | 'hidden';

const readHidden = () => {
    try {
        return sessionStorage.getItem(HIDDEN_KEY) === '1';
    }
    catch {
        return false;
    }
};

/**
 * Invite links land on the home page (`/?invite=…`). This saves the token in
 * the invite cookie, strips it from the URL, welcomes the visitor and invites
 * them to look around. A slim bar keeps a sign-up button in reach, and after a
 * few pages a card suggests signing up. The signup form reads the cookie, so
 * the invite applies whenever they get there.
 */
export default function InviteWelcome() {
    const { isLoggedIn, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [hasInvite, setHasInvite] = useState(() => !!readPendingInvite());
    const [mode, setMode] = useState<Mode>(() =>
        readHidden() ? 'hidden' : 'bar'
    );
    const pagesSeen = useRef(0);
    const nudged = useRef(false);

    // Capture ?invite= from any page, then clean the URL.
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const inviteToken = (params.get('invite') || '').trim();
        if (!inviteToken) return;

        savePendingInvite({
            inviteToken,
            emailToken: (params.get('emailToken') || '').trim() || undefined
        });
        params.delete('invite');
        params.delete('emailToken');
        const search = params.toString();
        navigate(
            {
                pathname: location.pathname,
                search: search ? `?${search}` : '',
                hash: location.hash
            },
            { replace: true }
        );

        setHasInvite(true);
        pagesSeen.current = 0;
        nudged.current = false;
        try {
            sessionStorage.removeItem(HIDDEN_KEY);
        }
        catch {
            // Storage blocked; the banner just won't remember being hidden.
        }
        setMode('welcome');
    }, [location.search, location.pathname, location.hash, navigate]);

    // Count pages browsed while the bar is showing; nudge once.
    useEffect(() => {
        if (mode !== 'bar' || nudged.current) return;
        pagesSeen.current += 1;
        if (pagesSeen.current > PAGES_BEFORE_NUDGE) {
            nudged.current = true;
            setMode('nudge');
        }
    }, [location.pathname]);

    if (loading || isLoggedIn || !hasInvite || mode === 'hidden') return null;

    const hide = () => {
        try {
            sessionStorage.setItem(HIDDEN_KEY, '1');
        }
        catch {
            // ignore
        }
        setMode('hidden');
    };

    const signUpButton = (label: string) => (
        <Link
            to={routes.signUp}
            className='inline-flex items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white shadow-xs hover:bg-brand-500 hover:text-white dark:bg-brand-400 dark:hover:bg-brand-300'
        >
            {label}
        </Link>
    );

    if (mode === 'welcome') {
        return (
            <div
                className='fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-4'
                role='dialog'
                aria-modal='true'
                aria-labelledby='invite-welcome-title'
            >
                <div className='w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900 dark:text-zinc-100 space-y-4'>
                    <h2
                        id='invite-welcome-title'
                        className='text-xl font-bold'
                    >
                        You&apos;ve been invited to Kudos League
                    </h2>
                    <p className='text-sm text-slate-600 dark:text-zinc-300'>
                        It&apos;s a community for giving and receiving help:
                        people offer things, ask for what they need, and thank
                        each other with kudos.
                    </p>
                    <p className='text-sm text-slate-600 dark:text-zinc-300'>
                        Have a look around first to see what people are offering
                        and asking for. Your invite is saved on this device for
                        7 days, so you can sign up whenever you&apos;re ready.
                    </p>
                    <div className='flex flex-col-reverse sm:flex-row gap-2 sm:justify-end'>
                        <button
                            type='button'
                            onClick={() => setMode('bar')}
                            className='rounded-md px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:text-zinc-200 dark:ring-zinc-700 dark:hover:bg-white/10 dark:hover:text-white'
                            autoFocus
                        >
                            Look around first
                        </button>
                        {signUpButton('Sign up now')}
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'nudge') {
        return (
            <div
                className='fixed bottom-4 right-4 left-4 sm:left-auto z-[80] sm:w-80 rounded-xl bg-white p-4 shadow-xl ring-1 ring-slate-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700 space-y-3'
                role='status'
            >
                <p className='font-semibold'>Like what you see?</p>
                <p className='text-sm text-slate-600 dark:text-zinc-300'>
                    Sign up with your invite to post, offer help and earn kudos.
                </p>
                <div className='flex gap-2 justify-end'>
                    <button
                        type='button'
                        onClick={() => setMode('bar')}
                        className='rounded-md px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white'
                    >
                        Keep browsing
                    </button>
                    {signUpButton('Sign up')}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-2 bg-brand-50 px-3 py-2 text-center text-sm text-slate-800 dark:bg-brand-900/40 dark:text-zinc-100'>
            <span>You have an invite waiting. Look around, then join in.</span>
            {signUpButton('Sign up')}
            <button
                type='button'
                onClick={hide}
                aria-label='Hide for now'
                title='Hide for now'
                className='px-1 text-lg leading-none text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white'
            >
                ×
            </button>
        </div>
    );
}
