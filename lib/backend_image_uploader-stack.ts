import { CfnOutput, Stack, type StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { BaseStack } from './stacks/base-stack';

export class BackendImageUploaderStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const baseStack = new BaseStack(this, 'BaseStack');

    new CfnOutput(this, 'apiEndpoint', {
      value: baseStack.apiEndpoint.url
    });

    new CfnOutput(this, 'bucket', {
      value: baseStack.bucket.bucketName
    });

    new CfnOutput(this, 'cloudfrontUrl', {
      value: baseStack.cloudfrontUrl
    });
  }
}
