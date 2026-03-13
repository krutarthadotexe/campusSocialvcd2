import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['follow', 'post_like', 'comment_like', 'comment'], required: true },
    entityType: { type: String, enum: ['user', 'post', 'comment'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1, _id: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
