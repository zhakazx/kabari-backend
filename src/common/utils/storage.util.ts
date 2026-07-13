import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException } from '@nestjs/common';

export const storageConfig = (dest: string) =>
  diskStorage({
    destination: dest,
    filename: (_req, file, callback) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${extname(file.originalname)}`;
      callback(null, uniqueName);
    },
  });

export const imageFileFilter = (_req: any, file: any, callback: any) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false,
    );
  }
  callback(null, true);
};

export const templateFileFilter = (_req: any, file: any, callback: any) => {
  const allowedMimes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'text/html',
    'text/css',
    'application/javascript',
  ];
  if (!allowedMimes.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Invalid template file type!'),
      false,
    );
  }
  callback(null, true);
};
