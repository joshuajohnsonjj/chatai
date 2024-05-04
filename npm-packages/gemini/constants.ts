import { TextAnalysisEntityType } from './types';

export const IMPORTABLE_ENTITY_TYPES = [
    TextAnalysisEntityType.CONSUMER_GOOD,
    TextAnalysisEntityType.EVENT,
    TextAnalysisEntityType.ORGANIZATION,
    TextAnalysisEntityType.OTHER,
    TextAnalysisEntityType.PERSON,
    TextAnalysisEntityType.WORK_OF_ART,
];

export const NLP_URL = 'https://language.googleapis.com/v2/documents:annotateText';
