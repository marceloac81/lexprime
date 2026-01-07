

export enum CaseStatus {
  Active = 'Ativo',
  Archived = 'Arquivado',
}

export interface Client {
  id: string;
  name: string; // NOME
  email: string; // E_MAIL
  phone: string; // FONE_CEL (Principal)

  // Extended fields for "Contatos"
  phoneHome?: string; // FONE_CASA
  phoneWork?: string; // FONE_TRAB1
  phoneWork2?: string; // FONE_TRAB_2
  group?: string; // GRUPO

  // Qualification Fields (New)
  nationality?: string;
  maritalStatus?: string;
  profession?: string;
  rg?: string;
  birthDate?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  representative?: string; // For PJ (Sócio Administrador) or Espólio (Inventariante)
  representativeGender?: 'Masculino' | 'Feminino' | 'Outro';
  representativeId?: string; // CPF/RG of the representative
  representativeQualification?: string; // Full qualification string
  representativeAddress?: string; // If different from main address

  // Address Fields
  street?: string; // ENDERECO
  addressNumber?: string; // New: Number
  complement?: string; // New: Complement
  neighborhood?: string; // BAIRRO
  city?: string; // CIDADE
  state?: string; // ESTADO
  zip?: string; // CEP
  country?: string; // PAIS

  document: string; // CPF/CNPJ
  type: 'Pessoa Física' | 'Pessoa Jurídica' | 'Espólio';
  address?: string; // Deprecated but kept for compatibility, prefer structured fields
  notes?: string; // OBSERVACAO
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // Advogado, Secretária, Financeiro, etc.
  email: string;
  phone: string;
  photo?: string; // Base64 string
  active: boolean;
  joinDate: string;

  // Professional / Qualification
  oab?: string;
  cpf?: string;
  nationality?: string;
  gender?: 'Masculino' | 'Feminino' | 'Outro';
  maritalStatus?: string;

  // Professional Address
  addressStreet?: string;
  addressNumber?: string;
  addressComplement?: string; // New: Complement
  addressNeighborhood?: string;
  addressCity?: string;
  addressState?: string;
  addressZip?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CaseDocument {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'IMG';
  size: string;
  uploadDate: string;
  url?: string;
}

export interface CaseHistory {
  id: string;
  date: string;
  description: string;
  user: string;
}

export interface CaseOccurrence {
  id: string;
  date: string;
  description: string;
}

export interface Case {
  id: string;
  number: string;          // CNJ or Admin (Required)
  title: string;           // Auto-generated or manual (Client vs Opponent)

  // Parties
  clientId?: string;
  clientName: string;      // Required
  clientPosition: 'Ativo' | 'Passivo'; // Required
  opposingParty: string;   // Required

  // Location
  court: string;           // Required (Vara/Local)
  uf: string;              // Required
  city: string;            // Required
  area: string;            // Required

  // Internal
  folderNumber?: string;   // Optional (Nº Pasta Física)
  parentId?: string;       // Linked Parent Case ID
  relatedType?: string;    // Agravo, Carta Precatória, Recurso, etc.

  // Financial
  value?: number;          // Optional
  valueDate?: string;      // Optional

  status: CaseStatus;
  lastUpdate: string;
  tags: string[];
  description?: string;
  documents?: CaseDocument[];
  history?: CaseHistory[];
  occurrences?: CaseOccurrence[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Deadline {
  id: string;
  caseId?: string;
  caseTitle?: string; // Denormalized for display
  customerName?: string; // Manual entry when no case linked

  // Manual location for standalone deadlines
  court?: string;
  city?: string;
  uf?: string;

  title: string;
  dueDate: string;
  startDate?: string; // For calculation history
  startTime?: string; // New: 09:00 default
  days?: number;      // For calculation history
  countType?: 'business' | 'calendar';
  isDone: boolean; // Deprecated in UI in favor of status, kept for compat
  status?: 'Pending' | 'Done' | 'Canceled'; // New status field
  priority: 'High' | 'Medium' | 'Low';
  type: 'Prazo Processual' | 'Administrativo' | 'Audiência';
  createdAt?: string;
  updatedAt?: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // ISO String
  type: 'Audiência' | 'Reunião' | 'Diligência';
  caseId?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Advogado' | 'Estagiário';
  avatar?: string;
}

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
  createdAt?: string;
  updatedAt?: string;
}