import { EMBEDDING_SIZE_IN_BYTES } from './constants';

/**
 * Returns whether a given string consists of only whitespace
 *
 * @param str
 */
export const isEmptyContent = (str: string): boolean => {
    const whitespaceRegex = /^\s*$/;
    return whitespaceRegex.test(str);
};

/**
 * Returns a mutated string with any multi newline occurances trimmed
 * to one new line
 *
 * @param str
 */
export const cleanExcessWhitespace = (str: string): string => str.replace(/(\n{2,})/g, '\n');

/**
 * Returns an estimated document size in bytes based on 768 length
 * vector array plus 2x text content length
 *
 * @param textContentLength
 */
export const getDocumentSizeEstimate = (textContentLength: number, isNewOrDeletedDoc: boolean): number =>
    (isNewOrDeletedDoc ? EMBEDDING_SIZE_IN_BYTES : 0) + textContentLength * 2;
