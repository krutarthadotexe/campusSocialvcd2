import { env } from '../config/env.js';
import { HTTP_STATUS } from '../constants/http.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { loginUser, refreshSession, registerUser, revokeRefreshTokens, sanitizeUser } from '../services/authService.js';

function setRefreshCookie(res, refreshToken) {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth'
  });
}

function clearRefreshCookie(res) {
  res.clearCookie(env.REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
}

export const register = asyncHandler(async (req, res) => {
  const payload = await registerUser(req.validated.body);
  setRefreshCookie(res, payload.refreshToken);
  return sendSuccess(res, HTTP_STATUS.CREATED, {
    accessToken: payload.accessToken,
    user: payload.user
  });
});

export const login = asyncHandler(async (req, res) => {
  const payload = await loginUser(req.validated.body);
  setRefreshCookie(res, payload.refreshToken);
  return sendSuccess(res, HTTP_STATUS.OK, {
    accessToken: payload.accessToken,
    user: payload.user
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.REFRESH_COOKIE_NAME];
  const payload = await refreshSession(token);
  setRefreshCookie(res, payload.refreshToken);
  return sendSuccess(res, HTTP_STATUS.OK, {
    accessToken: payload.accessToken,
    user: payload.user
  });
});

export const logout = asyncHandler(async (req, res) => {
  await revokeRefreshTokens(req.user.id);
  clearRefreshCookie(res);
  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Logged out successfully' });
});

export const currentUser = asyncHandler(async (req, res) => {
  return sendSuccess(res, HTTP_STATUS.OK, { user: sanitizeUser(req.user) });
});
