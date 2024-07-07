import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerContext } from 'src/constants';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventType, ImportableMessageEventTypes, MessageEventType, type SlackEventAPIPayload } from './types/slack';
import { sendSqsMessage } from 'src/services/sqs';
import { DataSyncInterval } from '@prisma/client';

@Injectable()
export class EventService {
    constructor(
        private readonly configService: ConfigService,
        private readonly logger: Logger,
        private readonly prisma: PrismaService,
    ) {}

    async queueSlackUpdate(payload: SlackEventAPIPayload) {
        if (payload.type !== EventType.EVENT || payload.event.type !== MessageEventType.MESSAGE) {
            return;
        }
        if ('subtype' in payload.event && !ImportableMessageEventTypes.includes(payload.event.subtype)) {
            return;
        }

        const dataSourceRes = await this.prisma.dataSource.findUniqueOrThrow({
            where: {
                externalId: payload.api_app_id,
            },
            select: {
                isSyncing: true,
                ownerEntityId: true,
                secret: true,
                selectedSyncInterval: true,
                id: true,
            },
        });

        if (dataSourceRes.isSyncing) {
            this.logger.warn(
                `Data source sync in progress for ${dataSourceRes.id}, skipping event...`,
                LoggerContext.EVENT,
            );
            return;
        }

        if (dataSourceRes.selectedSyncInterval !== DataSyncInterval.INSTANT) {
            this.logger.warn(
                `Data source ${dataSourceRes.id} Instant sync not enabled, skipping event...`,
                LoggerContext.EVENT,
            );
            return;
        }

        this.logger.log(`Publishing SQS message for Slack data source ${dataSourceRes.id} event`, LoggerContext.EVENT);

        // eslint-disable-next-line
        let messageBody;
        if (!('subtype' in payload.event)) {
            messageBody = {
                ownerEntityId: dataSourceRes.ownerEntityId,
                secret: dataSourceRes.secret,
                dataSourceId: dataSourceRes.id,
                isDeletion: false,
                channelId: payload.event.channel,
                userId: payload.event.user,
                text: payload.event.text,
                ts: payload.event.ts,
                edited: payload.event.edited
                    ? {
                          user: payload.event.edited.user,
                          ts: payload.event.edited.ts,
                      }
                    : undefined,
            };
        } else if (payload.event.subtype === MessageEventType.DELETE) {
            messageBody = {
                ownerEntityId: dataSourceRes.ownerEntityId,
                secret: dataSourceRes.secret,
                dataSourceId: dataSourceRes.id,
                isDeletion: true,
                channelId: payload.event.channel,
                ts: payload.event.ts,
            };
        } else {
            messageBody = {
                ownerEntityId: dataSourceRes.ownerEntityId,
                secret: dataSourceRes.secret,
                dataSourceId: dataSourceRes.id,
                isDeletion: false,
                channelId: payload.event.channel,
                userId: payload.event.message.user,
                text: payload.event.message.text,
                ts: payload.event.ts,
                edited: payload.event.message.edited
                    ? {
                          user: payload.event.message.edited.user,
                          ts: payload.event.message.edited.ts,
                      }
                    : undefined,
            };
        }

        await sendSqsMessage(JSON.stringify(messageBody), this.configService.get<string>('SLACK_EVENT_QUEUE')!);
    }
}
