import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    resourceType: { type: String, enum: ['image', 'video'], required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    duration: { type: Number, default: null },
    format: { type: String, required: true },
    data: { type: Buffer, required: true }
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    caption: { type: String, default: '', maxlength: 2200 },
    media: { type: [mediaSchema], required: true, validate: [(value) => value.length > 0, 'Post requires media'] },
    locationText: { type: String, default: '', maxlength: 120 },
    tags: { type: [String], default: [] },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

postSchema.index({ owner: 1, createdAt: -1, _id: -1 });

export const Post = mongoose.model('Post', postSchema);
