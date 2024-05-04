import { Logger, Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { MongoModule } from '../mongo/mongo.module';

@Module({
    imports: [MongoModule],
    providers: [SearchService, Logger],
    controllers: [SearchController],
})
export class SearchModule {}
