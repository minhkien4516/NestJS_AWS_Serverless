import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';

export class UserServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const usersTable = dynamodb.Table.fromTableName(
      this,
      'UsersTable',
      'Users'
    );

    // DynamoDB
    const translateTable = dynamodb.Table.fromTableName(
      this,
      'TranslationsTable',
      'Translations'
    );

    // S3 Bucket
    const fileBucket = s3.Bucket.fromBucketName(
      this,
      'UserBucket',
      'lambda-function-bucket-kienmai'
    );

    // Lambda Function
    const userLambda = lambda.Function.fromFunctionArn(
      this,
      'UserServiceLambda',
      'arn:aws:lambda:ap-southeast-1:438465128644:function:backend-app-func'
    );

    // Worker Lambda Function
    // const workerLambda = lambda.Function.fromFunctionArn(
    //   this,
    //   'UserServiceStack-WorkerLambdaBD11C0E2-urx32zfV0DRO',
    //   'arn:aws:lambda:ap-southeast-1:438465128644:function:UserServiceStack-WorkerLambdaBD11C0E2-urx32zfV0DRO'
    // );

    // API Gateway
    const api = apigateway.RestApi.fromRestApiId(
      this,
      'UserServiceApi',
      't3j5w08opi'
    );

    // Cognito
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      'UserPoolRxps2v',
      'ap-southeast-1_sDCnWUehQ'
    );

    // SNS
    const notificationTopic = sns.Topic.fromTopicArn(
      this,
      'UserNotifications',
      'arn:aws:sns:ap-southeast-1:438465128644:user-notifications'
    );

    // SQS
    const translationQueue = sqs.Queue.fromQueueArn(
      this,
      'translationQueue',
      'arn:aws:sqs:ap-southeast-1:438465128644:translationQueue'
    );

    // worker lambda
    const workerLambda = new lambda.Function(
      this,
      'TranslationWorkerFunction',
      {
        functionName: 'UserServiceStack-WorkerLambdaBD11C0E2-lMOc19jAjPHX',
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'worker/handler.handler',
        code: lambda.Code.fromAsset('../backend-app/dist'),
        environment: {
          TRANSLATION_QUEUE_URL: translationQueue.queueUrl,
          TRANSLATION_TABLE: translateTable.tableName,
          BEDROCK_MODEL_ARN:
            'arn:aws:bedrock:ap-southeast-1:438465128644:inference-profile/apac.anthropic.claude-sonnet-4-20250514-v1:0',
        },
        timeout: cdk.Duration.seconds(60),
        memorySize: 512,
      }
    );

    workerLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(translationQueue, {
        batchSize: 1,
        maxConcurrency: 3,
        reportBatchItemFailures: true,
      })
    );

    translationQueue.grantConsumeMessages(workerLambda);
    translateTable.grantReadWriteData(workerLambda);

    // Outputs
    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: userLambda.functionArn,
      description: 'Imported existing Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: api.restApiId,
      description: 'Imported existing API Gateway ID',
    });

    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: usersTable.tableName,
      description: 'Imported existing DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'S3Bucket', {
      value: fileBucket.bucketName,
      description: 'Imported existing S3 bucket name',
    });

    new cdk.CfnOutput(this, 'CognitoUserPoolId', {
      value: userPool.userPoolId,
      description: 'Imported existing Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: notificationTopic.topicArn,
      description: 'Imported existing SNS Topic ARN',
    });

    new cdk.CfnOutput(this, 'WorkerLambdaArn', {
      value: workerLambda.functionArn,
      description: 'Worker Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'TranslationQueueUrl', {
      value: translationQueue.queueUrl,
      description: 'SQS Translation Queue URL',
    });
  }
}
