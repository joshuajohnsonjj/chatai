export const isEmptyContent = (str: string): boolean => {
    // Regular expression to match only whitespace characters
    const whitespaceRegex = /^\s*$/;
    return whitespaceRegex.test(str);
};

export const cleanExcessWhitespace = (str: string): string => str.replace(/(\n{2,})/g, '\n');
