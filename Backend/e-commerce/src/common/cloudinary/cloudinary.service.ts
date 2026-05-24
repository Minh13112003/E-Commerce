import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { Express } from 'express';

import { v2 as cloudinary } from 'cloudinary';

import streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'uploads',
  ): Promise<{
    imageURL: string;
    imagePublicId: string;
  }> {
    if (!file) {
      throw new BadRequestException(
        'Image file is required',
      );
    }

    return new Promise((resolve, reject) => {
      const stream =
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
          },

          (error, result) => {
            if (error || !result) {
              return reject(
                error ||
                  new Error('Upload failed'),
              );
            }

            resolve({
              imageURL: result.secure_url,
              imagePublicId: result.public_id,
            });
          },
        );

      streamifier
        .createReadStream(file.buffer)
        .pipe(stream);
    });
  }

  async deleteImage(
    publicId: string,
  ): Promise<void> {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
  }
}