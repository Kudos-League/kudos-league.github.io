import React from 'react';

type Tone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';
type Size = 'sm' | 'md';

interface Props {
  name?: string;                 // text label (optional if you pass children)
  children?: React.ReactNode;    // custom content
  tone?: Tone;
  size?: Size;
  leftIcon?: React.ReactNode;    // drop in a Heroicon here
  className?: string;
  colorClass?: string;           // overrides tone if provided
}

const TONE: Record<Tone, string> = {
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30',
    danger:  'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30',
    neutral: 'bg-neutral-500/10 text-neutral-700 dark:text-neutral-300 ring-1 ring-neutral-500/30',
    info:    'bg-sky-500/10 text-sky-700 dark:text-sky-300 ring-1 ring-sky-500/30',
};

const SIZE: Record<Size, string> = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
};

const Pill: React.FC<Props> = ({ name, children, tone = 'neutral', size = 'sm', leftIcon, className, colorClass }) => {
    return (
        <span
            className={[
                'inline-flex items-center gap-1.5 rounded-full font-medium select-none',
                SIZE[size],
                colorClass || TONE[tone],
                className || ''
            ].join(' ')}
        >
            {leftIcon ? <span className="inline-flex h-4 w-4">{leftIcon}</span> : null}
            {children ?? name}
        </span>
    );
};

export default Pill;
