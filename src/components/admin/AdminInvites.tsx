import React, { useCallback, useEffect, useState } from 'react';
import UserCard from '@/components/users/UserCard';
import Button from '@/components/common/Button';
import InviteQrCard from '@/components/users/InviteQrCard';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import {
    UserDTO,
    UserInviteDTO,
    UserInviteListResponse
} from '@/shared/api/types';
import {
    inviteErrorMessage,
    inviteStatusLabel,
    inviteUseCount,
    isInviteExhausted
} from '@/shared/invites/inviteStatus';

const PAGE_SIZE = 20;
const MAX_USES_LIMIT = 10000;
const BULK_LIMIT = 200;

type CreateInviteResponse = {
    token: string;
    inviteUrl?: string | null;
    invite: UserInviteDTO;
};

type BulkInviteResult = {
    email: string;
    status: 'sent' | 'failed';
    error?: string;
    inviteUrl?: string | null;
    invite?: UserInviteDTO;
};

type InviteMember = { user: UserDTO; joinedAt: string };

type MembersState = {
    loading: boolean;
    error?: string;
    members?: InviteMember[];
};

const inputClass =
    'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-xs focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const labelClass =
    'block text-sm font-medium text-slate-700 dark:text-zinc-200 mb-1';
const sectionClass =
    'rounded-lg border border-slate-200 dark:border-zinc-700 p-4 space-y-3';

/** Splits pasted text (newlines, commas, semicolons, spaces) into addresses. */
const parseEmails = (text: string) =>
    Array.from(
        new Set(
            text
                .split(/[\s,;]+/)
                .map((part) => part.trim().toLowerCase())
                .filter(Boolean)
        )
    );

const formatDate = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString();
};

export default function AdminInvites() {
    // Shared QR link
    const [maxUses, setMaxUses] = useState('1');
    const [label, setLabel] = useState('');
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [created, setCreated] = useState<{
        inviteUrl: string;
        maxUses: number;
        label: string;
    } | null>(null);

    // Email list
    const [emailText, setEmailText] = useState('');
    const [bulkLabel, setBulkLabel] = useState('');
    const [sending, setSending] = useState(false);
    const [bulkError, setBulkError] = useState<string | null>(null);
    const [bulkResults, setBulkResults] = useState<BulkInviteResult[] | null>(
        null
    );

    // Invite list
    const [invites, setInvites] = useState<UserInviteDTO[]>([]);
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [listError, setListError] = useState<string | null>(null);
    const [revoking, setRevoking] = useState<number | null>(null);

    // People who joined through each invite, loaded when a row is opened.
    const [openInviteID, setOpenInviteID] = useState<number | null>(null);
    const [membersByInvite, setMembersByInvite] = useState<
        Record<number, MembersState>
    >({});

    const toggleMembers = async (inviteID: number) => {
        if (openInviteID === inviteID) {
            setOpenInviteID(null);
            return;
        }
        setOpenInviteID(inviteID);
        // Always refetch so newly joined people show up.
        setMembersByInvite((prev) => ({
            ...prev,
            [inviteID]: { ...prev[inviteID], loading: true, error: undefined }
        }));
        try {
            const data = await apiGet<{
                invite: UserInviteDTO;
                members: InviteMember[];
            }>(`/users/invites/${inviteID}/members`);
            setMembersByInvite((prev) => ({
                ...prev,
                [inviteID]: { loading: false, members: data?.members ?? [] }
            }));
            if (data?.invite) {
                setInvites((prev) =>
                    prev.map((invite) =>
                        invite.id === inviteID
                            ? { ...invite, ...data.invite }
                            : invite
                    )
                );
            }
        }
        catch (err) {
            setMembersByInvite((prev) => ({
                ...prev,
                [inviteID]: {
                    loading: false,
                    error: inviteErrorMessage(err, 'Failed to load who joined.')
                }
            }));
        }
    };

    const loadInvites = useCallback(async (cursor?: number) => {
        setLoading(true);
        setListError(null);
        try {
            const params: Record<string, number> = { limit: PAGE_SIZE };
            if (typeof cursor === 'number') params.cursor = cursor;
            const data = await apiGet<UserInviteListResponse>(
                '/users/invites',
                { params }
            );
            const page = Array.isArray(data?.invites) ? data.invites : [];
            setInvites((prev) =>
                typeof cursor === 'number' ? prev.concat(page) : page
            );
            setNextCursor(
                typeof data?.nextCursor === 'number' ? data.nextCursor : null
            );
        }
        catch (err) {
            setListError(inviteErrorMessage(err, 'Failed to load invites.'));
        }
        finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInvites();
    }, [loadInvites]);

    const parsedMaxUses = Number(maxUses);
    const maxUsesValid =
        Number.isInteger(parsedMaxUses) &&
        parsedMaxUses >= 1 &&
        parsedMaxUses <= MAX_USES_LIMIT;

    const createSharedInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!maxUsesValid) return;
        setCreating(true);
        setCreateError(null);
        setCreated(null);
        try {
            const body = {
                maxUses: parsedMaxUses,
                ...(label.trim() ? { label: label.trim() } : {})
            };
            const response = await apiMutate<CreateInviteResponse, typeof body>(
                '/users/invites',
                'post',
                body
            );
            const inviteUrl =
                response.inviteUrl ?? response.invite.inviteUrl ?? null;
            if (!inviteUrl) {
                setCreateError(
                    'The invite was created, but the server has no APP_URL set, so there is no link to show.'
                );
            }
            else {
                setCreated({
                    inviteUrl,
                    maxUses: parsedMaxUses,
                    label: label.trim()
                });
            }
            setInvites((prev) => [response.invite, ...prev]);
            setLabel('');
        }
        catch (err) {
            setCreateError(inviteErrorMessage(err, 'Failed to create invite.'));
        }
        finally {
            setCreating(false);
        }
    };

    const emails = parseEmails(emailText);
    const tooManyEmails = emails.length > BULK_LIMIT;

    const sendBulkInvites = async (e: React.FormEvent) => {
        e.preventDefault();
        if (emails.length === 0 || tooManyEmails) return;
        setSending(true);
        setBulkError(null);
        setBulkResults(null);
        try {
            const body = {
                emails,
                ...(bulkLabel.trim() ? { label: bulkLabel.trim() } : {})
            };
            const response = await apiMutate<
                { results: BulkInviteResult[] },
                typeof body
            >('/users/invites/bulk', 'post', body);
            const results = response?.results ?? [];
            setBulkResults(results);
            // Keep only the addresses that failed so they can be fixed and resent.
            setEmailText(
                results
                    .filter((r) => r.status === 'failed')
                    .map((r) => r.email)
                    .join('\n')
            );
            await loadInvites();
        }
        catch (err) {
            setBulkError(inviteErrorMessage(err, 'Failed to send invites.'));
        }
        finally {
            setSending(false);
        }
    };

    const revokeInvite = async (inviteID: number) => {
        setRevoking(inviteID);
        setListError(null);
        try {
            await apiMutate(`/users/invites/${inviteID}`, 'delete');
            setInvites((prev) =>
                prev.map((invite) =>
                    invite.id === inviteID
                        ? { ...invite, revoked: true }
                        : invite
                )
            );
        }
        catch (err) {
            setListError(inviteErrorMessage(err, 'Failed to revoke invite.'));
        }
        finally {
            setRevoking(null);
        }
    };

    const sentCount = bulkResults?.filter((r) => r.status === 'sent').length;
    const failed = bulkResults?.filter((r) => r.status === 'failed') ?? [];

    return (
        <div className='space-y-6'>
            <section className={sectionClass}>
                <div>
                    <h2 className='text-lg font-semibold'>Shareable QR code</h2>
                    <p className='text-sm text-slate-500 dark:text-zinc-400'>
                        One link and QR code that several people can sign up
                        with, for flyers, posters or an event. It isn&apos;t
                        tied to any email address and nobody gets an email;
                        each person signs up with their own. Leave it at 1 for
                        a single-use invite.
                    </p>
                </div>
                <form
                    onSubmit={createSharedInvite}
                    className='grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end'
                >
                    <div>
                        <label htmlFor='invite-max-uses' className={labelClass}>
                            People who can use it
                        </label>
                        <input
                            id='invite-max-uses'
                            type='number'
                            min={1}
                            max={MAX_USES_LIMIT}
                            step={1}
                            value={maxUses}
                            onChange={(e) => setMaxUses(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label htmlFor='invite-label' className={labelClass}>
                            Label (optional)
                        </label>
                        <input
                            id='invite-label'
                            type='text'
                            maxLength={120}
                            placeholder='e.g. Farmers market flyer'
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <Button
                        type='submit'
                        disabled={creating || !maxUsesValid}
                        className='px-4 py-2 rounded-md'
                    >
                        {creating ? 'Creating…' : 'Create QR code'}
                    </Button>
                </form>
                {!maxUsesValid && (
                    <p className='text-xs text-red-600 dark:text-red-400'>
                        Enter a whole number from 1 to {MAX_USES_LIMIT}.
                    </p>
                )}
                {createError && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                        {createError}
                    </p>
                )}
                {created && (
                    <InviteQrCard
                        inviteUrl={created.inviteUrl}
                        maxUses={created.maxUses}
                        caption={created.label || 'Join Kudos'}
                    />
                )}
            </section>

            <section className={sectionClass}>
                <div>
                    <h2 className='text-lg font-semibold'>
                        Invite a list of people
                    </h2>
                    <p className='text-sm text-slate-500 dark:text-zinc-400'>
                        Paste email addresses, one per line or separated by
                        commas. Each person gets their own single-use invite by
                        email.
                    </p>
                </div>
                <form onSubmit={sendBulkInvites} className='space-y-3'>
                    <textarea
                        aria-label='Email addresses'
                        rows={5}
                        value={emailText}
                        onChange={(e) => setEmailText(e.target.value)}
                        placeholder={'ana@example.com\nluis@example.com'}
                        className={`${inputClass} font-mono`}
                    />
                    <div className='grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end'>
                        <div>
                            <label
                                htmlFor='bulk-invite-label'
                                className={labelClass}
                            >
                                Label (optional)
                            </label>
                            <input
                                id='bulk-invite-label'
                                type='text'
                                maxLength={120}
                                placeholder='e.g. Book club'
                                value={bulkLabel}
                                onChange={(e) => setBulkLabel(e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <Button
                            type='submit'
                            disabled={
                                sending || emails.length === 0 || tooManyEmails
                            }
                            className='px-4 py-2 rounded-md'
                        >
                            {sending
                                ? 'Sending…'
                                : `Send ${emails.length || ''} invite${emails.length === 1 ? '' : 's'}`}
                        </Button>
                    </div>
                </form>
                {tooManyEmails && (
                    <p className='text-xs text-red-600 dark:text-red-400'>
                        At most {BULK_LIMIT} addresses at a time (you have{' '}
                        {emails.length}).
                    </p>
                )}
                {bulkError && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                        {bulkError}
                    </p>
                )}
                {bulkResults && (
                    <div className='space-y-1 text-sm'>
                        <p className='font-medium'>
                            Sent {sentCount} invite{sentCount === 1 ? '' : 's'}
                            {failed.length > 0
                                ? `, ${failed.length} failed (left in the box above so you can fix and resend)`
                                : '.'}
                        </p>
                        {failed.length > 0 && (
                            <ul className='space-y-0.5 text-xs text-red-600 dark:text-red-400'>
                                {failed.map((r) => (
                                    <li key={r.email}>
                                        <span className='font-mono'>
                                            {r.email}
                                        </span>
                                        : {r.error}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </section>

            <section className={sectionClass}>
                <h2 className='text-lg font-semibold'>Your invites</h2>
                {listError && (
                    <p className='text-sm text-red-600 dark:text-red-400'>
                        {listError}
                    </p>
                )}
                {invites.length === 0 && loading ? (
                    <p className='text-sm text-slate-500'>Loading…</p>
                ) : invites.length === 0 ? (
                    <p className='text-sm text-slate-500'>No invites yet.</p>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='text-left text-xs uppercase tracking-wide text-slate-500 dark:text-zinc-400'>
                                    <th className='py-2 pr-3 font-medium'>
                                        Invite
                                    </th>
                                    <th className='py-2 pr-3 font-medium'>
                                        Created
                                    </th>
                                    <th className='py-2 pr-3 font-medium'>
                                        Status
                                    </th>
                                    <th className='py-2' />
                                </tr>
                            </thead>
                            <tbody>
                                {invites.map((invite) => {
                                    const shared = (invite.maxUses ?? 1) > 1;
                                    const name =
                                        invite.label ||
                                        invite.targetEmail ||
                                        (shared ? 'Shared link' : 'Link');
                                    const sub =
                                        invite.label && invite.targetEmail
                                            ? invite.targetEmail
                                            : null;
                                    const canRevoke =
                                        !invite.revoked &&
                                        !isInviteExhausted(invite);
                                    const joinedCount = inviteUseCount(invite);
                                    const isOpen = openInviteID === invite.id;
                                    return (
                                        <React.Fragment key={invite.id}>
                                            <tr className='border-t border-slate-200 dark:border-zinc-700'>
                                                <td className='py-2 pr-3'>
                                                    <div className='font-medium'>
                                                        {name}
                                                    </div>
                                                    {sub && (
                                                        <div className='text-xs text-slate-500'>
                                                            {sub}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className='py-2 pr-3 whitespace-nowrap text-slate-500'>
                                                    {formatDate(
                                                        invite.createdAt
                                                    )}
                                                </td>
                                                <td className='py-2 pr-3 whitespace-nowrap'>
                                                    {inviteStatusLabel(invite)}
                                                </td>
                                                <td className='py-2 text-right whitespace-nowrap space-x-2'>
                                                    {joinedCount > 0 && (
                                                        <Button
                                                            type='button'
                                                            variant='secondary'
                                                            className='text-xs px-2 py-1 rounded-md'
                                                            aria-expanded={
                                                                isOpen
                                                            }
                                                            onClick={() =>
                                                                toggleMembers(
                                                                    invite.id
                                                                )
                                                            }
                                                        >
                                                            {isOpen
                                                                ? 'Hide people'
                                                                : `People (${joinedCount})`}
                                                        </Button>
                                                    )}
                                                    {canRevoke && (
                                                        <Button
                                                            type='button'
                                                            variant='secondary'
                                                            className='text-xs px-2 py-1 rounded-md'
                                                            disabled={
                                                                revoking ===
                                                                invite.id
                                                            }
                                                            onClick={() =>
                                                                revokeInvite(
                                                                    invite.id
                                                                )
                                                            }
                                                        >
                                                            {revoking ===
                                                            invite.id
                                                                ? 'Revoking…'
                                                                : 'Revoke'}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                            {isOpen && (
                                                <tr>
                                                    <td
                                                        colSpan={4}
                                                        className='pb-3'
                                                    >
                                                        <InviteMembers
                                                            state={
                                                                membersByInvite[
                                                                    invite.id
                                                                ]
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {nextCursor && (
                    <div className='flex justify-center'>
                        <Button
                            type='button'
                            variant='secondary'
                            disabled={loading}
                            onClick={() => loadInvites(nextCursor)}
                            className='px-3 py-1.5 rounded-md'
                        >
                            {loading ? 'Loading…' : 'Load more'}
                        </Button>
                    </div>
                )}
            </section>
        </div>
    );
}

function InviteMembers({ state }: { state?: MembersState }) {
    if (!state || state.loading) {
        return <p className='text-sm text-slate-500 px-1'>Loading…</p>;
    }
    if (state.error) {
        return (
            <p className='text-sm text-red-600 dark:text-red-400 px-1'>
                {state.error}
            </p>
        );
    }
    const members = state.members ?? [];
    if (members.length === 0) {
        return (
            <p className='text-sm text-slate-500 px-1'>
                Nobody has joined with this invite yet.
            </p>
        );
    }
    return (
        <ul className='grid gap-2 sm:grid-cols-2 rounded-md bg-slate-50 p-3 dark:bg-zinc-800/60'>
            {members.map((member) => (
                <li key={member.user.id}>
                    <UserCard
                        user={member.user}
                        triggerVariant='avatar-name'
                        subtitle={`Joined ${new Date(member.joinedAt).toLocaleString()}`}
                    />
                </li>
            ))}
        </ul>
    );
}
