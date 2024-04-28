import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { getResourceName } from "../utils/getResourceNames";

export class BaseStack extends cdk.NestedStack {
  public readonly bucket: s3.Bucket;
  public readonly apiEndpoint: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.bucket = new s3.Bucket(this, "storage", {
      publicReadAccess: false,
      bucketName: getResourceName("app-image-uploader-bucket"),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });

    const bucketPublicPolicy = new iam.PolicyStatement({
      sid: "PublicReadGetObject",
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal()],
      actions: ["s3:GetObject"],
      resources: [this.bucket.arnForObjects("*")],
    });

    this.bucket.addToResourcePolicy(bucketPublicPolicy);

    const bucketPublicAccessPolicy = new iam.PolicyStatement({
      sid: "PublicRead",
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject", "s3:PutObjectAcl"],
      resources: [this.bucket.bucketArn, this.bucket.arnForObjects("*")],
    });

    this.apiEndpoint = new cdk.aws_apigateway.RestApi(this, "apiEndpoint", {
      restApiName: getResourceName("image-uploader-api"),
      description: "api endpoint for image uploader",
      deployOptions: {
        stageName: "v1",
      },
      defaultCorsPreflightOptions: {
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"],
      },
      binaryMediaTypes: ["image/jpeg", "image/png", "multipart/form-data"],
    });

    const logGroup = new cdk.aws_logs.LogGroup(this, "logGroup", {
      logGroupName: getResourceName("image-uploader-log-group"),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    });

    const handleUploadImage = new NodejsFunction(this, "handleUploadImage", {
      functionName: getResourceName("handle-upload-image"),
      entry: path.join(__dirname, "..", "handlers", "api", "uploader-image.ts"),
      runtime: Runtime.NODEJS_20_X,
      handler: "handler",
      memorySize: 1024,
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
      },
      logGroup: logGroup,
    });

    // this.bucket.addToResourcePolicy(bucketPublicAccessPolicy);
    handleUploadImage.addToRolePolicy(bucketPublicAccessPolicy);

    const handleImageResource = this.apiEndpoint.root.addResource("images");
    handleImageResource.defaultMethodOptions;

    const handleUploadImageIntegration =
      new cdk.aws_apigateway.LambdaIntegration(handleUploadImage);

    handleImageResource.addMethod("POST", handleUploadImageIntegration, {
      requestParameters: {
        "method.request.header.Content-Type": true,
      },
    });
  }
}
