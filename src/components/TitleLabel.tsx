import { Badge } from '@/components/ui';

/** Small pill shown under a member's name; renders nothing without a title. */
export function TitleLabel({ title }: { title: string | null | undefined }) {
  return title ? <Badge label={title} /> : null;
}
