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

const dateToCron = (date: Date): string => {
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // getUTCMonth() is zero-based
    const year = date.getUTCFullYear();

    return `${minutes} ${hours} ${dayOfMonth} ${month} ? ${year}`;
};

export const createEventBridgeScheduledExecution = async (
    region: string,
    lambdaArn: string,
    logger: Logger,
    executionDate: Date,
    payload: APIGatewayInitiateImportParams,
): Promise<void> => {
    const schedulerClient = new SchedulerClient({ region });

    try {
        const createScheduleCommand = new CreateScheduleCommand({
            Name: `schedule-${payload.dataSourceId}-${Date.now()}`,
            ScheduleExpression: `cron(${dateToCron(executionDate)})`,
            Target: {
                Arn: lambdaArn,
                Input: JSON.stringify(payload),
                RoleArn: 'arn:aws:iam::353643225333:role/EventBridgeSchedulerRole',
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
            ActionAfterCompletion: ActionAfterCompletion.DELETE,
        });

        const ruleResponse = await schedulerClient.send(createScheduleCommand);

        logger.log(
            `Added scheduler ${ruleResponse.ScheduleArn} to sync datasource ${payload.dataSourceId} on ${executionDate.toISOString()}`,
            LoggerContext.DATA_SOURCE,
        );
    } catch (error) {
        logger.error(
            `Error creating EventBridge schedule for datasource ${payload.dataSourceId}`,
            error.stack,
            LoggerContext.DATA_SOURCE,
        );
        throw new InternalError(error.message);
    }
};
