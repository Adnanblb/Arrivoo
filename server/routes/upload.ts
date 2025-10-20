import { Express } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile } from '../storage-client';
import { requireAuth } from '../middleware';
import crypto from 'crypto';
import path from 'path';

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function registerUploadRoutes(app: Express) {
  /**
   * POST /api/upload/hotel-logo
   * Upload a hotel logo to Supabase Storage
   */
  app.post('/api/upload/hotel-logo', requireAuth, upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const { hotelId } = req.body;
      if (!hotelId) {
        return res.status(400).json({ error: 'Hotel ID is required' });
      }

      // Generate unique filename
      const fileExt = path.extname(req.file.originalname);
      const fileName = `${hotelId}-${crypto.randomUUID()}${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload to Supabase Storage
      const publicUrl = await uploadFile(
        'hotel-logos',
        filePath,
        req.file.buffer,
        req.file.mimetype
      );

      res.json({
        success: true,
        url: publicUrl,
        fileName,
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ error: 'Failed to upload logo' });
    }
  });

  /**
   * DELETE /api/upload/hotel-logo
   * Delete a hotel logo from Supabase Storage
   */
  app.delete('/api/upload/hotel-logo', requireAuth, async (req, res) => {
    try {
      const { fileName } = req.body;
      if (!fileName) {
        return res.status(400).json({ error: 'File name is required' });
      }

      const filePath = `logos/${fileName}`;
      await deleteFile('hotel-logos', filePath);

      res.json({ success: true });
    } catch (error) {
      console.error('Logo deletion error:', error);
      res.status(500).json({ error: 'Failed to delete logo' });
    }
  });
}
