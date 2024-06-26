import { Inject, Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '@joshuajohnsonjj38/gemini';
import { MongoDBService } from '@joshuajohnsonjj38/mongodb';
import { DecodedUserTokenDto } from 'src/auth/dto/jwt.dto';
import { ConfigService } from '@nestjs/config';
import { SearchQueryRequestDto, SearchQueryResponseDto, SearchResultResponseDto } from './dto/search.dto';
import { AccessDeniedError } from 'src/exceptions';
import { omit } from 'lodash';
import { SearchQueryParamType, SuggestionsQueryDto, SuggestionsResponseDto } from './dto/suggestions.dto';
import { LoggerContext } from 'src/constants';

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

        this.logger.log('Executing search query ' + JSON.stringify(params), LoggerContext.SEARCH);

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
            return await this.mongo.queryDataElements(params, params.skip, params.take);
        }
    }

    async getDataItemById(resultId: string, user: DecodedUserTokenDto): Promise<SearchResultResponseDto | null> {
        const entityId = user.organization || user.idUser;
        this.logger.log(`Retrieving result ${resultId} for entity ${entityId}`, LoggerContext.SEARCH);
        return await this.mongo.getDataElementById(resultId, entityId);
    }

    async deleteDataItemById(resultId: string, user: DecodedUserTokenDto): Promise<{ deletedCount: number }> {
        const ownerEntityId = user.organization || user.idUser;
        this.logger.log(`Deleting result ${resultId} for entity ${ownerEntityId}`, LoggerContext.SEARCH);
        const result = await this.mongo.elementCollConnection.deleteOne({
            ownerEntityId,
            _id: resultId,
        });
        return { deletedCount: result.deletedCount };
    }

    async getPeopleSuggestions(query: SuggestionsQueryDto, user: DecodedUserTokenDto): Promise<SuggestionsResponseDto> {
        this.validateUserAccess(query.entityId, user.idUser, user.organization);

        const results = await this.mongo.searchAuthorOptions(query.text ?? '', query.entityId);

        return {
            results: results.map((result) => ({
                value: result.name,
                type: SearchQueryParamType.AUTHOR,
            })),
        };
    }

    async getTopicSuggestions(query: SuggestionsQueryDto, user: DecodedUserTokenDto): Promise<SuggestionsResponseDto> {
        this.validateUserAccess(query.entityId, user.idUser, user.organization);

        const minConfidence = query.minConfidenceScore ?? 1;

        if (query.text && query.text.length) {
            const results = await this.mongo.searchLabelOptions(query.text, query.entityId);

            return {
                results: results
                    .filter((result) => result.score >= minConfidence)
                    .map((result) => ({
                        value: result.label,
                        type: SearchQueryParamType.TOPIC,
                    })),
            };
        } else {
            const results = await this.mongo.labelCollConnection
                .find({
                    entityId: query.entityId,
                })
                .limit(25)
                .toArray();
            return {
                results: results.map((result) => ({
                    value: result.label,
                    type: SearchQueryParamType.TOPIC,
                })),
            };
        }
    }

    private validateUserAccess(requestedEntityId: string, authUserId: string, authOrgId?: string) {
        if (requestedEntityId !== authUserId && requestedEntityId !== authOrgId) {
            throw new AccessDeniedError('User does not have access to this data');
        }
    }
}
