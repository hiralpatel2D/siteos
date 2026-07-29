import jwt from 'jsonwebtoken';

const SECRET = process.env.SITEOS_JWT_SECRET || 'siteos-dev-secret-change-in-production';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
