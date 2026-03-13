export function validateRequest(schema) {
  return function validator(req, res, next) {
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query
    });

    req.validated = parsed;
    next();
  };
}
