import { Notification } from '../models/Notification.js';

export async function createNotification({ recipient, actor, type, entityType, entityId }) {
  if (String(recipient) === String(actor)) {
    return null;
  }

  return Notification.create({ recipient, actor, type, entityType, entityId });
}
