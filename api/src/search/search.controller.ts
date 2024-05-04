import { Controller, Get, Body, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { AuthGuard } from '@nestjs/passport';
import { SearchQueryRequestDto, SearchQueryResponseDto } from './dto/search.dto';
import { Request } from 'express';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { SuggestionsQueryDto, SuggestionsResponseDto } from './dto/suggestions.dto';

@Controller('v1/search')
@UseGuards(AuthGuard('jwt'))
export class SearchController {
    constructor(private readonly service: SearchService) {}

    @Post()
    async executeQuery(@Body() params: SearchQueryRequestDto, @Req() req: Request): Promise<SearchQueryResponseDto> {
        return await this.service.executeQuery(params, req.user as DecodedUserTokenDto);
    }

    @Get('/suggestions/people')
    async getPeopleSuggestions(
        @Query() query: SuggestionsQueryDto,
        @Req() req: Request,
    ): Promise<SuggestionsResponseDto> {
        return await this.service.getPeopleSuggestions(query, req.user as DecodedUserTokenDto);
    }

    @Get('/suggestions/topics')
    async getTopicSuggestions(
        @Query() query: SuggestionsQueryDto,
        @Req() req: Request,
    ): Promise<SuggestionsResponseDto> {
        return await this.service.getTopicSuggestions(query, req.user as DecodedUserTokenDto);
    }
}
