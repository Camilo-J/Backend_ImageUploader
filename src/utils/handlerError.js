function handlerError(statusCode = 403, message = "something happened") {
  return {
    statusCode,
    body: { error: message },
  };
}

export default handlerError;
