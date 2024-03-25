import { APIGatewayEvent } from "aws-lambda";
import { s3Client } from "../../clients/S3Client";

export const handler = async (event: APIGatewayEvent) => {
  const image = event.body;

  console.log(image);

  if (!image) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "something went wrong",
      }),
    };
  }
  try {
    const imageParsed = Buffer.from(image, "base64");
    const keyName = `image-${new Date().toISOString()}.jpeg`;
    const params = {
      Bucket: process.env.BUCKET_NAME || "",
      Key: keyName,
      Body: imageParsed,
      ContentType: "image/jpeg",
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
