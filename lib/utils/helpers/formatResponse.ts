const formatResponse = (data: object, status: number, error?: string) => {
  return {
    statusCode: error ? 400 : status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: error ? JSON.stringify({ message: error }) : JSON.stringify(data),
  };
};

export { formatResponse };
