import mongoose from 'mongoose';

const storyMediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    data: { type: Buffer, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true }
  },
  { _id: false }
);

const storyViewerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    viewedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const storySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    media: { type: storyMediaSchema, required: true },
    caption: { type: String, default: '', maxlength: 300 },
    viewers: { type: [storyViewerSchema], default: [] },
    expiresAt: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

storySchema.index({ owner: 1, createdAt: -1 });

export const Story = mongoose.model('Story', storySchema);
