import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';

export interface LoggerConstructProps {
    lambdaFunc: lambda.IFunction;
}

export class LoggerConstruct extends cdk.Construct {

    public readonly handler: lambda.Function;

    constructor(scope: cdk.Construct, id: string, props: LoggerConstructProps) {
        super(scope, id);

        this.handler = new lambda.Function(this, `LoggerHandler`, {
            runtime: lambda.Runtime.NODEJS_14_X,
            handler: 'logger.handler',
            code: lambda.Code.fromAsset('lambda'),
            environment: {
                DOWNSTREAM_FUNCTION_NAME: props.lambdaFunc.functionName,
                AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
            },
        });

        props.lambdaFunc.grantInvoke(this.handler);
    }
}