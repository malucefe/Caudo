import { BadRequestException } from '@nestjs/common';
import { mkdtempSync, readdirSync } from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import { FilesService, detectFileType } from './files.service';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const PDF = Buffer.from('%PDF-1.7\n...');

describe('FilesService (HU-14)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'caudo-up-'));
  const config = { get: (k: string, d?: string) => (k === 'UPLOAD_PATH' ? dir : d) };
  const service = new FilesService(config as any);
  const file = (buffer: Buffer, originalname: string) => ({ buffer, originalname }) as any;

  it('detecta tipos por magic bytes', () => {
    expect(detectFileType(PNG)).toBe('png');
    expect(detectFileType(JPG)).toBe('jpg');
    expect(detectFileType(PDF)).toBe('pdf');
    expect(detectFileType(Buffer.from('MZ\x90\x00exe'))).toBeNull();
  });

  it('guarda un PDF válido con extensión derivada del contenido', async () => {
    const r = await service.saveFile(file(PDF, 'factura.pdf'));
    expect(r.filename).toMatch(/\.pdf$/);
    expect(readdirSync(dir)).toContain(r.filename);
  });

  it('rechaza un ejecutable renombrado como .png', async () => {
    await expect(
      service.saveFile(file(Buffer.from('MZ\x90\x00 malicious'), 'foto.png')),
    ).rejects.toThrow(BadRequestException);
  });

  it('ignora la extensión declarada', async () => {
    const r = await service.saveFile(file(PNG, 'a.pdf'));
    expect(r.filename).toMatch(/\.png$/);
  });
});
