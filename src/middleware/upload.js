import multer from 'multer';
import { HTTP_STATUS } from '../constants/http.js';
import { AppError } from '../utils/appError.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 10
  }
});

export const postMediaUpload = [
  upload.array('media', 10),
  (req, res, next) => {
    if (!req.files?.length) {
      return next(new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'At least one media file is required'));
    }

    next();
  }
];

export const avatarUpload = [
  upload.single('avatar'),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Avatar file is required'));
    }

    next();
  }
];

export const storyUpload = [
  upload.single('storyMedia'),
  (req, res, next) => {
    if (!req.file) {
      return next(new AppError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Story media file is required'));
    }

    next();
  }
];
