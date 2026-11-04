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
