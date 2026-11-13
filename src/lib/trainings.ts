import { parseLink } from './links';

export type TrainingInput = { title: string; videoUrl: string; note: string };

export type TrainingValidation =
  | { ok: true; value: { title: string; video_url: string | null; note: string | null } }
  | { ok: false; error: 'title' | 'link' };

/** Checks a training form: a title is required, the video link and the note are optional, links must be http(s). */
export function validateTraining(input: TrainingInput): TrainingValidation {
  const title = input.title.trim();
  if (!title) return { ok: false, error: 'title' };
  const link = parseLink(input.videoUrl);
  if (!link.ok) return { ok: false, error: 'link' };
  return { ok: true, value: { title, video_url: link.url, note: input.note.trim() || null } };
}
