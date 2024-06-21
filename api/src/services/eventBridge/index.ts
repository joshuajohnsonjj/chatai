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
} from '@aws-sdk/client-scheduler';
import { DataSyncInterval } from '@prisma/client';

const EventBridgeSechulerRole = 'arn:aws:iam::353643225333:role/EventBridgeSchedulerRole';

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
    region: string,
    lambdaArn: string,
    logger: Logger,
    interval: DataSyncInterval,
    payload: APIGatewayInitiateImportParams,
): Promise<void> => {
    const schedulerClient = new SchedulerClient({ region });

    try {
        const createScheduleCommand = new CreateScheduleCommand({
            Name: `schedule-${payload.dataSourceId}`,
            ScheduleExpression: syncIntervalToSchedulerRate(interval),
            Target: {
                Arn: lambdaArn,
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
                MaximumWindowInMinutes: 15,
            },
            ActionAfterCompletion: ActionAfterCompletion.NONE,
        });

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
