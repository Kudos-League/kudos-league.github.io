import React, { useEffect, useState } from 'react';
import Button from '@/components/common/Button';
import {
    buildQrImageUrl,
    DEFAULT_QR_SIZE,
    downloadQrPng,
    printQr
} from '@/shared/invites/qrCode';

type InviteQrCardProps = {
    inviteUrl: string;
    /** Shown on the printed sheet and used in the download filename. */
    caption?: string;
};

/**
 * Renders a freshly created invite link as a scannable QR code with
 * copy / download / print actions, so it can be put on business cards,
 * flyers, etc.
 */
export default function InviteQrCard({
    inviteUrl,
    caption = 'Join Kudos'
}: InviteQrCardProps) {
    const [copied, setCopied] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [imageFailed, setImageFailed] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        setCopied(false);
        setImageFailed(false);
        setActionError(null);
    }, [inviteUrl]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
        catch {
            setActionError('Could not copy the link. Select it and copy manually.');
        }
    };

    const download = async () => {
        try {
            setDownloading(true);
            setActionError(null);
            await downloadQrPng(inviteUrl, 'kudos-invite-qr.png');
        }
        catch (err: any) {
            setActionError(err?.message || 'Could not download the QR code.');
        }
        finally {
            setDownloading(false);
        }
    };

    const print = () => {
        setActionError(null);
        if (!printQr(inviteUrl, caption)) {
            setActionError('Popup blocked. Allow popups for this site to print.');
        }
    };

    const imageUrl = buildQrImageUrl(inviteUrl, DEFAULT_QR_SIZE);

    return (
        <div className='flex flex-col sm:flex-row gap-4 items-start'>
            <div className='shrink-0 rounded-lg bg-white p-2 border border-slate-200 dark:border-zinc-700'>
                {imageFailed ? (
                    <div className='w-40 h-40 flex items-center justify-center text-center text-xs text-slate-500 px-2'>
                        QR service unreachable. Copy the link instead.
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        width={160}
                        height={160}
                        alt='Invite link QR code'
                        className='w-40 h-40'
                        onError={() => setImageFailed(true)}
                    />
                )}
            </div>
            <div className='flex-1 min-w-0 space-y-2'>
                <p className='font-medium'>Your invite link is ready.</p>
                <p className='break-all text-xs font-mono select-all'>
                    {inviteUrl}
                </p>
                <div className='flex flex-wrap gap-2 pt-1'>
                    <Button
                        type='button'
                        variant='secondary'
                        className='text-xs'
                        onClick={copyLink}
                    >
                        {copied ? 'Copied!' : 'Copy link'}
                    </Button>
                    <Button
                        type='button'
                        variant='secondary'
                        className='text-xs'
                        onClick={download}
                        disabled={downloading || imageFailed}
                    >
                        {downloading ? 'Downloading…' : 'Download QR (PNG)'}
                    </Button>
                    <Button
                        type='button'
                        variant='secondary'
                        className='text-xs'
                        onClick={print}
                        disabled={imageFailed}
                    >
                        Print QR
                    </Button>
                </div>
                <p className='text-xs text-slate-500 dark:text-zinc-400'>
                    Scanning the QR opens this invite link. The link is single-use:
                    the first person to register with it claims it. The image is
                    rendered by api.qrserver.com (free third-party service).
                </p>
                {actionError && (
                    <p className='text-xs text-red-600 dark:text-red-400'>
                        {actionError}
                    </p>
                )}
            </div>
        </div>
    );
}
