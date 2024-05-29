import {
    EventBridgeClient,
    PutRuleCommand,
    type PutRuleCommandInput,
    PutTargetsCommand,
} from '@aws-sdk/client-eventbridge';
import { Logger } from '@nestjs/common';
import type { APIGatewayInitiateImportParams } from 'src/types';

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
    const eventBridgeClient = new EventBridgeClient({ region });

    try {
        const ruleName = `rule-${Date.now()}`;
        const ruleParams: PutRuleCommandInput = {
            Name: ruleName,
            ScheduleExpression: `cron(${dateToCron(executionDate)})`,
            State: 'ENABLED',
        };

        const ruleResponse = await eventBridgeClient.send(new PutRuleCommand(ruleParams));
        logger.log(`Added scheduler rule ${ruleResponse.RuleArn} for execution on ${executionDate.toISOString()}`);

        const targetParams = {
            Rule: ruleName,
            Targets: [
                {
                    Id: `${payload.dataSourceType}EventBridgeTarget-${process.env.NODE_ENV}`,
                    Arn: lambdaArn,
                    Input: JSON.stringify(payload),
                },
            ],
        };

        await eventBridgeClient.send(new PutTargetsCommand(targetParams));
        logger.log('Target added.');
    } catch (error) {
        logger.error('Error creating EventBridge schedule:', error);
    }
};
