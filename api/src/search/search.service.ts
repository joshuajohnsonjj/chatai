import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { DecodedUserTokenDto } from 'src/userAuth/dto/jwt.dto';
import { ConfigService } from '@nestjs/config';
import { SearchQueryRequestDto, SearchQueryResponseDto } from './dto/search.dto';
import { AccessDeniedError } from 'src/exceptions';
import { omit } from 'lodash';
import { SuggestionsQueryDto, SuggestionsResponseDto } from './dto/suggestions.dto';

@Injectable()
export class SearchService {
    private readonly ai = new GeminiService(this.configService.get<string>('GEMINI_KEY')!);

    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,

        @Inject('MONGO_DB_CONNECTION')
        private readonly mongo: MongoDBService,
    ) {}

    async executeQuery(params: SearchQueryRequestDto, user: DecodedUserTokenDto): Promise<SearchQueryResponseDto> {
        this.validateUserAccess(params.entityId, user.idUser, user.organization);

        this.logger.log('Executing search query ' + JSON.stringify(params), 'Search');

        if (params.queryText) {
            const vectorizedQuery = await this.ai.getTextEmbedding(params.queryText);
            const results = await this.mongo.queryDataElementsByVector(
                {
                    ...omit(params, ['queryText']),
                    vectorizedQuery,
                },
                20,
            );

            return {
                results,
                numResults: 20,
                nextStartNdx: 21,
            };
        } else {
            return await this.mongo.queryDataElements(params);
        }
    }

    async getPeopleSuggestions(query: SuggestionsQueryDto, user: DecodedUserTokenDto): Promise<SuggestionsResponseDto> {
        this.validateUserAccess(query.entityId, user.idUser, user.organization);

        const results = await this.mongo.searchAuthorOptions(query.text, query.entityId);

        return {
            results: results.map((result) => result.name),
        };
    }

    async getTopicSuggestions(query: SuggestionsQueryDto, user: DecodedUserTokenDto): Promise<SuggestionsResponseDto> {
        this.validateUserAccess(query.entityId, user.idUser, user.organization);

        const results = await this.mongo.searchLabelOptions(query.text, query.entityId);

        return {
            results: results.map((result) => result.label),
        };
    }

    private validateUserAccess(requestedEntityId: string, authUserId: string, authOrgId?: string) {
        if (requestedEntityId !== authUserId && requestedEntityId !== authOrgId) {
            throw new AccessDeniedError('User does not have access to this data');
        }
    }
}
