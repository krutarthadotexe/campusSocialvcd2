import mongoose from 'mongoose';

const avatarSchema = new mongoose.Schema(
  {
    filename: String,
    contentType: String,
    sizeBytes: Number,
    data: Buffer
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    bio: { type: String, default: '', maxlength: 160 },
    avatar: { type: avatarSchema, default: null },
    isPrivate: { type: Boolean, default: false },
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    tokenVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

userSchema.index({ username: 'text', name: 'text' });

export const User = mongoose.model('User', userSchema);
