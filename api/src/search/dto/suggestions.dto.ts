import { IsString } from 'class-validator';

export class SuggestionsQueryDto {
    @IsString()
    text: string;

    @IsString()
    entityId: string;
}

export class SuggestionsResponseDto {
    results: string[];
}
