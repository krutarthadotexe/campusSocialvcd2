export function sendSuccess(res, statusCode, data, meta) {
  const body = {
    success: true,
    data
  };

  if (meta) {
    body.meta = meta;
  }

  return res.status(statusCode).json(body);
}

export function sendError(res, statusCode, error) {
  return res.status(statusCode).json({
    success: false,
    error
  });
}
