/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as apigw from '@aws-cdk/aws-apigatewayv2-alpha';
import * as apigwInt from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNode from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cdkLogs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import path from 'node:path';
import { helloController } from '../definition.js';

export class HelloWorldStack extends cdk.Stack {
  public apiUrl: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaProps: lambdaNode.NodejsFunctionProps = {
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.NODEJS_18_X,
      logRetention: cdkLogs.RetentionDays.ONE_DAY,
      bundling: {
        minify: false,
        target: 'node16'
        // externalModules: layer.packagedDependencies
      }
      // layers: [layer.layerVersion],
      // environment: {
      //   TABLE_NAME: table.tableName
      // }
    };

    const helloFunction = new lambdaNode.NodejsFunction(this, 'HelloFunction', {
      ...lambdaProps,
      entry: path.join(__dirname, `/../../src/implementation.ts`)
    });

    const helloIntegration = new apigwInt.HttpLambdaIntegration(`HelloFunctionIntegration`, helloFunction);

    const api = new apigw.HttpApi(this, 'Api', {});
    api.addRoutes({
      path: helloController.hello.path,
      methods: [helloController.hello.method.toUpperCase() as apigw.HttpMethod],
      integration: helloIntegration
    });

    this.apiUrl = new cdk.CfnOutput(this, 'apiUrl', { value: api.url! });
  }
}
