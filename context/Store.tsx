
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Case, Client, Deadline, CaseStatus, User, Appointment, Holiday, TeamMember } from '../types';
import { DEFAULT_HOLIDAYS } from '../utils/dateUtils';
import { supabase } from '../utils/supabaseClient';

interface StoreContextType {
  cases: Case[];
  setCases: React.Dispatch<React.SetStateAction<Case[]>>;
  addCase: (c: Case) => void;
  updateCase: (c: Case) => void;
  deleteCase: (id: string) => void;
  importCases: (newCases: Case[]) => void;
  clearCases: () => void;

  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  importClients: (newClients: Client[]) => void;
  clearClients: () => void;

  teamMembers: TeamMember[];
  setTeamMembers: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  addTeamMember: (t: TeamMember) => void;
  updateTeamMember: (t: TeamMember) => void;
  deleteTeamMember: (id: string) => void;
  importTeamMembers: (newMembers: TeamMember[]) => void;
  clearTeamMembers: () => void;

  deadlines: Deadline[];
  setDeadlines: React.Dispatch<React.SetStateAction<Deadline[]>>;
  addDeadline: (d: Deadline) => void;
  updateDeadline: (d: Deadline) => void;
  toggleDeadline: (id: string) => void;
  updateDeadlineStatus: (id: string, status: 'Pending' | 'Done' | 'Canceled') => void;
  deleteDeadline: (id: string) => void;
  importDeadlines: (newDeadlines: Deadline[]) => void;
  clearDeadlines: () => void;

  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;

  holidays: Holiday[]; // New
  setHolidays: React.Dispatch<React.SetStateAction<Holiday[]>>;
  importHolidays: (newHolidays: Holiday[]) => void; // New
  resetHolidays: () => void; // New

  currentUser: User | null;
  login: (email: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;

  isDarkMode: boolean;
  toggleTheme: () => void;

  notifications: { id: string, msg: string, type: 'info' | 'warning' | 'success' }[];
  addNotification: (msg: string, type?: 'info' | 'warning' | 'success') => void;
  clearNotification: (id: string) => void;

  isLoading: boolean;
  setIsLoading: (val: boolean) => void;

  exportData: () => void;
  syncData: () => Promise<void>;

  pendingAction: string | null;
  setPendingAction: (action: string | null) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// Initial Data
const INITIAL_CASES: Case[] = [
  {
    id: '1',
    number: '0001234-88.2024.8.19.0045',
    title: 'Silva vs Construtora Viver',
    clientName: 'João da Silva',
    clientId: '1',
    clientPosition: 'Ativo',
    opposingParty: 'Construtora Viver Bem S.A.',
    court: '2ª Vara Cível',
    uf: 'RJ',
    city: 'Resende',
    area: 'Civil',
    folderNumber: 'CIV-2024-001',
    status: CaseStatus.Active,
    value: 150000,
    valueDate: '2024-01-10',
    lastUpdate: '2024-12-01',
    tags: ['Imobiliário', 'Danos Morais'],
    history: []
  },
  {
    id: '2',
    number: '0055111-22.2023.8.26.0100',
    title: 'Tech Solutions vs Fazenda Pública',
    clientName: 'Tech Solutions Ltda',
    clientId: '3',
    clientPosition: 'Ativo',
    opposingParty: 'Fazenda Pública do Estado de SP',
    court: '10ª Vara de Fazenda Pública',
    uf: 'SP',
    city: 'São Paulo',
    area: 'Tributário',
    status: CaseStatus.Archived,
    value: 450000,
    lastUpdate: '2024-11-15',
    tags: ['Tributário', 'ICMS'],
    history: []
  },
  {
    id: '3',
    number: '0009988-77.2024.8.19.0001',
    title: 'Inventário de Roberto Gomes',
    clientName: 'Espólio de Roberto Gomes',
    clientId: '4',
    clientPosition: 'Ativo',
    opposingParty: '-',
    court: '1ª Vara de Órfãos e Sucessões',
    uf: 'RJ',
    city: 'Rio de Janeiro',
    area: 'Família',
    folderNumber: 'INV-003',
    status: CaseStatus.Active,
    value: 1200000,
    lastUpdate: '2024-10-20',
    tags: ['Inventário', 'Bens'],
    history: []
  },
  {
    id: '4',
    number: '5001122-33.2025.4.02.5101',
    title: 'Maria Luiza vs INSS',
    clientName: 'Maria Luiza Santos',
    clientId: '2',
    clientPosition: 'Ativo',
    opposingParty: 'Instituto Nacional do Seguro Social',
    court: '5ª Vara Federal',
    uf: 'RJ',
    city: 'Resende',
    area: 'Previdenciário',
    status: CaseStatus.Active,
    lastUpdate: '2024-12-15',
    tags: ['Aposentadoria'],
    history: []
  },
];

// Helper to get today string
const getToday = () => new Date().toISOString().split('T')[0];
const getFutureDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const INITIAL_DEADLINES: Deadline[] = [
  // HOJE (3 Prazos)
  { id: '1', title: 'Embargos de Declaração', caseTitle: 'Silva vs Banco X', dueDate: getToday(), startTime: '14:00', isDone: false, status: 'Pending', priority: 'High', type: 'Prazo Processual', caseId: '1' },
  { id: '2', title: 'Audiência de Instrução', caseTitle: 'Santos vs Tech Corp', dueDate: getToday(), startTime: '15:30', isDone: false, status: 'Pending', priority: 'High', type: 'Audiência', caseId: '2' },
  { id: '3', title: 'Pagamento de Custas', caseTitle: 'Construtora Sol vs União', dueDate: getToday(), startTime: '17:00', isDone: false, status: 'Pending', priority: 'Medium', type: 'Administrativo', caseId: '3' },

  // FUTUROS
  { id: '4', title: 'Contestação', caseTitle: 'Indústria Beta vs Estado', dueDate: getFutureDate(1), startTime: '09:00', isDone: false, status: 'Pending', priority: 'High', type: 'Prazo Processual', caseId: '4' },
  { id: '5', title: 'Réplica', caseTitle: 'Silva vs Banco X', dueDate: getFutureDate(3), startTime: '18:00', isDone: false, status: 'Pending', priority: 'Medium', type: 'Prazo Processual', caseId: '1' },
  { id: '6', title: 'Reunião com Cliente', caseTitle: 'Santos vs Tech Corp', dueDate: getFutureDate(5), startTime: '10:00', isDone: false, status: 'Pending', priority: 'Low', type: 'Administrativo', caseId: '2' },

  // PASSADOS / CONCLUÍDOS
  { id: '7', title: 'Protocolar Recurso', caseTitle: 'Santos vs Tech Corp', dueDate: '2024-05-25', isDone: true, status: 'Done', priority: 'High', type: 'Prazo Processual', caseId: '2' },
  { id: '8', title: 'Cálculo de Liquidação', caseTitle: 'Construtora Sol vs União', dueDate: '2024-05-20', isDone: false, status: 'Canceled', priority: 'Medium', type: 'Prazo Processual', caseId: '3' },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'João da Silva',
    email: 'joao.silva@email.com',
    phone: '(24) 99999-1234',
    document: '123.456.789-00',
    type: 'Pessoa Física',
    createdAt: '2024-01-15',
    notes: 'Cliente antigo. Contato preferencial por WhatsApp.',
    nationality: 'Brasileiro',
    maritalStatus: 'Casado',
    profession: 'Engenheiro Civil',
    rg: '12.345.678-9',
    birthDate: '1980-05-15',
    gender: 'Masculino',
    street: 'Rua das Magnólias',
    addressNumber: '123',
    neighborhood: 'Cidade Alegria',
    city: 'Resende',
    state: 'RJ',
    zip: '27525-000',
    country: 'Brasil'
  },
  {
    id: '2',
    name: 'Maria Luiza Santos',
    email: 'maria.luiza@email.com',
    phone: '(24) 98888-5678',
    document: '321.654.987-11',
    type: 'Pessoa Física',
    createdAt: '2024-02-20',
    nationality: 'Brasileira',
    maritalStatus: 'Casada',
    profession: 'Médica',
    gender: 'Feminino',
    rg: '20.555.444-X',
    birthDate: '1982-10-10',
    street: 'Av. Nova Resende',
    addressNumber: '400',
    complement: 'Apto 22 - Bloco B',
    neighborhood: 'Centro',
    city: 'Resende',
    state: 'RJ',
    zip: '27511-200',
    country: 'Brasil'
  },
  {
    id: '3',
    name: 'Tech Solutions Ltda',
    email: 'financeiro@techsolutions.com',
    phone: '(11) 3333-3333',
    document: '12.345.678/0001-90',
    type: 'Pessoa Jurídica',
    createdAt: '2023-11-10',
    representative: 'Carlos Eduardo Souza',
    representativeQualification: 'Brasileiro, casado, empresário, portador do RG 111.222.333-4 e CPF 000.111.222-33, residente e domiciliado na Rua X, SP',
    representativeGender: 'Masculino',
    street: 'Av. Paulista',
    addressNumber: '1000',
    complement: 'Conj 501',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zip: '01310-100',
    country: 'Brasil'
  },
  {
    id: '4',
    name: 'Espólio de Roberto Gomes',
    email: 'ana.gomes@email.com',
    phone: '(21) 97777-1212',
    document: '987.654.321-00',
    type: 'Espólio',
    createdAt: '2024-03-05',
    representative: 'Ana Gomes (Inventariante)',
    representativeQualification: 'Brasileira, viúva, aposentada, portadora do RG 55.666.777-8 e CPF 999.888.777-66, residente à Rua Copacabana, 55, Rio de Janeiro',
    representativeGender: 'Feminino',
    street: 'Rua das Palmeiras',
    addressNumber: '50',
    neighborhood: 'Leblon',
    city: 'Rio de Janeiro',
    state: 'RJ',
    zip: '22440-000',
    country: 'Brasil'
  },
  {
    id: '5',
    name: 'Pedro Henrique (Menor)',
    email: 'mae.responsavel@email.com',
    phone: '(24) 99988-7766',
    document: '555.444.333-22',
    type: 'Pessoa Física',
    createdAt: '2024-06-01',
    gender: 'Masculino',
    birthDate: '2015-05-20',
    notes: 'Menor impúbere. Representado pela mãe.',
    representative: 'Juliana Oliveira',
    representativeQualification: 'Brasileira, solteira, professora, portadora do RG 33.333.333-3 e CPF 333.333.333-33',
    street: 'Rua da Escola',
    addressNumber: '10',
    neighborhood: 'Jardim Brasília',
    city: 'Resende',
    state: 'RJ',
    zip: '27500-000'
  }
];

const INITIAL_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Dr. Admin',
    role: 'Sócio Fundador',
    email: 'admin@lexprime.com',
    phone: '(11) 99999-0000',
    active: true,
    joinDate: '2020-01-01',
    oab: '123.456/SP',
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    addressCity: 'São Paulo', addressState: 'SP'
  },
  {
    id: '2',
    name: 'Ana Pereira',
    role: 'Advogada Júnior',
    email: 'ana@lexprime.com',
    phone: '(11) 98888-1111',
    active: true,
    joinDate: '2023-05-10',
    oab: '222.333/SP',
    photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    addressCity: 'Campinas', addressState: 'SP'
  },
  {
    id: '3',
    name: 'Carlos Souza',
    role: 'Financeiro',
    email: 'financeiro@lexprime.com',
    phone: '(11) 97777-2222',
    active: true,
    joinDate: '2022-03-15',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    addressCity: 'São Paulo', addressState: 'SP'
  },
  {
    id: '4',
    name: 'Beatriz Lima',
    role: 'Secretária',
    email: 'contato@lexprime.com',
    phone: '(11) 3333-4444',
    active: true,
    joinDate: '2021-08-01',
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
    addressCity: 'Guarulhos', addressState: 'SP'
  },
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State with lazy initialization for persistence
  const [cases, setCases] = useState<Case[]>(() => {
    const saved = localStorage.getItem('lexprime_cases');
    return saved ? JSON.parse(saved) : INITIAL_CASES;
  });

  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('lexprime_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('lexprime_team');
    return saved ? JSON.parse(saved) : INITIAL_TEAM;
  });

  const [deadlines, setDeadlines] = useState<Deadline[]>(() => {
    const saved = localStorage.getItem('lexprime_deadlines');
    return saved ? JSON.parse(saved) : INITIAL_DEADLINES;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('lexprime_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const saved = localStorage.getItem('lexprime_holidays');
    return saved ? JSON.parse(saved) : DEFAULT_HOLIDAYS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('lexprime_theme') === 'dark');
  const [notifications, setNotifications] = useState<{ id: string, msg: string, type: 'info' | 'warning' | 'success' }[]>([]);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('lexprime_cases', JSON.stringify(cases));
  }, [cases]);

  useEffect(() => {
    localStorage.setItem('lexprime_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('lexprime_team', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('lexprime_deadlines', JSON.stringify(deadlines));
  }, [deadlines]);

  useEffect(() => {
    localStorage.setItem('lexprime_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('lexprime_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setIsLoading(true);
      try {
        const [
          { data: cData },
          { data: clData },
          { data: tData },
          { data: dData },
          { data: aData },
          { data: hData }
        ] = await Promise.all([
          supabase.from('cases').select('*'),
          supabase.from('clients').select('*'),
          supabase.from('team_members').select('*'),
          supabase.from('deadlines').select('*'),
          supabase.from('appointments').select('*'),
          supabase.from('holidays').select('*')
        ]);

        // Merge Strategy: Only overwrite local if cloud has data, or if local is empty
        if (cData && (cData.length > 0 || cases.length === 0)) {
          setCases(cData.map((c: any) => ({
            ...c,
            clientId: c.client_id,
            clientName: c.client_name,
            clientPosition: c.client_position,
            opposingParty: c.opposing_party,
            folderNumber: c.folder_number,
            parentId: c.parent_id,
            relatedType: c.related_type,
            valueDate: c.value_date,
            lastUpdate: c.last_update,
            tribunal: c.tribunal,
            subject: c.subject,
            probability: c.probability,
          })));
        }

        if (clData && (clData.length > 0 || clients.length === 0)) {
          setClients(clData.map((c: any) => ({
            ...c,
            group: c.group_name,
            representativeGender: c.representative_gender,
            representativeId: c.representative_id,
            representativeQualification: c.representative_qualification,
            representativeAddress: c.representative_address,
            addressNumber: c.address_number,
            birthDate: c.birth_date,
          })));
        }

        if (tData && (tData.length > 0 || teamMembers.length === 0)) {
          setTeamMembers(tData.map((t: any) => ({
            ...t,
            photo: t.photo_url,
            joinDate: t.join_date,
            addressStreet: t.address_street,
            addressNumber: t.address_number,
            addressComplement: t.address_complement,
            addressNeighborhood: t.address_neighborhood,
            addressCity: t.address_city,
            addressState: t.address_state,
            addressZip: t.address_zip,
          })));
        }

        if (dData && (dData.length > 0 || deadlines.length === 0)) {
          setDeadlines(dData.map((d: any) => ({
            ...d,
            caseId: d.case_id,
            caseTitle: d.case_title,
            customerName: d.customer_name,
            dueDate: d.due_date,
            startDate: d.start_date,
            startTime: d.start_time,
            countType: d.count_type,
            isDone: d.is_done,
            court: d.court,
            city: d.city,
            uf: d.uf,
          })));
        }

        if (aData && (aData.length > 0 || appointments.length === 0)) {
          setAppointments(aData.map((a: any) => ({
            ...a,
            date: a.appointment_date,
            caseId: a.case_id,
          })));
        }

        if (hData && (hData.length > 0 || holidays.length === 0)) {
          setHolidays(hData.map((h: any) => ({
            id: h.id,
            date: h.holiday_date,
            name: h.name
          })));
        }

      } catch (error) {
        console.error('Error fetching data from Supabase:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  // Sync to local storage as backup
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lexprime_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lexprime_theme', 'light');
    }
  }, [isDarkMode]);

  // Auth Listener
  useEffect(() => {
    // Check current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário',
          email: session.user.email || '',
          role: 'Admin'
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || 'Usuário',
          email: session.user.email || '',
          role: 'Admin'
        });
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Actions
  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });

      if (error) throw error;

      if (data.user) {
        addNotification(`Bem-vindo de volta!`, 'success');
      }
    } catch (err: any) {
      addNotification(`Erro no login: ${err.message}`, 'warning');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        addNotification('Conta criada! Verifique seu e-mail para confirmar.', 'success');
      }
    } catch (err: any) {
      addNotification(`Erro ao criar conta: ${err.message}`, 'warning');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUser(null);
      addNotification('Sessão encerrada.', 'info');
    } catch (err: any) {
      addNotification(`Erro ao sair: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const isUUID = (id: string) => {
    if (!id) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const ensureUUID = (id?: string) => {
    if (id && isUUID(id)) return id;
    return crypto.randomUUID();
  };

  const toUUID = (id?: string) => {
    if (id && isUUID(id)) return id;
    return null;
  };

  const addCase = async (newCase: Case) => {
    setIsLoading(true);

    // Try to resolve client ID if missing
    let resolvedClientId = newCase.clientId;
    if (!resolvedClientId || !isUUID(resolvedClientId)) {
      const client = clients.find(c => c.name === newCase.clientName);
      if (client) resolvedClientId = client.id;
    }

    const updatedCase = {
      ...newCase,
      id: ensureUUID(newCase.id),
      clientId: resolvedClientId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('cases').insert({
        id: updatedCase.id,
        number: updatedCase.number,
        title: updatedCase.title,
        client_id: toUUID(updatedCase.clientId),
        client_name: updatedCase.clientName,
        client_position: updatedCase.clientPosition,
        opposing_party: updatedCase.opposingParty,
        court: updatedCase.court,
        uf: updatedCase.uf,
        city: updatedCase.city,
        area: updatedCase.area,
        folder_number: updatedCase.folderNumber || null,
        parent_id: toUUID(updatedCase.parentId),
        related_type: updatedCase.relatedType || null,
        value: updatedCase.value,
        value_date: updatedCase.valueDate || null,
        status: updatedCase.status,
        last_update: updatedCase.lastUpdate,
        tags: updatedCase.tags,
        tribunal: updatedCase.tribunal || null,
        subject: updatedCase.subject || null,
        probability: updatedCase.probability || null,
        description: updatedCase.description,
        occurrences: updatedCase.occurrences,
        history: updatedCase.history,
        created_at: updatedCase.createdAt,
        updated_at: updatedCase.updatedAt
      });
      if (error) throw error;
      setCases(prev => [updatedCase, ...prev]);
      addNotification('Processo criado com sucesso!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao criar processo: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const updateCase = async (updatedCase: Case) => {
    setIsLoading(true);

    // Try to resolve client ID if missing
    let resolvedClientId = updatedCase.clientId;
    if (!resolvedClientId || !isUUID(resolvedClientId)) {
      const client = clients.find(c => c.name === updatedCase.clientName);
      if (client) resolvedClientId = client.id;
    }

    const updated = {
      ...updatedCase,
      clientId: resolvedClientId,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('cases').update({
        number: updated.number,
        title: updated.title,
        client_id: toUUID(updated.clientId),
        client_name: updated.clientName,
        client_position: updated.clientPosition,
        opposing_party: updated.opposingParty,
        court: updated.court,
        uf: updated.uf,
        city: updated.city,
        area: updated.area,
        folder_number: updated.folderNumber || null,
        parent_id: toUUID(updated.parentId),
        related_type: updated.relatedType || null,
        value: updated.value,
        value_date: updated.valueDate || null,
        status: updated.status,
        last_update: updated.lastUpdate,
        tags: updated.tags,
        tribunal: updated.tribunal || null,
        subject: updated.subject || null,
        probability: updated.probability || null,
        description: updated.description,
        occurrences: updated.occurrences,
        history: updated.history,
        updated_at: updated.updatedAt
      }).eq('id', updated.id);

      if (error) throw error;
      setCases(prev => prev.map(c => c.id === updated.id ? updated : c));
      addNotification('Processo atualizado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao atualizar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCase = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('cases').delete().eq('id', id);
      if (error) throw error;
      setCases(prev => prev.filter(c => c.id !== id));
      addNotification('Processo removido.', 'warning');
    } catch (err: any) {
      addNotification(`Erro ao remover: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const importCases = (newCases: Case[]) => {
    setCases(prev => {
      const existingNumbers = new Set(prev.map(c => c.number.replace(/\D/g, '')));
      const toAdd = newCases.filter(c => !existingNumbers.has(c.number.replace(/\D/g, '')));
      const added = toAdd.length;
      if (added > 0) {
        addNotification(`${added} novos processos importados.`, 'success');
      } else {
        addNotification(`Nenhum processo novo encontrado na importação.`, 'info');
      }
      return [...toAdd, ...prev];
    });
  };

  const clearCases = () => {
    if (window.confirm('Tem certeza que deseja excluir TODOS os processos? Esta ação não pode ser desfeita.')) {
      setCases([]); // Local clear, sync is manual
      addNotification('Lista local limpa.', 'warning');
    }
  };

  const addClient = async (newClient: Client) => {
    setIsLoading(true);
    const updatedClient = {
      ...newClient,
      id: ensureUUID(newClient.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('clients').insert({
        id: updatedClient.id,
        name: updatedClient.name,
        document: updatedClient.document,
        type: updatedClient.type,
        email: updatedClient.email,
        phone: updatedClient.phone,
        group_name: updatedClient.group,
        nationality: updatedClient.nationality,
        marital_status: updatedClient.maritalStatus,
        profession: updatedClient.profession,
        rg: updatedClient.rg,
        birth_date: updatedClient.birthDate || null,
        gender: updatedClient.gender,
        representative: updatedClient.representative,
        representative_gender: updatedClient.representativeGender,
        representative_id: updatedClient.representativeId,
        representative_qualification: updatedClient.representativeQualification,
        representative_address: updatedClient.representativeAddress,
        street: updatedClient.street,
        address_number: updatedClient.addressNumber,
        complement: updatedClient.complement,
        neighborhood: updatedClient.neighborhood,
        city: updatedClient.city,
        state: updatedClient.state,
        zip: updatedClient.zip,
        notes: updatedClient.notes,
        created_at: updatedClient.createdAt,
        updated_at: updatedClient.updatedAt
      });
      if (error) throw error;
      setClients(prev => [updatedClient, ...prev]);
      addNotification('Contato criado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao criar contato: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const updateClient = async (updatedClient: Client) => {
    setIsLoading(true);
    const updated = {
      ...updatedClient,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('clients').update({
        name: updated.name,
        document: updated.document,
        type: updated.type,
        email: updated.email,
        phone: updated.phone,
        group_name: updated.group,
        nationality: updated.nationality,
        marital_status: updated.maritalStatus,
        profession: updated.profession,
        rg: updated.rg,
        birth_date: updated.birthDate || null,
        gender: updated.gender,
        representative: updated.representative,
        representative_gender: updated.representativeGender,
        representative_id: updated.representativeId,
        representative_qualification: updated.representativeQualification,
        representative_address: updated.representativeAddress,
        street: updated.street,
        address_number: updated.addressNumber,
        complement: updated.complement,
        neighborhood: updated.neighborhood,
        city: updated.city,
        state: updated.state,
        zip: updated.zip,
        notes: updated.notes,
        updated_at: updated.updatedAt
      }).eq('id', updated.id);

      if (error) throw error;
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
      addNotification('Contato atualizado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao atualizar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteClient = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
      addNotification('Contato removido.', 'info');
    } catch (err: any) {
      addNotification(`Erro ao remover: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const importClients = (newClients: Client[]) => {
    setClients(prev => {
      // Logical Key: Document (CPF/CNPJ) sanitized, or Name if document is empty
      const existingKeys = new Set(prev.map(c => {
        const doc = c.document?.replace(/\D/g, '');
        return doc || `name:${c.name.toLowerCase().trim()}`;
      }));

      const toAdd = newClients.filter(c => {
        const doc = c.document?.replace(/\D/g, '');
        const key = doc || `name:${c.name.toLowerCase().trim()}`;
        return !existingKeys.has(key);
      });

      const added = toAdd.length;
      if (added > 0) {
        addNotification(`${added} novos contatos importados.`, 'success');
      } else {
        addNotification(`Nenhum contato novo encontrado.`, 'info');
      }
      return [...toAdd, ...prev];
    });
  };

  const clearClients = () => setClients([]);

  const addTeamMember = async (newMember: TeamMember) => {
    setIsLoading(true);
    const updated = {
      ...newMember,
      id: ensureUUID(newMember.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('team_members').insert({
        id: updated.id,
        name: updated.name,
        role: updated.role,
        email: updated.email,
        phone: updated.phone,
        photo_url: updated.photo,
        active: updated.active,
        join_date: updated.joinDate || null,
        oab: updated.oab,
        cpf: updated.cpf,
        nationality: updated.nationality,
        gender: updated.gender,
        marital_status: updated.maritalStatus,
        address_street: updated.addressStreet,
        address_number: updated.addressNumber,
        address_complement: updated.addressComplement,
        address_neighborhood: updated.addressNeighborhood,
        address_city: updated.addressCity,
        address_state: updated.addressState,
        address_zip: updated.addressZip,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt
      });
      if (error) throw error;
      setTeamMembers(prev => [updated, ...prev]);
      addNotification('Membro da equipe adicionado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao adicionar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTeamMember = async (updatedMember: TeamMember) => {
    setIsLoading(true);
    const updated = {
      ...updatedMember,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('team_members').update({
        name: updated.name,
        role: updated.role,
        email: updated.email,
        phone: updated.phone,
        photo_url: updated.photo,
        active: updated.active,
        join_date: updated.joinDate || null,
        oab: updated.oab,
        cpf: updated.cpf,
        nationality: updated.nationality,
        gender: updated.gender,
        marital_status: updated.maritalStatus,
        address_street: updated.addressStreet,
        address_number: updated.addressNumber,
        address_complement: updated.addressComplement,
        address_neighborhood: updated.addressNeighborhood,
        address_city: updated.addressCity,
        address_state: updated.addressState,
        address_zip: updated.addressZip,
        updated_at: updated.updatedAt
      }).eq('id', updated.id);

      if (error) throw error;
      setTeamMembers(prev => prev.map(t => t.id === updated.id ? updated : t));
      addNotification('Dados atualizados!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao atualizar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTeamMember = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
      setTeamMembers(prev => prev.filter(t => t.id !== id));
      addNotification('Membro removido.', 'info');
    } catch (err: any) {
      addNotification(`Erro ao remover: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const importTeamMembers = (newMembers: TeamMember[]) => {
    setTeamMembers(prev => {
      const existingEmails = new Set(prev.map(t => t.email.toLowerCase().trim()));
      const toAdd = newMembers.filter(t => !existingEmails.has(t.email.toLowerCase().trim()));
      const added = toAdd.length;
      if (added > 0) {
        addNotification(`${added} novos membros importados.`, 'success');
      } else {
        addNotification(`Todos os membros já existem.`, 'info');
      }
      return [...toAdd, ...prev];
    });
  };

  const clearTeamMembers = () => setTeamMembers([]);

  const addDeadline = async (newDeadline: Deadline) => {
    setIsLoading(true);
    const updated = {
      ...newDeadline,
      id: ensureUUID(newDeadline.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('deadlines').insert({
        id: updated.id,
        case_id: toUUID(updated.caseId),
        case_title: updated.caseTitle,
        customer_name: updated.customerName,
        title: updated.title,
        due_date: updated.dueDate,
        start_date: updated.startDate || null,
        start_time: updated.startTime,
        days: updated.days,
        count_type: updated.countType,
        status: updated.status,
        is_done: updated.isDone,
        priority: updated.priority,
        type: updated.type,
        court: updated.court,
        city: updated.city,
        uf: updated.uf,
        created_at: updated.createdAt,
        updated_at: updated.updatedAt
      });
      if (error) throw error;
      setDeadlines(prev => [updated, ...prev]);
      addNotification('Prazo agendado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao agendar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeadline = async (updatedDeadline: Deadline) => {
    setIsLoading(true);
    const updated = {
      ...updatedDeadline,
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('deadlines').update({
        case_id: toUUID(updated.caseId),
        case_title: updated.caseTitle,
        customer_name: updated.customerName,
        title: updated.title,
        due_date: updated.dueDate,
        start_date: updated.startDate || null,
        start_time: updated.startTime,
        days: updated.days,
        count_type: updated.countType,
        status: updated.status,
        is_done: updated.isDone,
        priority: updated.priority,
        type: updated.type,
        court: updated.court,
        city: updated.city,
        uf: updated.uf,
        updated_at: updated.updatedAt
      }).eq('id', updated.id);

      if (error) throw error;
      setDeadlines(prev => prev.map(d => d.id === updated.id ? updated : d));
      addNotification('Prazo atualizado!', 'success');
    } catch (err: any) {
      addNotification(`Erro ao atualizar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeadline = async (id: string) => {
    const d = deadlines.find(item => item.id === id);
    if (!d) return;

    const newState = !d.isDone;
    const newStatus = newState ? 'Done' : 'Pending';

    await updateDeadline({ ...d, isDone: newState, status: newStatus as any });
  };

  const updateDeadlineStatus = async (id: string, status: 'Pending' | 'Done' | 'Canceled') => {
    const d = deadlines.find(item => item.id === id);
    if (!d) return;

    await updateDeadline({ ...d, status, isDone: status === 'Done' });
  };

  const deleteDeadline = async (id: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from('deadlines').delete().eq('id', id);
      if (error) throw error;
      setDeadlines(prev => prev.filter(d => d.id !== id));
      addNotification('Prazo removido.', 'info');
    } catch (err: any) {
      addNotification(`Erro ao remover: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const importDeadlines = (newDeadlines: Deadline[]) => {
    setDeadlines(prev => {
      // Logical Key: Title + Date + CaseId (or CaseTitle if CaseId is placeholder)
      const existingKeys = new Set(prev.map(d => `${d.title}|${d.dueDate}|${d.caseId || d.caseTitle}`));
      const toAdd = newDeadlines.filter(d => !existingKeys.has(`${d.title}|${d.dueDate}|${d.caseId || d.caseTitle}`));
      const added = toAdd.length;
      if (added > 0) {
        addNotification(`${added} novos prazos importados.`, 'success');
      } else {
        addNotification(`Nenhum prazo novo para importar.`, 'info');
      }
      return [...toAdd, ...prev];
    });
  };

  const clearDeadlines = () => setDeadlines([]);

  const addAppointment = async (a: Appointment) => {
    setIsLoading(true);
    const fresh = {
      ...a,
      id: ensureUUID(a.id),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const { error } = await supabase.from('appointments').insert({
        id: fresh.id,
        title: fresh.title,
        appointment_date: fresh.date,
        type: fresh.type,
        case_id: toUUID(fresh.caseId),
        description: fresh.description,
        created_at: fresh.createdAt,
        updated_at: fresh.updatedAt
      });
      if (error) throw error;
      setAppointments(prev => [fresh, ...prev]);
      addNotification(`Compromisso agendado.`, 'success');
    } catch (err: any) {
      addNotification(`Erro ao agendar: ${err.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  const importHolidays = (newHolidays: Holiday[]) => {
    setHolidays(prev => {
      const existingDates = new Set(prev.map(h => h.date));
      // Filter out existing dates to avoid duplicates
      const toAdd = newHolidays.filter(h => !existingDates.has(h.date));

      // If we are importing, we should trust the incoming names if they likely have better quality than "Feriado Importado"
      // However, for simplicity in this flow, we just add new ones. 
      // The Reset function is the primary fix for bad data.

      const updated = [...prev, ...toAdd].sort((a, b) => a.date.localeCompare(b.date));

      if (toAdd.length > 0) {
        addNotification(`${toAdd.length} feriados importados.`, 'success');
        // Trigger generic sync to save these to cloud if needed, 
        // but typically imports are followed by a sync or auto-save in this architecture.
        // For now, let's rely on the manual sync or the next auto-sync cycle if implemented.
      } else {
        addNotification('Nenhum feriado novo para importar.', 'info');
      }
      return updated;
    });
  };

  const resetHolidays = async () => {
    if (!window.confirm('Tem certeza? Isso apagará todos os feriados personalizados e restaurará a lista padrão do sistema.')) {
      return;
    }

    setIsLoading(true);
    try {
      // 1. Clear local
      setHolidays(DEFAULT_HOLIDAYS);

      // 2. Clear Supabase
      const { error: deleteError } = await supabase.from('holidays').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (deleteError) throw deleteError;

      // 3. Re-insert defaults
      const payload = DEFAULT_HOLIDAYS.map(h => ({
        id: crypto.randomUUID(), // Generate new IDs
        holiday_date: h.date,
        name: h.name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase.from('holidays').insert(payload);
      if (insertError) throw insertError;

      addNotification('Feriados restaurados com sucesso!', 'success');
    } catch (err: any) {
      console.error('Erro ao restaurar feriados:', err);
      addNotification(`Erro ao restaurar: ${err.message}`, 'warning');
      // Revert to local default just in case to allow work to continue
      setHolidays(DEFAULT_HOLIDAYS);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const addNotification = (msg: string, type: 'info' | 'warning' | 'success' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [{ id, msg, type }, ...prev]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };


  const exportData = () => {
    const allData = { cases, clients, teamMembers, deadlines, appointments, holidays, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexprime_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification('Backup gerado!', 'success');
  };

  // No changes needed here, just fixing the scope by removing the closing brace 
  // and re-placing the return statement correctly.

  const syncData = async () => {
    setIsLoading(true);
    addNotification('Sincronizando com a nuvem...', 'info');

    const idMap = new Map<string, string>();

    // Helper: Sanitize IDs
    const sanitizeList = (list: any[]) => {
      let changed = false;
      const newList = list.map(item => {
        if (!isUUID(item.id)) {
          const newId = crypto.randomUUID();
          idMap.set(item.id, newId);
          changed = true;
          return { ...item, id: newId };
        }
        return item;
      });
      return { newList, changed };
    };

    const sClients = sanitizeList(clients);
    const sCases = sanitizeList(cases);
    const sTeam = sanitizeList(teamMembers);
    const sDeadlines = sanitizeList(deadlines);
    const sAppointments = sanitizeList(appointments);
    const sHolidays = sanitizeList(holidays);

    // Helper: Update Refs
    const updateRefs = (list: any[], refKey: string) => {
      return list.map(item => {
        if (item[refKey] && idMap.has(item[refKey])) {
          return { ...item, [refKey]: idMap.get(item[refKey]) };
        }
        return item;
      });
    };

    const finalClients = sClients.newList;
    const finalCases = updateRefs(updateRefs(sCases.newList, 'clientId'), 'parentId');
    const finalTeam = sTeam.newList;
    const finalDeadlines = updateRefs(sDeadlines.newList, 'caseId');
    const finalAppointments = updateRefs(sAppointments.newList, 'caseId');
    const finalHolidays = sHolidays.newList;

    // Update state if changed
    if (idMap.size > 0 || sClients.changed || sCases.changed || sTeam.changed || sDeadlines.changed || sAppointments.changed || sHolidays.changed) {
      setClients(finalClients);
      setCases(finalCases);
      setTeamMembers(finalTeam);
      setDeadlines(finalDeadlines);
      setAppointments(finalAppointments);
      setHolidays(finalHolidays);
      addNotification(`${idMap.size} IDs sanitizados.`, 'info');
    }

    try {
      // Clients
      if (finalClients.length > 0) {
        const payload = finalClients.map(c => ({
          id: c.id,
          name: c.name,
          document: c.document,
          type: c.type,
          email: c.email,
          phone: c.phone,
          group_name: c.group,
          nationality: c.nationality,
          marital_status: c.maritalStatus,
          profession: c.profession,
          rg: c.rg,
          birth_date: c.birthDate || null,
          gender: c.gender,
          representative: c.representative,
          representative_gender: c.representativeGender,
          representative_id: c.representativeId,
          representative_qualification: c.representativeQualification,
          representative_address: c.representativeAddress,
          street: c.street,
          address_number: c.addressNumber,
          complement: c.complement,
          neighborhood: c.neighborhood,
          city: c.city,
          state: c.state,
          zip: c.zip,
          notes: c.notes,
          created_at: c.createdAt,
          updated_at: c.updatedAt
        }));
        const { error } = await supabase.from('clients').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      // Cases
      if (finalCases.length > 0) {
        const payload = finalCases.map(c => ({
          id: c.id,
          number: c.number,
          title: c.title,
          client_id: toUUID(c.clientId),
          client_name: c.clientName,
          client_position: c.clientPosition,
          opposing_party: c.opposingParty,
          court: c.court,
          uf: c.uf,
          city: c.city,
          area: c.area,
          folder_number: c.folderNumber || null,
          parent_id: toUUID(c.parentId),
          related_type: c.relatedType || null,
          value: c.value,
          value_date: c.valueDate || null,
          status: c.status,
          last_update: c.lastUpdate,
          tags: c.tags,
          description: c.description,
          occurrences: c.occurrences,
          history: c.history,
          created_at: c.createdAt,
          updated_at: c.updatedAt
        }));
        const { error } = await supabase.from('cases').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      // Deadlines
      if (finalDeadlines.length > 0) {
        const payload = finalDeadlines.map(d => ({
          id: d.id,
          case_id: toUUID(d.caseId),
          case_title: d.caseTitle,
          customer_name: d.customerName,
          title: d.title,
          due_date: d.dueDate,
          start_date: d.startDate || null,
          start_time: d.startTime,
          days: d.days,
          count_type: d.countType,
          status: d.status,
          is_done: d.isDone,
          priority: d.priority,
          type: d.type,
          court: d.court,
          city: d.city,
          uf: d.uf,
          created_at: d.createdAt,
          updated_at: d.updatedAt
        }));
        const { error } = await supabase.from('deadlines').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      // Team
      if (finalTeam.length > 0) {
        const payload = finalTeam.map(t => ({
          id: t.id,
          name: t.name,
          role: t.role,
          email: t.email,
          phone: t.phone,
          photo_url: t.photo,
          active: t.active,
          join_date: t.joinDate || null,
          oab: t.oab,
          cpf: t.cpf,
          nationality: t.nationality,
          gender: t.gender,
          marital_status: t.maritalStatus,
          address_street: t.addressStreet,
          address_number: t.addressNumber,
          address_complement: t.addressComplement,
          address_neighborhood: t.addressNeighborhood,
          address_city: t.addressCity,
          address_state: t.addressState,
          address_zip: t.addressZip,
          created_at: t.createdAt,
          updated_at: t.updatedAt
        }));
        const { error } = await supabase.from('team_members').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      // Appointments
      if (finalAppointments.length > 0) {
        const payload = finalAppointments.map(a => ({
          id: a.id,
          title: a.title,
          appointment_date: a.date,
          type: a.type,
          case_id: toUUID(a.caseId),
          description: a.description,
          created_at: a.createdAt,
          updated_at: a.updatedAt
        }));
        const { error } = await supabase.from('appointments').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      // Holidays
      if (finalHolidays.length > 0) {
        const payload = finalHolidays.map(h => ({
          id: h.id,
          holiday_date: h.date,
          name: h.name,
          created_at: h.createdAt,
          updated_at: h.updatedAt
        }));
        const { error } = await supabase.from('holidays').upsert(payload, { onConflict: 'id' });
        if (error) throw error;
      }

      addNotification('Sincronização concluída!', 'success');
    } catch (error: any) {
      addNotification(`Erro: ${error.message}`, 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StoreContext.Provider value={{
      cases, setCases, addCase, updateCase, deleteCase, importCases, clearCases,
      clients, setClients, addClient, updateClient, deleteClient, importClients, clearClients,
      teamMembers, setTeamMembers, addTeamMember, updateTeamMember, deleteTeamMember, importTeamMembers, clearTeamMembers,
      deadlines, setDeadlines, addDeadline, updateDeadline, toggleDeadline, updateDeadlineStatus, deleteDeadline, importDeadlines, clearDeadlines,
      appointments, addAppointment,
      holidays, setHolidays, importHolidays, resetHolidays,
      currentUser, login, signUp, logout,
      isDarkMode, toggleTheme,
      notifications, addNotification, clearNotification,
      isLoading, setIsLoading,
      exportData, syncData,
      pendingAction, setPendingAction
    }}>
      {children}

      {/* Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map(n => (
          <div key={n.id} className={`pointer-events-auto animate-slide-in p-4 rounded-lg shadow-lg border flex items-center gap-3 max-w-sm
            ${n.type === 'success' ? 'bg-white border-green-500 text-green-700 dark:bg-dark-800 dark:text-green-400' : ''}
            ${n.type === 'info' ? 'bg-white border-blue-500 text-blue-700 dark:bg-dark-800 dark:text-blue-400' : ''}
            ${n.type === 'warning' ? 'bg-white border-orange-500 text-orange-700 dark:bg-dark-800 dark:text-orange-400' : ''}
          `}>
            <div className={`w-2 h-2 rounded-full ${n.type === 'success' ? 'bg-green-500' : n.type === 'info' ? 'bg-blue-500' : 'bg-orange-500'
              }`} />
            <p className="text-sm font-medium">{n.msg}</p>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
