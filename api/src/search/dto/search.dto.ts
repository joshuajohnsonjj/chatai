import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class SearchQueryRequestDto {
    @IsString()
    entityId: string;

    @IsString()
    @IsOptional()
    queryText?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    topics?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    sourceTypeFilters?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    authorFilters?: string[];

    @IsNumber()
    @IsOptional()
    dateRangeLower?: number; // Unix timestamp

    @IsNumber()
    @IsOptional()
    dateRangeUpper?: number; // Unix timestamp

    @IsNumber()
    @IsOptional()
    take?: number;

    @IsNumber()
    @IsOptional()
    skip?: number;
}

export class SearchResultResponseDto {
    _id: string;
    ownerEntityId: string;
    text: string;
    createdAt: number; // Unix timestamp
    url?: string;
    authorName?: string;
    annotations: string[];
    dataSourceType: string;
}

export class SearchQueryResponseDto {
    numResults: number;
    nextStartNdx: number;
    results: SearchResultResponseDto[];
}
