#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { UserServiceStack } from '../lib/user-service-stack';

const app = new cdk.App();
new UserServiceStack(app, 'UserServiceStack', {
  env: {
    account: '438465128644',
    region: 'ap-southeast-1',
  },
});
