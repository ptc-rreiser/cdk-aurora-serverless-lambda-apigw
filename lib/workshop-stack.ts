import * as cdk from '@aws-cdk/core';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as rds from '@aws-cdk/aws-rds';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigw from '@aws-cdk/aws-apigateway';

import { LoggerConstruct } from './logger-construct';

export class WorkshopStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'WorkshopVpc');
    const auroraServerless = new rds.ServerlessCluster(this, 'WorkshopAuroraServerless', {
      engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
      vpc,
      defaultDatabaseName: 'workshop',
      enableDataApi: true,
      scaling: {
        minCapacity: 1,
        maxCapacity: 32,
        autoPause: cdk.Duration.seconds(0) // Optional. If not set, then instance will pause after 5 minutes 
      }
    });

    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
      environment: {
        CLUSTER_ARN: auroraServerless.clusterArn,
        SECRET_ARN: auroraServerless.secret!.secretArn!,
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1'
      },
    });
    auroraServerless.grantDataApiAccess(hello);

    const helloLogger = new LoggerConstruct(this, 'HelloLogger', {
      lambdaFunc: hello,
    });

    new apigw.LambdaRestApi(this, 'Endpoint', {
      handler: helloLogger.handler,
    });
  }
}
