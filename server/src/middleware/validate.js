const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? 'Validation error';
    return res.status(400).json({
      success: false,
      message,
    });
  }

  req.body = result.data;
  next();
};

export default validate;
