import { APIGatewayEvent } from "aws-lambda";
import { s3Client } from "../../clients/S3Client";
import { PutObjectRequest } from "@aws-sdk/client-s3";

export const handler = async (event: APIGatewayEvent) => {
  const { body } = event;
  const image = JSON.parse(body || "{}").image;

  if (!image) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "something went wrong",
      }),
    };
  }

  try {
    const imageBuffer = Buffer.from(image, "base64");
    const params = {
      Bucket: process.env.BUCKET_NAME || "",
      Key: "image.jpg",
      Body: imageBuffer,
    };

    const response = await s3Client.putObject(params);

    console.log(response);
    return {
      statusCode: 200,
      body: JSON.stringify({
        image_url: "Image uploaded successfully!",
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "something went wrong",
      }),
    };
  }
};
