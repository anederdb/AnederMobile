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
