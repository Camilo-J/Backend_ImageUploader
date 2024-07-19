# Infrastructure for Image Uploader

This project contains the infrastructure for the image uploader. It uses AWS CDK to create the infrastructure.
## Infrastructure

The infrastructure consists of the following components:

- **API Gateway**: It is used to upload images. The API Gateway has a POST method that triggers a Lambda function to upload the image to an S3 bucket.
- **Lambda Function**: It is triggered by the API Gateway to upload the image to an S3 bucket and return an image's url.
- **S3 Bucket**: It stores the images uploaded by the users.
- **CloudFront Distribution**: It is used to serve the images uploaded by the users.
- **S3 Bucket Policy**: It allows the Lambda function to upload the image to the S3 bucket.
- **CloudWatch Logs**: It stores the logs of the Lambda function.
 
 ![Infrastructure](https://d3d1blxf7uqspy.cloudfront.net/images/d80aea93-733a-449d-aa5b-d381edd8650a.png)

## Prerequisites

- Node.js
- AWS CLI
- AWS CDK
- AWS Account

## Installation

1. Clone the repository
   ```bash
    git clone git@github.com:Camilo-J/Backend_ImageUploader.git
    ```
2. Install the dependencies
    ```bash
    npm install
    ```
3. Deploy the stack to AWS(AWS CLI must be configured)
    ```bash
    cdk deploy
    ```
4. After the deployment, you will see the output of the stack. You will see the URL of the API Gateway. You can use this URL to upload images.
   
5. To destroy the stack
    ```bash
    cdk destroy
    ```
## Usage

To upload an image, you can use the following command:

```bash
curl -X POST -F "file=@<path_to_image>" <API_URL>
```

For example:

```bash
curl -X POST -F "file=@./image.jpg" https://<API_ID>.execute-api.<REGION>.amazonaws.com/prod/upload
```

## License

This project is licensed under the MIT License - see the [LICENSE](https://opensource.org/license/mit) file for details.


