import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const THUMBNAILS_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');

// Ensure upload directories exist
async function ensureDirectories() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.mkdir(THUMBNAILS_DIR, { recursive: true });
}

export async function saveFile(file: File): Promise<{ filename: string; url: string }> {
  await ensureDirectories();

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || '.bin';
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filepath, buffer);

  return {
    filename,
    url: `/api/files/${filename}`
  };
}

export async function deleteFile(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename);
  
  try {
    await fs.unlink(filepath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Also try to delete thumbnail if exists
  const thumbnailPath = path.join(THUMBNAILS_DIR, filename);
  try {
    await fs.unlink(thumbnailPath);
  } catch (error) {
    // Thumbnail might not exist, ignore error
  }
}

export async function getFile(filename: string): Promise<Buffer> {
  const filepath = path.join(UPLOAD_DIR, filename);
  return await fs.readFile(filepath);
}

export async function fileExists(filename: string): Promise<boolean> {
  const filepath = path.join(UPLOAD_DIR, filename);
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

export async function generateThumbnail(filename: string, mimeType: string): Promise<string | null> {
  // For now, we'll just return the original URL for images
  // In production, you'd want to use sharp or similar to generate actual thumbnails
  if (mimeType.startsWith('image/')) {
    return `/api/files/${filename}`;
  }
  return null;
}