import type { IconName } from '@/components/ui';
import { t } from '@/i18n/tr';

export type PageKey = 'baskan-mesaji' | 'hakkimizda' | 'vizyon' | 'misyon';

/** The four editable Kurumsal pages: label, icon and the template text shown until an admin saves real text. */
export const SITE_PAGES: { key: PageKey; title: string; icon: IconName; template: string }[] = [
  { key: 'baskan-mesaji', title: t.about.president.title, icon: 'chatbubble-ellipses-outline', template: t.about.president.body },
  { key: 'hakkimizda', title: t.about.association.title, icon: 'information-circle-outline', template: t.about.association.body },
  { key: 'vizyon', title: t.about.vision.title, icon: 'eye-outline', template: t.about.vision.body },
  { key: 'misyon', title: t.about.mission.title, icon: 'flag-outline', template: t.about.mission.body },
];

export const findSitePage = (key: string) => SITE_PAGES.find((p) => p.key === key);
