// src/components/common/TextWithLinks.tsx

import React from 'react';
import { parseTextWithLinks, isSafeUrl } from '@/shared/linkUtils';

interface TextWithLinksProps {
    children: string;
    className?: string;
    linkClassName?: string;
    openInNewTab?: boolean;
    onClick?: (url: string) => void;
}

/**
 * Component that renders text with URLs converted to clickable links
 */
const TextWithLinks: React.FC<TextWithLinksProps> = ({
    children,
    className = '',
    linkClassName = 'text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300',
    openInNewTab = true,
    onClick
}) => {
    const segments = parseTextWithLinks(children);

    const handleLinkClick = (e: React.MouseEvent, url: string) => {
        if (onClick) {
            e.preventDefault();
            onClick(url);
            return;
        }

        // Security check
        if (!isSafeUrl(url)) {
            e.preventDefault();
            console.warn('Blocked potentially unsafe URL:', url);
            return;
        }
    };

    return (
        <span className={className}>
            {segments.map((segment, index) => {
                if (segment.type === 'text') {
                    return segment.content;
                }

                return (
                    <a
                        key={index}
                        href={segment.url}
                        className={linkClassName}
                        target={openInNewTab ? '_blank' : undefined}
                        rel={openInNewTab ? 'noopener noreferrer' : undefined}
                        onClick={(e) => handleLinkClick(e, segment.url!)}
                        title={segment.url}
                    >
                        {segment.content}
                    </a>
                );
            })}
        </span>
    );
};

export default TextWithLinks;