import React, { useLayoutEffect, useRef, useState } from 'react';

interface Props {
    text: string;
    /** Maximum number of lines to show when collapsed. */
    maxLines?: number;
    className?: string;
}

/**
 * Renders text clamped to `maxLines`. If the text overflows the clamp, a
 * "Read more" / "Read less" toggle is shown.
 */
const ExpandableText: React.FC<Props> = ({
    text,
    maxLines = 4,
    className = ''
}) => {
    const [expanded, setExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    useLayoutEffect(() => {
        const el = textRef.current;
        if (!el) return;
        // Compare full scroll height against the clamped client height.
        setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    }, [text, maxLines]);

    return (
        <div className={className}>
            <p
                ref={textRef}
                className='whitespace-pre-wrap break-words [overflow-wrap:anywhere]'
                style={
                    expanded
                        ? undefined
                        : {
                            display: '-webkit-box',
                            WebkitLineClamp: maxLines,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }
                }
            >
                {text}
            </p>
            {(isOverflowing || expanded) && (
                <button
                    type='button'
                    onClick={() => setExpanded((prev) => !prev)}
                    className='mt-1 text-xs font-semibold text-teal-600 hover:underline dark:text-teal-400'
                >
                    {expanded ? 'Read less' : 'Read more'}
                </button>
            )}
        </div>
    );
};

export default ExpandableText;
