import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    body: { type: String, required: true, maxlength: 2000 },
    readBy: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] }
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1, _id: -1 });

export const Message = mongoose.model('Message', messageSchema);
