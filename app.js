import formidable from "formidable";
import cloudinary from "./src/config/cloudinary.js";
import handlerError from "./src/utils/handlerError.js";
export const upload = async (req) => {
  // const form = new formidable.IncomingForm();
  const form = formidable({});
  let fields, files, response;

  // Manage errors from formidable
  try {
    [fields, files] = await form.parse(req);
  } catch (error) {
    return handlerError(error.httpCode || 400, error.message);
  }
  // Manage errors from cloudinary
  try {
    console.log("files", files);
    response = await cloudinary.uploader.upload(files["image"][0].filepath, {
      resource: "auto",
      folder: "DEV",
    });
    console.log("response of cloudinary", response);
  } catch (error) {
    console.log("error of cloudinary");

    return handlerError(400, error.message);
  }
  return {
    statusCode: 200,
    body: { image_url: response.url },
  };
};
