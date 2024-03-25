import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { config } from "dotenv";
import { BaseStack } from "./stacks/base-stack";
config();

export class BackendImageUploaderStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const baseStack = new BaseStack(this, "BaseStack");

    new cdk.CfnOutput(this, "apiEndpoint", {
      value: baseStack.apiEndpoint.url,
    });

    new cdk.CfnOutput(this, "bucket", {
      value: baseStack.bucket.bucketName,
    });
  }
}
