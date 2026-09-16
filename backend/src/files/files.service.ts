import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadPath: string;
  private readonly publicBaseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadPath = this.configService.get<string>('UPLOAD_PATH', './uploads');
    this.publicBaseUrl = (
      this.configService.get<string>('APP_URL') || ''
    ).replace(/\/+$/, '');
    this.ensureUploadDir();
  }

  async saveFile(file: Express.Multer.File): Promise<{ url: string; filename: string }> {
    const ext = path.extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadPath, filename);

    await writeFile(filePath, file.buffer);
    this.logger.log(`Archivo guardado: ${filename}`);

    const url = this.publicBaseUrl
      ? `${this.publicBaseUrl}/uploads/${filename}`
      : `/uploads/${filename}`;

    return {
      url,
      filename,
    };
  }

  private async ensureUploadDir(): Promise<void> {
    if (!existsSync(this.uploadPath)) {
      await mkdir(this.uploadPath, { recursive: true });
      this.logger.log(`Directorio de uploads creado: ${this.uploadPath}`);
    }
  }
}
