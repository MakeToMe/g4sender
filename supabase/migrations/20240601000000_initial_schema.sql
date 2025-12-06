-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- SaaS: Empresas (Tenants)
create table camp_empresas (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  plan text default 'free', -- free, pro, enterprise
  created_at timestamp with time zone default now()
);

-- SaaS: Profiles (Public User Data)
create table camp_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  empresa_id uuid references camp_empresas(id),
  name text,
  role text default 'member', -- owner, admin, member
  created_at timestamp with time zone default now()
);

-- Instances (Waha Sessions)
create table camp_instances (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references camp_empresas(id) not null,
  name text not null, -- Maps to Waha 'session'
  status text default 'STOPPED', -- STOPPED, STARTING, SCAN_QR_CODE, WORKING, FAILED
  qr_code text, -- Base64 QR code
  phone_number text,
  url_profile text, -- Profile picture URL
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(empresa_id, name)
);

-- Contacts
create table camp_contacts (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references camp_empresas(id) not null,
  name text,
  phone text not null,
  tags text[], -- Array of tags for segmentation
  created_at timestamp with time zone default now()
);

-- Campaigns
create table camp_campaigns (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references camp_empresas(id) not null,
  name text not null,
  message_type text default 'text', -- text, image, video
  message_template text not null,
  status text default 'draft', -- draft, scheduled, running, completed, paused
  scheduled_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- Campaign Logs (Metrics)
create table camp_campaign_logs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references camp_campaigns(id) not null,
  contact_id uuid references camp_contacts(id) not null,
  status text default 'pending', -- pending, sent, delivered, read, failed
  message_id text, -- Waha message ID
  error_message text,
  sent_at timestamp with time zone,
  delivered_at timestamp with time zone,
  read_at timestamp with time zone,
  answered_at timestamp with time zone,
  answered_message text,
  created_at timestamp with time zone default now()
);

-- Conversations (Chat History)
create table camp_conversas (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references camp_empresas(id) not null,
  instance_id uuid references camp_instances(id),
  contact_id uuid references camp_contacts(id), -- Optional link to contact
  remote_jid text not null, -- The WhatsApp ID (phone@s.whatsapp.net)
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(empresa_id, remote_jid)
);

-- Messages (Chat Details)
create table camp_mensagens (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references camp_empresas(id) not null,
  conversa_id uuid references camp_conversas(id) not null,
  body text,
  media_url text,
  media_type text default 'text', -- text, image, video, audio, document
  direction text not null, -- inbound, outbound
  status text default 'pending', -- pending, sent, delivered, read, failed
  waha_message_id text,
  created_at timestamp with time zone default now()
);

-- RLS Policies (Row Level Security)
alter table camp_empresas enable row level security;
alter table camp_profiles enable row level security;
alter table camp_instances enable row level security;
alter table camp_contacts enable row level security;
alter table camp_campaigns enable row level security;
alter table camp_campaign_logs enable row level security;
alter table camp_conversas enable row level security;
alter table camp_mensagens enable row level security;

-- Helper function to get current user's empresa_id
create or replace function get_current_empresa_id()
returns uuid as $$
  select empresa_id from camp_profiles where id = auth.uid();
$$ language sql security definer;

-- Policies for Empresas
create policy "Users can view their own empresa"
  on camp_empresas for select
  using (id = get_current_empresa_id());

-- Policies for Profiles
create policy "Users can view profiles in their empresa"
  on camp_profiles for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can update their own profile"
  on camp_profiles for update
  using (id = auth.uid());

-- Policies for Instances
create policy "Users can view instances in their empresa"
  on camp_instances for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can insert instances in their empresa"
  on camp_instances for insert
  with check (empresa_id = get_current_empresa_id());

create policy "Users can update instances in their empresa"
  on camp_instances for update
  using (empresa_id = get_current_empresa_id());

-- Policies for Contacts
create policy "Users can view contacts in their empresa"
  on camp_contacts for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can insert contacts in their empresa"
  on camp_contacts for insert
  with check (empresa_id = get_current_empresa_id());

create policy "Users can update contacts in their empresa"
  on camp_contacts for update
  using (empresa_id = get_current_empresa_id());

-- Policies for Campaigns
create policy "Users can view campaigns in their empresa"
  on camp_campaigns for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can insert campaigns in their empresa"
  on camp_campaigns for insert
  with check (empresa_id = get_current_empresa_id());

create policy "Users can update campaigns in their empresa"
  on camp_campaigns for update
  using (empresa_id = get_current_empresa_id());

-- Policies for Campaign Logs
create policy "Users can view campaign logs in their empresa"
  on camp_campaign_logs for select
  using (exists (
    select 1 from camp_campaigns
    where camp_campaigns.id = camp_campaign_logs.campaign_id
    and camp_campaigns.empresa_id = get_current_empresa_id()
  ));

-- Policies for Conversations
create policy "Users can view conversations in their empresa"
  on camp_conversas for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can insert conversations in their empresa"
  on camp_conversas for insert
  with check (empresa_id = get_current_empresa_id());

create policy "Users can update conversations in their empresa"
  on camp_conversas for update
  using (empresa_id = get_current_empresa_id());

-- Policies for Messages
create policy "Users can view messages in their empresa"
  on camp_mensagens for select
  using (empresa_id = get_current_empresa_id());

create policy "Users can insert messages in their empresa"
  on camp_mensagens for insert
  with check (empresa_id = get_current_empresa_id());

create policy "Users can update messages in their empresa"
  on camp_mensagens for update
  using (empresa_id = get_current_empresa_id());

-- Trigger to create profile and empresa on signup (Optional but recommended)
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_empresa_id uuid;
begin
  -- Create a new empresa for the user
  insert into public.camp_empresas (name)
  values (coalesce(new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'name' || '''s Company'))
  returning id into new_empresa_id;

  -- Create a profile linked to the user and the new empresa
  insert into public.camp_profiles (id, empresa_id, name, role)
  values (new.id, new_empresa_id, new.raw_user_meta_data->>'name', 'owner');

  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
