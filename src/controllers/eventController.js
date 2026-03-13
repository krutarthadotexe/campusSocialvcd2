import { HTTP_STATUS } from '../constants/http.js';
import { Event } from '../models/Event.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { AppError } from '../utils/appError.js';

function serializeEvent(event, currentUserId) {
  const plain = event.toObject ? event.toObject() : event;
  const currentRsvp = plain.rsvps?.find((entry) => String(entry.user?._id || entry.user) === String(currentUserId)) || null;

  return {
    ...plain,
    photos: (plain.photos || []).map((photo, index) => ({
      filename: photo.filename,
      contentType: photo.contentType,
      sizeBytes: photo.sizeBytes,
      format: photo.format,
      url: `/api/v1/events/${plain._id}/media/${index}`
    })),
    stats: {
      goingCount: plain.rsvps?.filter((entry) => entry.status === 'going').length || 0,
      interestedCount: plain.rsvps?.filter((entry) => entry.status === 'interested').length || 0
    },
    currentUserRsvp: currentRsvp?.status || 'none'
  };
}

export const createEvent = asyncHandler(async (req, res) => {
  const { title, description, location, startsAt, endsAt } = req.validated.body;
  const startsAtDate = new Date(startsAt);
  const endsAtDate = new Date(endsAt);

  if (endsAtDate <= startsAtDate) {
    throw new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Event end time must be after start time');
  }

  const event = await Event.create({
    title,
    description,
    location,
    startsAt: startsAtDate,
    endsAt: endsAtDate,
    photos: (req.files || []).map((file) => ({
      filename: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,
      format: file.originalname.includes('.') ? file.originalname.split('.').at(-1).toLowerCase() : 'bin',
      data: file.buffer
    })),
    createdBy: req.user.id
  });

  await event.populate('createdBy', 'name username role');

  return sendSuccess(res, HTTP_STATUS.CREATED, { event: serializeEvent(event, req.user.id) });
});

export const listEvents = asyncHandler(async (req, res) => {
  const events = await Event.find({})
    .sort({ startsAt: 1, _id: 1 })
    .populate('createdBy', 'name username role');

  return sendSuccess(res, HTTP_STATUS.OK, { events: events.map((event) => serializeEvent(event, req.user.id)) });
});

export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.validated.params.eventId).populate('createdBy', 'name username role');
  if (!event) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  }
  if (String(event.createdBy._id || event.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to edit this event');
  }

  const { title, description, location, startsAt, endsAt } = req.validated.body;
  if (title !== undefined) {
    event.title = title;
  }
  if (description !== undefined) {
    event.description = description;
  }
  if (location !== undefined) {
    event.location = location;
  }
  if (startsAt !== undefined) {
    event.startsAt = new Date(startsAt);
  }
  if (endsAt !== undefined) {
    event.endsAt = new Date(endsAt);
  }
  if (req.files?.length) {
    event.photos = req.files.map((file) => ({
      filename: file.originalname,
      contentType: file.mimetype,
      sizeBytes: file.size,
      format: file.originalname.includes('.') ? file.originalname.split('.').at(-1).toLowerCase() : 'bin',
      data: file.buffer
    }));
  }
  if (event.endsAt <= event.startsAt) {
    throw new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Event end time must be after start time');
  }

  await event.save();
  await event.populate('createdBy', 'name username role');
  return sendSuccess(res, HTTP_STATUS.OK, { event: serializeEvent(event, req.user.id) });
});

export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.validated.params.eventId).populate('createdBy', 'name username role');
  if (!event) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  }
  if (String(event.createdBy._id || event.createdBy) !== String(req.user.id) && req.user.role !== 'admin') {
    throw new AppError(HTTP_STATUS.FORBIDDEN, 'You do not have permission to delete this event');
  }

  await Event.deleteOne({ _id: event.id });
  return sendSuccess(res, HTTP_STATUS.OK, { message: 'Event deleted successfully' });
});

export const updateEventRsvp = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.validated.params.eventId).populate('createdBy', 'name username role');
  if (!event) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  }

  event.rsvps = event.rsvps.filter((entry) => String(entry.user) !== String(req.user.id));
  if (req.validated.body.status !== 'none') {
    event.rsvps.push({ user: req.user.id, status: req.validated.body.status });
  }

  await event.save();
  await event.populate('createdBy', 'name username role');
  return sendSuccess(res, HTTP_STATUS.OK, { event: serializeEvent(event, req.user.id) });
});

export const getEventMedia = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.eventId).select('photos');
  if (!event) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Event not found');
  }

  const index = Number(req.params.photoIndex);
  const photo = event.photos[index];
  if (!photo) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'Event photo not found');
  }

  res.setHeader('Content-Type', photo.contentType);
  res.setHeader('Content-Length', photo.sizeBytes);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.send(photo.data);
});
