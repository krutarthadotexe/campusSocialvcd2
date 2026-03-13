import { HTTP_STATUS } from '../constants/http.js';
import { Notification } from '../models/Notification.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';
import { buildCursorMeta, decodeCursor } from '../utils/pagination.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { cursor, limit } = req.validated.query;
  const filter = { recipient: req.user.id };
  const decoded = decodeCursor(cursor);

  if (decoded) {
    filter.$or = [
      { createdAt: { $lt: new Date(decoded.createdAt) } },
      { createdAt: new Date(decoded.createdAt), _id: { $lt: decoded.id } }
    ];
  }

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)
    .populate('actor', 'username name avatar');
  const { items, meta } = buildCursorMeta(notifications, limit, (item) => ({
    id: item._id,
    createdAt: item.createdAt.toISOString()
  }));

  return sendSuccess(res, HTTP_STATUS.OK, { notifications: items }, meta);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.validated.params.notificationId, recipient: req.user.id },
    { readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Notification not found');
  }

  return sendSuccess(res, HTTP_STATUS.OK, { notification });
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user.id, readAt: null }, { readAt: new Date() });
  return sendSuccess(res, HTTP_STATUS.OK, { message: 'All notifications marked as read' });
});
