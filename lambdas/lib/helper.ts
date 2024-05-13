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
