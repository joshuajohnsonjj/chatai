import { Logger } from '@nestjs/common';
import { LoggerContext } from 'src/constants';
import { InternalError } from 'src/exceptions';
import type { APIGatewayInitiateImportParams } from 'src/types';
import {
    FlexibleTimeWindowMode,
    ScheduleState,
    SchedulerClient,
    CreateScheduleCommand,
    ActionAfterCompletion,
    DeleteScheduleCommand,
} from '@aws-sdk/client-scheduler';
import { DataSyncInterval } from '@prisma/client';
import type { ConfigService } from '@nestjs/config';

const schedulerClient = new SchedulerClient({ region: process.env.AWS_REGION! });

const EventBridgeSechulerRole = 'arn:aws:iam::353643225333:role/EventBridgeSchedulerRole';

const scheduleName = (dataSourceId: string): string => `schedule-${dataSourceId}`;

const syncIntervalToSchedulerRate = (interval: DataSyncInterval): string => {
    switch (interval) {
        case DataSyncInterval.INSTANT:
            return 'rate(15 minutes)';
        case DataSyncInterval.SEMI_DAILY:
            return 'rate(12 hours)';
        case DataSyncInterval.DAILY:
            return 'rate(1 day)';
        case DataSyncInterval.WEEKLY:
        default:
            return 'rate(7 days)';
    }
};

export const createEventBridgeScheduledExecution = async (
    interval: DataSyncInterval,
    payload: APIGatewayInitiateImportParams,
    logger: Logger,
    config: ConfigService,
): Promise<void> => {
    const createScheduleCommand = new CreateScheduleCommand({
        Name: scheduleName(payload.dataSourceId),
        ScheduleExpression: syncIntervalToSchedulerRate(interval),
        Target: {
            Arn: config.get<string>(`INITIATE_${payload.dataSourceType}_LAMBDA_ARN`)!,
            Input: JSON.stringify(payload),
            RoleArn: EventBridgeSechulerRole,
            RetryPolicy: {
                MaximumEventAgeInSeconds: 600,
                MaximumRetryAttempts: 20,
            },
        },
        State: ScheduleState.ENABLED,
        FlexibleTimeWindow: {
            Mode: FlexibleTimeWindowMode.FLEXIBLE,
            MaximumWindowInMinutes: 12,
        },
        ActionAfterCompletion: ActionAfterCompletion.NONE,
    });

    try {
        const ruleResponse = await schedulerClient.send(createScheduleCommand);

        logger.log(
            `Added scheduler ${ruleResponse.ScheduleArn} to sync datasource ${payload.dataSourceId} on ${interval} interval`,
            LoggerContext.DATA_SOURCE,
        );
    } catch (error) {
        logger.error(
            `Creating schedule for datasource ${payload.dataSourceId} failed: ${error.message}`,
            error.stack,
            LoggerContext.DATA_SOURCE,
        );
        throw new InternalError(error.message);
    }
};

export const deleteEventBridgeSchedule = async (dataSourceId: string, logger: Logger): Promise<void> => {
    const command = new DeleteScheduleCommand({
        Name: scheduleName(dataSourceId),
    });

    logger.log(`Deleting EventBridge schedule for datasource ${dataSourceId}`, LoggerContext.DATA_SOURCE);

    try {
        await schedulerClient.send(command);
    } catch (error) {
        logger.error(
            `Delete schedule for datasource ${dataSourceId} failed: ${error.message}`,
            error.stack,
            LoggerContext.DATA_SOURCE,
        );
        throw new InternalError(error.message);
    }
};
