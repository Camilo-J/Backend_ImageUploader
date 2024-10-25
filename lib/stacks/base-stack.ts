import { NestedStack, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { Architecture, Runtime } from "aws-cdk-lib/aws-lambda";
import { join } from "path";
import { getResourceName } from "../utils/getResourceNames";
import { CachePolicy, CfnDistribution, CfnOriginAccessControl, Distribution, ViewerProtocolPolicy } from "aws-cdk-lib/aws-cloudfront";
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
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      autoDeleteObjects: true
    });

    const accessControl = new CfnOriginAccessControl(this, "ImageUploaderOriginAccessControl", {
      originAccessControlConfig: {
        name: "ImageUploaderOriginAccessControl",
        originAccessControlOriginType: "s3",
        signingBehavior: "always",
        signingProtocol: "sigv4"
      }
    });

    const originAccessControl = S3BucketOrigin.withOriginAccessControl(this.bucket, {
      originAccessControlId: accessControl.attrId
    });

    const mediasCloudfront = new Distribution(this, "media-cloudfront", {
      defaultBehavior: {
        origin: originAccessControl,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED
      }
    });

    mediasCloudfront.addBehavior("/*", originAccessControl);

    const cfnDistribution = mediasCloudfront.node.defaultChild as CfnDistribution;

    cfnDistribution.addPropertyOverride("DistributionConfig.Origins.0.OriginAccessControlId", accessControl.getAtt("Id"));

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

    this.bucket.grantReadWrite(handleUploadImage);

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
