export const handler = (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      image_url: "link to image",
    }),
  };
};
