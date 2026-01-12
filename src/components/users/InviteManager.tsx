import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Button from '@/components/common/Button';
import Form from '@/components/forms/Form';
import FormField from '@/components/forms/FormField';
import Input from '@/components/forms/Input';
import { Alert } from '@/components/login/fields';
import { apiGet, apiMutate } from '@/shared/api/apiClient';
import { UserInviteDTO, UserInviteListResponse } from '@/shared/api/types';
import UserCard from '@/components/users/UserCard';

const PAGE_SIZE = 5;

type InviteFormValues = {
    email?: string;
};

type CreateInviteResponse = {
    token: string;
    inviteUrl?: string | null;
    invite: UserInviteDTO;
};

const formatDateTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString();
};

export default function InviteManager() {
    const form = useForm<InviteFormValues>({
        mode: 'onBlur',
        defaultValues: { email: '' }
    });
    const [invites, setInvites] = useState<UserInviteDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<{
        inviteUrl?: string | null;
        token: string;
    } | null>(null);
    const [isRevoking, setRevoking] = useState<number | null>(null);
    const [nextCursor, setNextCursor] = useState<number | null>(null);

    const loadInvites = useCallback(async (cursor?: number, append = false) => {
        const isLoadMore = typeof cursor === 'number' && !Number.isNaN(cursor);
        if (isLoadMore) {
            setLoadingMore(true);
        }
        else {
            setLoading(true);
        }

        try {
            setError(null);
            const params: Record<string, number> = { limit: PAGE_SIZE };
            if (isLoadMore && cursor !== undefined) {
                params.cursor = cursor;
            }

            const data = await apiGet<UserInviteListResponse>(
                '/users/invites',
                {
                    params
                }
            );

            const invitesList = Array.isArray(data?.invites)
                ? data.invites
                : [];
            const next =
                typeof data?.nextCursor === 'number' ? data.nextCursor : null;
            setInvites((prev) =>
                append ? prev.concat(invitesList) : invitesList
            );
            setNextCursor(next);
        }
        catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to load invites.';
            setError(message);
            if (!append) {
                setInvites([]);
                setNextCursor(null);
            }
        }
        finally {
            if (isLoadMore) {
                setLoadingMore(false);
            }
            else {
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        loadInvites();
    }, [loadInvites]);

    const handleRevokeInvite = async (inviteID: number) => {
        try {
            setRevoking(inviteID);
            setError(null);
            await apiMutate(`/users/invites/${inviteID}`, 'delete');
            setInvites((prev) =>
                prev.map((invite) =>
                    invite.id === inviteID
                        ? { ...invite, revoked: true }
                        : invite
                )
            );
        }
        catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                'Failed to revoke invite.';
            setError(message);
        }
        finally {
            setRevoking(null);
        }
    };

    const handleCreateInvite = async (values: InviteFormValues) => {
        try {
            setCreating(true);
            setError(null);
            setSuccess(null);

            const payload =
                values.email && values.email.trim().length > 0
                    ? { email: values.email.trim() }
                    : {};

            const response = await apiMutate<
                CreateInviteResponse,
                typeof payload
            >('/users/invites', 'post', payload);
            const inviteUrl =
                response.inviteUrl ?? response.invite.inviteUrl ?? null;

            setInvites((prev) => {
                const targetEmail = response.invite.targetEmail;
                if (targetEmail) {
                    const existingIndex = prev.findIndex(
                        (invite) => invite.targetEmail === targetEmail
                    );
                    if (existingIndex !== -1) {
                        const updated = [...prev];
                        updated[existingIndex] = response.invite;
                        return updated;
                    }
                }
                return [response.invite, ...prev];
            });

            setSuccess({ inviteUrl, token: response.token });
            form.reset({ email: '' });
        }
        catch (err: any) {
            const statusCode = err?.response?.status;
            let message: string;

            if (Array.isArray(err)) {
                message = err[0] || 'Failed to create invite.';
            }
            else {
                message =
                    err?.response?.data?.message ||
                    err?.message ||
                    'Failed to create invite.';
            }

            if (statusCode === 409) {
                if (message.includes('already been used')) {
                    setError(
                        `This email address has already used an invite and cannot receive another one. You can try a different email address or clear the email field to create a general shareable invite link instead.`
                    );
                }
                else if (message.includes('already exists')) {
                    setError(
                        `A user account with this email address already exists. Try a different email address or clear the email field to create a general shareable invite link instead.`
                    );
                }
                else {
                    setError(message);
                }
            }
            else {
                setError(message);
            }
        }
        finally {
            setCreating(false);
        }
    };

    const renderInviteStatus = (invite: UserInviteDTO) => {
        if (invite.revoked) return 'Revoked';
        if (invite.usedAt || invite.usedByUserID) return 'Used';
        return 'Unused';
    };

    const handleLoadMore = async () => {
        if (!nextCursor) return;
        await loadInvites(nextCursor, true);
    };

    return (
        <div className='rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm p-5 space-y-4'>
            <div>
                <h3 className='text-lg font-semibold text-slate-800 dark:text-zinc-100'>
                    Manage invites
                </h3>
                <p className='text-sm text-slate-500 dark:text-zinc-400'>
                    Generate invite links for new members and track their
                    status.
                </p>
            </div>

            {success && (
                <Alert tone='success'>
                    <div className='space-y-1'>
                        <p className='font-medium'>Invite ready to share!</p>
                        {success.inviteUrl ? (
                            <p className='break-all text-xs'>
                                {success.inviteUrl}
                            </p>
                        ) : (
                            <p className='break-all text-xs'>
                                Token: {success.token}
                            </p>
                        )}
                    </div>
                </Alert>
            )}

            {error && <Alert tone='error'>{error}</Alert>}

            <Form
                methods={form}
                onSubmit={handleCreateInvite}
                className='flex flex-col gap-3 sm:flex-row sm:items-end'
            >
                <FormField name='email' className='flex-1 mb-0' noMargin>
                    <Input
                        name='email'
                        label='Send invite via email (optional)'
                        placeholder='friend@example.com'
                        form={form}
                        noMargin
                        showLabel={false}
                        registerOptions={{
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: 'Enter a valid email address'
                            }
                        }}
                        htmlInputType='email'
                    />
                </FormField>

                <Button type='submit' disabled={creating} className='sm:w-40'>
                    {creating ? 'Generating…' : 'Create invite'}
                </Button>
            </Form>

            <div className='space-y-2'>
                <h4 className='text-sm font-semibold text-slate-700 dark:text-zinc-200 uppercase tracking-wide'>
                    Your invites
                </h4>
                {loading ? (
                    <p className='text-sm text-slate-500 dark:text-zinc-400'>
                        Loading…
                    </p>
                ) : invites.length === 0 ? (
                    <p className='text-sm text-slate-500 dark:text-zinc-400'>
                        No invites yet. Generate one to get started.
                    </p>
                ) : (
                    <div className='space-y-2'>
                        {invites.map((invite) => {
                            const usedBy = invite.usedBy ?? null;
                            const isDisabled = !!(
                                invite.revoked ||
                                invite.usedAt ||
                                invite.usedByUserID
                            );

                            return (
                                <div
                                    key={invite.id}
                                    className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-zinc-700 px-3 py-2 text-sm text-slate-600 dark:text-zinc-300'
                                >
                                    <div className='flex-1 space-y-1'>
                                        {usedBy ? (
                                            <>
                                                <p className='text-xs uppercase text-slate-500 dark:text-zinc-400 tracking-wide'>
                                                    Invite redeemed
                                                </p>
                                                <UserCard
                                                    user={usedBy}
                                                    triggerVariant='avatar-name'
                                                    subtitle={
                                                        invite.usedAt
                                                            ? `Joined ${formatDateTime(invite.usedAt)}`
                                                            : 'Member joined'
                                                    }
                                                    disableTooltip
                                                    interactive={false}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <p className='font-medium text-slate-700 dark:text-zinc-100'>
                                                    {invite.targetEmail ||
                                                        'Shareable link'}
                                                </p>
                                                <p className='text-xs text-slate-500 dark:text-zinc-400'>
                                                    Created{' '}
                                                    {formatDateTime(
                                                        invite.createdAt
                                                    )}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                    <div className='flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-zinc-400'>
                                        <span>
                                            {renderInviteStatus(invite)}
                                        </span>
                                        <button
                                            type='button'
                                            onClick={() =>
                                                handleRevokeInvite(invite.id)
                                            }
                                            disabled={
                                                isDisabled ||
                                                isRevoking === invite.id
                                            }
                                            className='text-slate-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-base'
                                            title='Revoke invite'
                                            aria-label='Revoke invite'
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {nextCursor && (
                            <div className='pt-2 flex justify-center'>
                                <Button
                                    type='button'
                                    variant='secondary'
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? 'Loading…' : 'Load more'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
