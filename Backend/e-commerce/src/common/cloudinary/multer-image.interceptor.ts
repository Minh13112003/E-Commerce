import { BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

export const ImageInterceptor = (fieldName: string = 'image') =>
  FileInterceptor(fieldName, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },

    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new BadRequestException('Only jpg, jpeg, png, webp files are allowed'), false);
      }

      cb(null, true);
    },
  });
