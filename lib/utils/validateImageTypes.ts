import imageType from "image-type";

export const validateImageTypes = async (imageParsed: Buffer) => {
  const result = await imageType(imageParsed);

  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/psd",
    "image/tiff",
  ];

  if (validTypes.includes(result?.mime || "")) {
    return { valid: true, result: result };
  }

  return { valid: false, result: undefined };
};
