import {
    getMessageReplyDescription,
    getMessageReplyTitle,
    getMessageReplyToastMessage
} from './messageReplyText';

describe('messageReplyText', () => {
    it('uses event-specific copy when the reply belongs to an event thread', () => {
        expect(getMessageReplyDescription(42)).toBe(
            'replied to your comment on an event'
        );
        expect(getMessageReplyTitle(42)).toBe('Reply to your event comment');
        expect(
            getMessageReplyToastMessage({
                authorName: 'Alex',
                content: 'See you there',
                eventID: 42
            })
        ).toBe('Alex replied to your comment on an event: See you there');
    });

    it('falls back to generic message-reply copy outside event threads', () => {
        expect(getMessageReplyDescription()).toBe('replied to your message');
        expect(getMessageReplyTitle()).toBe('Reply to your message');
        expect(
            getMessageReplyToastMessage({
                authorName: 'Alex',
                content: 'Ping'
            })
        ).toBe('Alex replied to your message: Ping');
    });
});
