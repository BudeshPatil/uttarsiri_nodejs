export const successResponse = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

export const errorResponse = (res, statusCode, message, errorCode) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error_code: errorCode,
  });
};
