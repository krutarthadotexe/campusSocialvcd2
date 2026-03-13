import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    format: { type: String, required: true },
    data: { type: Buffer, required: true }
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    startsAt: { type: Date, required: true, index: true },
    endsAt: { type: Date, required: true },
    photos: { type: [photoSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rsvps: {
      type: [
        new mongoose.Schema(
          {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            status: { type: String, enum: ['going', 'interested'], required: true }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
);

eventSchema.index({ startsAt: 1, _id: 1 });

export const Event = mongoose.model('Event', eventSchema);
