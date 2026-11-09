export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin' | 'scanner';
  title: string | null;
  terms_accepted_at: string | null;
  email_consent: boolean;
  status: 'pending' | 'approved';
  created_at: string;
};

export type Firm = {
  id: string;
  owner_id: string;
  name: string;
  district: string | null;
  sahibinden_url: string | null;
  created_at: string;
};

export type AppEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  cover_url: string | null;
  created_at: string;
};

export type EventPhoto = {
  id: string;
  event_id: string;
  url: string;
  position: number;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  cover_url: string | null;
  created_at: string;
};

export type Listing = {
  id: string;
  owner_id: string;
  firm_id: string | null;
  title: string;
  type: 'satilik' | 'kiralik';
  district: string | null;
  neighborhood: string | null;
  min_price: number | null;
  max_price: number | null;
  link: string | null;
  rooms: string[];
  area_m2: number | null;
  description: string | null;
  created_at: string;
};

export type Offer = {
  id: string;
  sponsor: string;
  title: string;
  description: string | null;
  link: string | null;
  valid_until: string | null;
  created_at: string;
};
