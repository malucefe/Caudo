import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import * as path from 'path';

/** Tipos permitidos, detectados por los bytes iniciales (no por el nombre ni el MIME declarado). */
export function detectFileType(buf: Buffer): 'jpg' | 'png' | 'pdf' | null {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return 'png';
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return 'pdf';
  return null;
}

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
    // HU-14: se valida el contenido real y la extensión se deriva del tipo detectado.
    const detected = detectFileType(file.buffer);
    if (!detected) {
      throw new BadRequestException(
        'El contenido del archivo no corresponde a una imagen JPG/PNG ni a un PDF',
      );
    }
    const filename = `${crypto.randomUUID()}.${detected}`;
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
