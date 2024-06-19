import type { GmailMessagePart } from '../../lib/dataSources/gmail';

/**
 * Returns the text (i.e. name) prior to the email address in a string that
 * looks like this: "Joshua Johnson <joshuajohnsonjj38@gmail.com>"
 */
export const extractTextBeforeEmail = (text: string): string | null => {
    const regex = /^(.*)\s*<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>/;
    const match = text.match(regex);
    return match ? match[1].trim() : null;
};

/**
 * Returns the email address extracted from a string that looks like
 * this: "Joshua Johnson <joshuajohnsonjj38@gmail.com>"
 */
export const extractEmail = (text: string): string | null => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const match = text.match(emailRegex);
    return match ? match[0] : null;
};

/**
 * Removes the leading Re: from an email string if present (case insensitive)
 */
export const cleanSubject = (subject?: string): string | null => (subject ? subject.replace(/^re:/i, '').trim() : null);

const emailEndPatterns = [
    /On .*? \b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b wrote:/,
    /^(?:From|De|To|Para):\s+(.+?)\s+<([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>$/im,
    /(^>+.*(\r?\n>.*)*)|(^>+.*$)/gm, // matches multiple lines starting with > character
    /^-+\sOriginal\sMessage\s-+/im,
    /-{12,}/g,
];

/**
 * This method takes in the base64 encoded plain text message body from
 * a thread and performs a couple layers of sanitation. The first and
 * most important is extracting the new message portion from the full
 * text which likely includes the thread history as well, as is common
 * with email threads.
 *
 * Secondly method will clean excess newline characters.
 *
 * Lastly will chunk text into max text size of 2000 characters
 */
export const sanitizePlainTextMessageToMessageChunks = (textBase64: string): string[] => {
    const text = Buffer.from(textBase64, 'base64').toString('utf8');

    let earliestMatchIndex: number | undefined;

    for (const pattern of emailEndPatterns) {
        const match = text.match(pattern);

        if (!match) {
            continue;
        }

        const matchIndex = match.index ?? text.indexOf(match[0]);
        if (!earliestMatchIndex || matchIndex < earliestMatchIndex) {
            earliestMatchIndex = matchIndex;
        }
    }

    let cleanedText: string;
    if (earliestMatchIndex) {
        cleanedText = text
            .substring(0, earliestMatchIndex)
            .trim()
            .replace(/[\n\r\s]{2,}/g, '\n');
    } else {
        cleanedText = text.trim().replace(/[\n\r\s]{2,}/g, '\n');
    }

    if (cleanedText.length <= 2000) {
        return [cleanedText];
    }

    const numChunks = Math.floor(cleanedText.length / Math.min(2000, Math.floor(cleanedText.length / 2)));
    const chunkSize = Math.floor(cleanedText.length / numChunks);

    const textChunks = [];

    for (let i = 0; i <= numChunks; i++) {
        textChunks.push(cleanedText.slice(chunkSize * i, chunkSize * (i + 1)));
    }

    textChunks.push(cleanedText.slice(chunkSize * numChunks));

    return textChunks;
};

export const getEmailMetadata = (
    messageData: GmailMessagePart,
): {
    subject: string;
    date: number;
    senderEmail: string | null;
    senderName: string | null;
    receiver: string | null;
} => {
    const sender = messageData.payload.headers.find((header) => header.name === 'From')?.value;

    return {
        date: parseInt(messageData.internalDate, 10),
        subject:
            cleanSubject(messageData.payload.headers.find((header) => header.name === 'Subject')?.value) ??
            'Gmail Message',
        senderEmail: sender ? extractEmail(sender) : null,
        senderName: sender ? extractTextBeforeEmail(sender) : null,
        receiver: messageData.payload.headers.find((header) => header.name === 'From')?.value ?? null,
    };
};
