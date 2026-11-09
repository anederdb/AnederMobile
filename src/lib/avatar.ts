import type { PickedImage } from './cover';
import { supabase } from './supabase';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Photo chosen on the signup form, kept until the user has a session to upload it with (email confirmation comes first). */
let pending: PickedImage | null = null;
export const setPendingAvatar = (image: PickedImage | null) => {
  pending = image;
};
export const takePendingAvatar = (): PickedImage | null => {
  const image = pending;
  pending = null;
  return image;
};

/** Uploads to the caller's own folder in the public `avatars` bucket and saves the URL on their profile. */
export async function uploadAvatar(userId: string, image: PickedImage): Promise<void> {
  // Raw bytes, not a Blob: Blob uploads can silently store empty files on React Native.
  const bytes = await (await fetch(image.uri)).arrayBuffer();
  if (bytes.byteLength === 0) throw new Error('empty image');
  const path = `${userId}/${Date.now()}.${EXT[image.mimeType] ?? 'jpg'}`;
  const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: image.mimeType });
  if (error) throw error;
  const url = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  const { error: updateError } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (updateError) throw updateError;
}
