import { APIGatewayEvent } from "aws-lambda";
import { handler } from "../../lib/handlers/api/uploader-image";
import { readFile } from "fs/promises";
import imageType from "image-type";
import { join } from "path";

jest.mock("../../lib/clients/S3Client", () => ({
  s3Client: {
    putObject: jest.fn()
  }
}));

jest.mock("image-type", () => ({
  __esModule: true,
  default: jest.fn()
}));

describe("Uploader image", () => {
  it("should return 200", async () => {
    const filePath = join(__dirname, "../files/testFile.jpeg");
    const file = await readFile(filePath, {
      encoding: "base64"
    });

    const event = {
      body: file
    };

    (imageType as jest.Mock).mockReturnValue({
      mime: "image/jpeg",
      ext: "jpeg"
    });

    const response = await handler(event as APIGatewayEvent);
    expect(response.statusCode).toBe(200);
  });

  it("Should return status 400 when there is not image present", async () => {
    const event = {
      body: ""
    };

    const response = await handler(event as APIGatewayEvent);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: "something went wrong" }));
  });

  it("Should return status 400 when the image type is invalid", async () => {
    const filePath = join(__dirname, "../files/testFile.jpeg");
    const file = await readFile(filePath, {
      encoding: "base64"
    });

    const event = {
      body: file
    };

    (imageType as jest.Mock).mockReturnValue({
      mime: "image/invalid",
      ext: "invalid"
    });

    const response = await handler(event as APIGatewayEvent);

    expect(response.statusCode).toBe(400);
    expect(response.body).toBe(JSON.stringify({ message: "invalid image type" }));
  });
});
