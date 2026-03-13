import mongoose from 'mongoose';

const likeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['post', 'comment'], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true }
  },
  { timestamps: true }
);

likeSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

export const Like = mongoose.model('Like', likeSchema);
