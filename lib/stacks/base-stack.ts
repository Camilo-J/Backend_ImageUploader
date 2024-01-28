import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import path = require("path");

export class BaseStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, "storage", {
      publicReadAccess: true,
      bucketName: "storage-bucket-images",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    const bucketPublicAccessPolicy = new iam.PolicyStatement({
      sid: "PublicRead",
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ["s3:GetObject"],
      resources: [bucket.bucketArn, bucket.arnForObjects("*")],
    });

    bucket.addToResourcePolicy(bucketPublicAccessPolicy);

    const apiEndpoint = new cdk.aws_apigateway.RestApi(this, "apiEndpoint", {
      restApiName: "image-uploader-api",
      description: "api endpoint for image uploader",
      deployOptions: {
        stageName: "v1",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
    });

    const handleUploadImage = new NodejsFunction(this, "handleUploadImage", {
      functionName: "handleUploadImage",
      entry: path.join(__dirname, "..", "handlers", "api", "uploader-image.ts"),
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 1024,
      environment: {},
    });

    const handleImageResource = apiEndpoint.root.addResource("images");

    const handleUploadImageIntegration =
      new cdk.aws_apigateway.LambdaIntegration(handleUploadImage);

    handleImageResource.addMethod("POST", handleUploadImageIntegration);
  }
}
