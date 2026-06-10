/** 404 handler for unmatched routes. */
export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found - ${req.originalUrl}`));
};

/**
 * Centralized error handler. Translates common Mongoose/Mongo errors
 * into clean HTTP responses so controllers can just `throw`/`next(err)`.
 */
export const errorHandler = (err, _req, res, _next) => {
  let status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || "Server error";

  // Mongoose validation error
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Duplicate key (e.g. unique username or duplicate relationship)
  if (err.code === 11000) {
    status = 409;
    message = "Duplicate value violates a unique constraint";
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}`;
  }

  res.status(status).json({
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};
