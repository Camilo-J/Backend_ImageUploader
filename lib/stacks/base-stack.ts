import { NestedStack, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { PolicyStatement, Effect, AnyPrincipal } from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { getResourceName } from "../utils/getResourceNames";
import { CachePolicy, Distribution, OriginAccessIdentity, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Cors, LambdaIntegration, RestApi } from "aws-cdk-lib/aws-apigateway";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";

export class BaseStack extends NestedStack {
  public readonly bucket: Bucket;
  public readonly apiEndpoint: RestApi;
  public readonly cloudfrontUrl: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const bucketName = process.env.BUCKET_NAME || "";

    this.bucket = new Bucket(this, "storage", {
      publicReadAccess: false,
      bucketName: getResourceName(bucketName),
      removalPolicy: RemovalPolicy.DESTROY,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false
      },
      autoDeleteObjects: true
    });

    const mediasCloudfront = new Distribution(this, "media-cloudfront", {
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED
      }
    });

    const cloudFrontOAI = new OriginAccessIdentity(this, "media-oai", {
      comment: `OAI for ${id}`
    });

    this.bucket.grantRead(cloudFrontOAI);

    mediasCloudfront.addBehavior("/*", S3BucketOrigin.withOriginAccessControl(this.bucket));

    const bucketPublicPolicy = new PolicyStatement({
      sid: "PublicReadGetObject",
      effect: Effect.ALLOW,
      principals: [new AnyPrincipal()],
      actions: ["s3:GetObject"],
      resources: [this.bucket.arnForObjects("*")]
    });

    this.bucket.addToResourcePolicy(bucketPublicPolicy);

    const bucketPublicAccessPolicy = new PolicyStatement({
      sid: "PublicRead",
      effect: Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject", "s3:PutObjectAcl"],
      resources: [this.bucket.bucketArn, this.bucket.arnForObjects("*")]
    });

    this.apiEndpoint = new RestApi(this, "apiEndpoint", {
      restApiName: getResourceName("image-uploader-api"),
      description: "api endpoint for image uploader",
      deployOptions: {
        stageName: "v1",
        description: "v1 of the api"
      },
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
        allowHeaders: ["Content-Type", "Authorization"]
      },
      binaryMediaTypes: ["image/jpeg", "image/png", "multipart/form-data"]
    });

    const logGroup = new LogGroup(this, "logGroup", {
      logGroupName: getResourceName("image-uploader-log-group"),
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_MONTH
    });

    const handleUploadImage = new NodejsFunction(this, "handleUploadImage", {
      functionName: getResourceName("handle-upload-image"),
      entry: join(__dirname, "..", "handlers", "api", "uploader-image.ts"),
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      handler: "handler",
      memorySize: 1024,
      environment: {
        BUCKET_NAME: this.bucket.bucketName,
        CLOUDFRONT_URL: `https://${mediasCloudfront.distributionDomainName}`
      },
      logGroup: logGroup
    });

    handleUploadImage.addToRolePolicy(bucketPublicAccessPolicy);

    const handleImageResource = this.apiEndpoint.root.addResource("images");
    handleImageResource.defaultMethodOptions;

    const handleUploadImageIntegration = new LambdaIntegration(handleUploadImage);

    handleImageResource.addMethod("POST", handleUploadImageIntegration, {
      requestParameters: {
        "method.request.header.Content-Type": true
      }
    });

    this.cloudfrontUrl = `https://${mediasCloudfront.distributionDomainName}`;
  }
}
