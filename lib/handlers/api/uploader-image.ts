import { APIGatewayEvent } from "aws-lambda";
import { s3Client } from "../../clients/S3Client";
import { randomUUID } from "crypto";
import { validateImageTypes } from "../../utils/validateImageTypes";

export const handler = async (event: APIGatewayEvent) => {
  const image = event.body;

  if (!image) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "something went wrong",
      }),
    };
  }

  const imageParsed = Buffer.from(image, "base64");
  const { result, valid } = await validateImageTypes(imageParsed);

  if (!valid) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: "invalid image type",
      }),
    };
  }

  try {
    const name = randomUUID();
    const keyName = `${name}.${result?.ext || "jpeg"}`;
    const params = {
      Bucket: process.env.BUCKET_NAME || "",
      Key: keyName,
      Body: imageParsed,
      ContentType: result?.mime || "image/jpeg",
    };

    await s3Client.putObject(params);
    const imageUrl = `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        image_url: imageUrl,
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
