'use client';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  children: React.ReactNode;
  /** Stagger index for sequential delay */
  index?: number;
  /** How much extra delay per index, in ms */
  delayStep?: number; // default 60
  /** Animate only once? */
  once?: boolean; // default true
  /** IntersectionObserver options */
  threshold?: number; 
  rootMargin?: string;
  className?: string;
};

export default function SlideInOnScroll({
    children,
    index = 0,
    delayStep = 60,
    once = true,
    threshold = 0.15,
    rootMargin = '0px 0px -10% 0px',
    className = '',
}: Props) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Respect reduced motion
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
            setVisible(true);
            return;
        }

        const obs = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        setVisible(true);
                        if (once) obs.unobserve(e.target);
                    }
                    else if (!once) {
                        setVisible(false);
                    }
                });
            },
            { threshold, rootMargin }
        );

        obs.observe(el);
        return () => obs.disconnect();
    }, [once, threshold, rootMargin]);

    return (
        <div
            ref={ref}
            className={[
                // base
                'transition-all duration-500 ease-out',
                // accessibility
                'motion-reduce:transition-none motion-reduce:transform-none',
                // from -> to
                visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-6',
                className,
            ].join(' ')}
            style={{ transitionDelay: `${index * delayStep}ms` }}
        >
            {children}
        </div>
    );
}