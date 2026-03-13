import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL });
}

export function signRefreshToken(userId, tokenVersion) {
  return jwt.sign({ sub: userId, tokenVersion }, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}
