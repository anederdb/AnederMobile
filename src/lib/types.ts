export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'member' | 'admin';
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
  price: number | null;
  rooms: string | null;
  area_m2: number | null;
  description: string | null;
  photos: string[];
  created_at: string;
};
