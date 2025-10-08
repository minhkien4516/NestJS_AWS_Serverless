import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as sns from 'aws-cdk-lib/aws-sns';

export class UserServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // DynamoDB
    const usersTable = dynamodb.Table.fromTableName(
      this,
      'UsersTable',
      'Users'
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
  }
}
