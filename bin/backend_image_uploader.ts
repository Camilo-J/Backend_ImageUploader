#!/usr/bin/env node
import 'source-map-support/register';
import { loadEnvFile } from 'node:process';
import * as cdk from 'aws-cdk-lib';
import { BackendImageUploaderStack } from '../lib/backend_image_uploader-stack';

loadEnvFile();

const app = new cdk.App();
new BackendImageUploaderStack(app, 'BackendImageUploaderStack', {
  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: process.env.AWS_ACCOUNT, region: process.env.AWS_REGION }

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
