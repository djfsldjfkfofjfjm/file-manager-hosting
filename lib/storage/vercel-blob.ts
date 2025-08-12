import { put, del, list } from '@vercel/blob';

export async function uploadToBlob(file: File): Promise<{ url: string; filename: string }> {
  const blob = await put(file.name, file, {
    access: 'public',
  });

  return {
    url: blob.url,
    filename: blob.pathname,
  };
}

export async function deleteFromBlob(url: string): Promise<void> {
  await del(url);
}

export async function listBlobs() {
  const { blobs } = await list();
  return blobs;
}