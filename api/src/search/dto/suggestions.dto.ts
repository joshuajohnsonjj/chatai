import { Transform } from 'class-transformer';
import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class SuggestionsQueryDto {
    @IsString()
    @IsOptional()
    text?: string;

    @IsString()
    entityId: string;

    @IsNumberString()
    @IsOptional()
    @Transform(({ value }) => parseInt(value as string, 10))
    minConfidenceScore?: number;
}

export enum SearchQueryParamType {
    TEXT = 'TEXT',
    TOPIC = 'TOPIC',
    AUTHOR = 'AUTHOR',
    SOURCE = 'SOURCE',
    DATE_LOWER = 'DATE_LOWER',
    DATE_UPPER = 'DATE_UPPER',
}

export class SuggestionsResponseDto {
    results: { type: SearchQueryParamType; value: string }[];
}
