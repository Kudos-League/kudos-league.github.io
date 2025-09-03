export interface LinkMatch {
    text: string;
    url: string;
    index: number;
}

/**
 * Regex pattern to match URLs in text
 * Matches http://, https://, and www. patterns
 */
const URL_REGEX = /(https?:\/\/[^\s<>"{}|\\^`[\]]+|www\.[^\s<>"{}|\\^`[\]]+)/gi;

/**
 * Detects URLs in text and returns an array of matches
 */
export function detectUrls(text: string): LinkMatch[] {
    const matches: LinkMatch[] = [];
    let match;

    // Reset regex to start from beginning
    URL_REGEX.lastIndex = 0;

    while ((match = URL_REGEX.exec(text)) !== null) {
        const matchedText = match[0];
        let url = matchedText;

        // Add protocol if missing (for www. links)
        if (url.startsWith('www.')) {
            url = `https://${url}`;
        }

        matches.push({
            text: matchedText,
            url: url,
            index: match.index
        });
    }

    return matches;
}

/**
 * Converts text with URLs into an array of text segments and link objects
 */
export function parseTextWithLinks(
    text: string
): Array<{ type: 'text' | 'link'; content: string; url?: string }> {
    const links = detectUrls(text);

    if (links.length === 0) {
        return [{ type: 'text', content: text }];
    }

    const segments: Array<{
        type: 'text' | 'link';
        content: string;
        url?: string;
    }> = [];
    let currentIndex = 0;

    links.forEach((link, i) => {
        // Add text before this link
        if (link.index > currentIndex) {
            segments.push({
                type: 'text',
                content: text.slice(currentIndex, link.index)
            });
        }

        // Add the link
        segments.push({
            type: 'link',
            content: link.text,
            url: link.url
        });

        currentIndex = link.index + link.text.length;
    });

    // Add remaining text after last link
    if (currentIndex < text.length) {
        segments.push({
            type: 'text',
            content: text.slice(currentIndex)
        });
    }

    return segments;
}

/**
 * Validates if a URL is safe to open (basic security check)
 */
export function isSafeUrl(url: string): boolean {
    try {
        const parsedUrl = new URL(url);
        // Only allow http and https protocols
        return (
            parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
        );
    }
    catch {
        return false;
    }
}
