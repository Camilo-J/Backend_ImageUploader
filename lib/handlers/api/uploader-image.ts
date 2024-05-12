import { APIGatewayEvent } from "aws-lambda";
import { s3Client } from "../../clients/S3Client";
import { randomUUID } from "crypto";
import { validateImageTypes } from "../../utils/validateImageTypes";
import { formatResponse } from "../../utils/helpers/formatResponse";

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
      Key: `images/${keyName}`,
      Body: imageParsed,
      ContentType: result?.mime || "image/jpeg",
    };

    await s3Client.putObject(params);
    const imageUrl = `${process.env.CLOUDFRONT_URL}/images/${keyName}`;
    return formatResponse({ image_url: imageUrl }, 200);
  } catch (error) {
    console.error(error);
    return formatResponse({}, 200, "something went wrong");
  }
};
