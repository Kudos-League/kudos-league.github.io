import React, { Fragment, useMemo, useRef, useState, useEffect } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';

type Option = {
    label: string;
    value: string;
    icon?: React.ReactNode;
};

type DropdownPickerProps = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onBlur?: () => void;
};

export default function DropdownPicker({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    onBlur
}: DropdownPickerProps) {
    const selected = useMemo(
        () => options.find((o) => o.value === value),
        [options, value]
    );

    const buttonLabel = selected?.label ?? placeholder;

    const containerRef = useRef<HTMLDivElement | null>(null);
    const didSelectRef = useRef(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        function onDocClick(e: MouseEvent) {
            const el = containerRef.current;
            if (!el) return;
            if (e.target instanceof Node && !el.contains(e.target)) {
                if (!didSelectRef.current) {
                    onBlur && onBlur();
                }
                didSelectRef.current = false;
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, [isOpen, onBlur]);

    // also listen for focus leaving the container (covers keyboard/tab interactions)
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        function onFocusOut(e: FocusEvent) {
            const related = e.relatedTarget as Node | null;
            if (related && el.contains(related)) return;
            if (!didSelectRef.current) {
                onBlur && onBlur();
            }
            didSelectRef.current = false;
            setIsOpen(false);
        }
        el.addEventListener('focusout', onFocusOut);
        return () => el.removeEventListener('focusout', onFocusOut);
    }, [onBlur]);

    return (
        <Menu as='div' className='relative inline-block w-full' ref={containerRef}>
            <MenuButton
                onClick={() => setIsOpen(true)}
                onBlur={() => onBlur && onBlur()}
                className='inline-flex w-full justify-between items-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-white/10 dark:hover:bg-gray-600'
            >
                {buttonLabel}
                <ChevronDownIcon
                    aria-hidden='true'
                    className='ml-2 h-5 w-5 text-gray-400'
                />
            </MenuButton>

            <MenuItems
                transition
                className='absolute z-10 mt-2 w-full origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none dark:bg-gray-800 max-h-60 overflow-y-auto'
            >
                <div className='py-1'>
                    {options.map((opt) => (
                        <MenuItem key={opt.value} as={Fragment}>
                            {({ active }) => (
                                <button
                                    type='button'
                                    onClick={() => {
                                        didSelectRef.current = true;
                                        onChange(opt.value);
                                        setIsOpen(false);
                                    }}
                                    className={[
                                        'flex w-full items-center px-4 py-2 text-sm',
                                        active
                                            ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                                            : 'text-gray-700 dark:text-gray-300'
                                    ].join(' ')}
                                >
                                    <span className='flex-1 text-left'>
                                        {opt.label}
                                    </span>
                                    {value === opt.value && (
                                        <CheckIcon className='ml-2 h-4 w-4 text-blue-600 dark:text-blue-400' />
                                    )}
                                </button>
                            )}
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Menu>
    );
}
