import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    body: { type: String, required: true, maxlength: 500 },
    likesCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: -1, _id: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
