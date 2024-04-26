import { GoogleDoc } from './types';

export const docWebUrl = (docId: string): string => `https://docs.google.com/document/d/${docId}`;

// TODO: figure out how to break up large files...
export const buildPayloadTextsFile = (name: string, fileContent: GoogleDoc) => {
    const stringifiedFileContent = fileContent.body.content
        .map((block) => {
            if (!block.paragraph) {
                return;
            }
            const text = block.paragraph.elements
                .map((el) => el.textRun.content)
                .join('')
                .replace(/\r?\n|\r/g, '');
            return text;
        })
        .join();
    const text = `Document Title: ${name}, Document content: ${stringifiedFileContent}`;
    return text;
};
