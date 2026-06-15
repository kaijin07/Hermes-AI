import express from 'express';
import multer from 'multer';
import { getBotConfig, updateBotConfig } from '../controllers/botConfigController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      const err = new Error('Only PDF files are allowed');
      err.statusCode = 400;
      cb(err);
    }
  },
});

router.route('/')
  .get(protect, getBotConfig)
  .post(protect, upload.single('file'), updateBotConfig);

export default router;
