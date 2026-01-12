-- LexPrime Supabase Schema (Shared Office Version)

-- 1. CLIENTS (Contatos)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    document TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    type TEXT NOT NULL DEFAULT 'Pessoa Física',
    group_name TEXT,
    
    -- Qualification & Address
    nationality TEXT,
    marital_status TEXT,
    profession TEXT,
    rg TEXT,
    birth_date DATE,
    gender TEXT,
    representative TEXT,
    representative_gender TEXT,
    representative_id TEXT,
    representative_qualification TEXT,
    representative_address TEXT,
    
    -- Address
    street TEXT,
    address_number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT DEFAULT 'Brasil',
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CASES (Processos)
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    
    -- Party associations
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_position TEXT NOT NULL DEFAULT 'Ativo', -- Ativo/Passivo
    opposing_party TEXT NOT NULL,
    
    -- Case Details
    court TEXT NOT NULL,
    uf VARCHAR(2) NOT NULL,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    folder_number TEXT,
    
    -- Relationship (Desdobramento)
    parent_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    related_type TEXT,
    
    -- Financial
    value NUMERIC(15, 2),
    value_date DATE,
    
    status TEXT NOT NULL DEFAULT 'Ativo',
    last_update TIMESTAMPTZ DEFAULT now(),
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    
    -- History & Occurrences stored as JSONB to start simple, or separate tables
    occurrences JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. DEADLINES (Prazos)
CREATE TABLE deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    case_title TEXT,
    customer_name TEXT,
    
    title TEXT NOT NULL,
    due_date DATE NOT NULL,
    start_date DATE,
    start_time TIME DEFAULT '09:00',
    days INTEGER,
    count_type TEXT DEFAULT 'business', -- business/calendar
    status TEXT DEFAULT 'Pending', -- Pending, Done, Canceled
    is_done BOOLEAN DEFAULT false,
    priority TEXT DEFAULT 'Medium', -- High, Medium, Low
    type TEXT DEFAULT 'Prazo Processual', -- Prazo Processual, Administrativo, Audiência
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TEAM MEMBERS (Equipe)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL, -- Sócio, Advogado, etc.
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    photo_url TEXT, -- Store URL from Storage
    active BOOLEAN DEFAULT true,
    join_date DATE DEFAULT CURRENT_DATE,
    
    -- Qualification
    oab TEXT,
    cpf TEXT,
    nationality TEXT,
    gender TEXT,
    marital_status TEXT,
    
    -- Professional Address
    address_street TEXT,
    address_number TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. APPOINTMENTS (Agenda)
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    appointment_date TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL, -- Audiência, Reunião, Diligência
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    description TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. HOLIDAYS (Feriados)
CREATE TABLE holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    holiday_date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger to auto-update updated_at channel
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_deadlines_updated_at BEFORE UPDATE ON deadlines FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS (Initially simple: anyone authenticated in the project sees everything)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- Shared Policy: All authenticated users (your office team) can read/write
CREATE POLICY "Allow all authenticated users full access" ON clients FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access" ON cases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access" ON deadlines FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access" ON team_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access" ON appointments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users full access" ON holidays FOR ALL USING (auth.role() = 'authenticated');
