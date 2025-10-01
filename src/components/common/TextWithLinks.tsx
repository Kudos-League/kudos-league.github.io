import React from 'react';
import { parseTextWithLinks, isSafeUrl } from '@/shared/linkUtils';

interface TextWithLinksProps {
    children: string;
    className?: string;
    linkClassName?: string;
    openInNewTab?: boolean;
    onClick?: (url: string) => void;
}

const TextWithLinks: React.FC<TextWithLinksProps> = ({
    children,
    className = '',
    linkClassName = 'text-blue-600 hover:text-blue-800 underline dark:text-blue-400 dark:hover:text-blue-300',
    openInNewTab = true,
    onClick
}) => {
    const segments = parseTextWithLinks(children);

    const handleLinkClick = (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        e.stopPropagation();

        if (onClick) {
            onClick(url);
            return;
        }

        if (!isSafeUrl(url)) {
            console.warn('Blocked potentially unsafe URL:', url);
            return;
        }

        if (openInNewTab) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
        else {
            window.location.href = url;
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
                        href="#"
                        className={linkClassName}
                        onClick={(e) => handleLinkClick(e, segment.url!)}
                        title={segment.url}
                        role="button"
                    >
                        {segment.content}
                    </a>
                );
            })}
        </span>
    );
};

export default TextWithLinks;
