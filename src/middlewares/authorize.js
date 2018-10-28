import { authenticate } from '../database';

/**
 * Validates the 'authorization' header and populates req.user
 */
export default async function authorize (req, res, next) {
  const user = await authenticate(req.headers.authorization);

  if (!user) {
    return res.status(401).json({
      status: 401,
      error: 'You must be logged in to access this route'
    });
  }

  req.user = user;
  next();
}
