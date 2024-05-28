import { EventBridgeClient, PutRuleCommand, PutTargetsCommand } from '@aws-sdk/client-eventbridge';
import { Logger } from '@nestjs/common';

const dateToCron = (date: Date): string => {
    const minutes = date.getUTCMinutes();
    const hours = date.getUTCHours();
    const dayOfMonth = date.getUTCDate();
    const month = date.getUTCMonth() + 1; // getUTCMonth() is zero-based
    const year = date.getUTCFullYear();

    return `${minutes} ${hours} ${dayOfMonth} ${month} ? ${year}`;
};

export const createEventBridgeSchedule = async (
    region: string,
    executionDate: Date,
    lambdaArn: string,
    logger: Logger,
) => {
    const eventBridgeClient = new EventBridgeClient({ region });
    try {
        const ruleName = `rule-${Date.now()}`;
        const ruleParams = {
            Name: ruleName,
            ScheduleExpression: `cron(${dateToCron(executionDate)})`,
            State: 'ENABLED',
        };

        const ruleCommand = new PutRuleCommand(ruleParams);
        const ruleResponse = await eventBridgeClient.send(ruleCommand);
        logger.log(`Added scheduler rule ${ruleResponse.RuleArn} for execution on ${executionDate.toISOString()}`);

        const targetParams = {
            Rule: ruleName,
            Targets: [
                {
                    Id: 'MyLambdaFunctionTarget',
                    Arn: lambdaArn,
                },
            ],
        };

        const targetCommand = new PutTargetsCommand(targetParams);
        await eventBridgeClient.send(targetCommand);
        logger.log('Target added.');
    } catch (error) {
        logger.error('Error creating EventBridge schedule:', error);
    }
};
