import { GoogleDoc } from './types';

export const docWebUrl = (docId: string): string => `https://docs.google.com/document/d/${docId}`;

export const buildPayloadTextsFile = (fileContent: GoogleDoc): string[] => {
    const stringifiedFileContent = fileContent.body.content.map((block) => {
        if (!block.paragraph) {
            return '';
        }

        const text = block.paragraph.elements
            .map((el) => el.textRun.content)
            .join(' ')
            .replace(/\s{2,}/g, ' ');
        return text;
    });

    const reducedContent: string[] = [];
    let contentNdx = -1;

    stringifiedFileContent.forEach((content) => {
        if (!content.length) {
            return;
        }

        if (reducedContent[contentNdx] && reducedContent[contentNdx].length < 250) {
            reducedContent[contentNdx] += content;
        } else {
            reducedContent.push(content);
            contentNdx += 1;
        }
    });

    return reducedContent;
};
