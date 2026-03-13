import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
      validate: [(value) => value.length === 2, 'Conversation requires two participants']
    },
    participantsKey: { type: String, required: true, unique: true, index: true },
    lastMessageText: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1, _id: -1 });

export const Conversation = mongoose.model('Conversation', conversationSchema);
