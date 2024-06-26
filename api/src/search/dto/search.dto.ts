import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength } from 'class-validator';

export class SearchQueryRequestDto {
    @IsUUID()
    @IsNotEmpty()
    entityId: string;

    @IsString()
    @MaxLength(1000)
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
    @Max(100)
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
    title: string;
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
