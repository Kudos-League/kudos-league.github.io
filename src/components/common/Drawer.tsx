import React, { useEffect, useState } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';

type Props = {
    open: boolean;
    onClose: (v: boolean) => void;
    children: React.ReactNode;
    maxWidth?: string;
};

export default function Drawer({ open, onClose, children, maxWidth = 'max-w-md' }: Props) {
    const [mounted, setMounted] = useState(open);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let unmountTimer: any;

        if (open) {
            setMounted(true);
            requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        }
        else {
            setVisible(false);
            unmountTimer = setTimeout(() => setMounted(false), 300);
        }

        return () => {
            if (unmountTimer) clearTimeout(unmountTimer);
        };
    }, [open]);

    if (!mounted) return null;

    return (
        <Dialog open={mounted} onClose={onClose} className='relative z-50'>
            <div className='fixed inset-0 transition-opacity' aria-hidden='true' style={{ opacity: visible ? 1 : 0, zIndex: 9990 }}>
                <div className='absolute inset-0 bg-black/30' />
            </div>

            <div className='fixed inset-0 overflow-hidden'>
                <div className='absolute inset-0 overflow-hidden'>
                    <div className='pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16'>
                        <DialogPanel
                            className={`pointer-events-auto w-screen ${maxWidth} transform transition-transform duration-300 ease-in-out`}
                            style={{ transform: visible ? 'translateX(0%)' : 'translateX(100%)', zIndex: 9999 }}
                        >
                            {children}
                        </DialogPanel>
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
