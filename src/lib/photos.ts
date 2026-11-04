import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from './cover';
import { supabase } from './supabase';

export async function pickImages(limit: number): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.7,
  });
  if (result.canceled) return [];
  return result.assets.map((a) => ({ uri: a.uri, mimeType: a.mimeType ?? 'image/jpeg' }));
}

export async function removeListingPhotos(paths: string[]): Promise<void> {
  if (paths.length) await supabase.storage.from('listing-photos').remove(paths);
}

const BUCKET = 'listing-photos'; // private: members only, via signed URLs
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Uploads under <owner id>/ (required by the storage policy) and returns the storage path. */
export async function uploadListingPhoto(ownerId: string, image: PickedImage): Promise<string> {
  const blob = await (await fetch(image.uri)).blob();
  const path = `${ownerId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${EXT[image.mimeType] ?? 'jpg'}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: image.mimeType });
  if (error) throw error;
  return path;
}

/** path -> signed URL (1 hour). Paths that cannot be signed are left out. */
export async function signedUrls(paths: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths)];
  if (unique.length === 0) return {};
  const { data } = await supabase.storage.from(BUCKET).createSignedUrls(unique, 3600);
  const map: Record<string, string> = {};
  for (const item of data ?? []) if (item.path && item.signedUrl) map[item.path] = item.signedUrl;
  return map;
}
