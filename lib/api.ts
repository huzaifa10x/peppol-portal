const BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.kasaadvisory.com";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

async function postForm<T>(path: string, form: FormData): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  container_running: boolean;
  mls_watcher_pid: string | null;
  cert_exists: boolean;
  timestamp: string;
}

export interface Document {
  id: string;
  participant: "billing" | "selfbilling";
  filename: string;
  path: string;
  size_bytes: number;
  received_at: string;
  sender_folder: string;
}

export interface InboxResponse {
  total: number;
  documents: Document[];
}

export interface ValidationResult {
  valid: boolean;
  error_count: number;
  errors: string[];
  variant: "billing" | "selfbilling";
}

export interface SendResult {
  status: string;
  invoice_sent: boolean;
  tdd_sent: boolean;
  tdd_error: string | null;
}

export interface TddResponse {
  tdd_files: string;
  mls_log: string;
}

export interface Participant {
  participant: string;
  label: string;
  registered: boolean;
  services?: number;
  http_error?: number;
}

export interface SmpResponse {
  participants: Participant[];
}

// ── API calls ────────────────────────────────────────────────────────────────

export const api = {
  health:       ()                        => get<HealthResponse>("/health"),
  startWatcher: ()                        => post("/health/start-mls-watcher"),
  inbox:        (participant?: string, limit = 50) =>
    get<InboxResponse>(`/inbox?${participant ? `participant=${participant}&` : ""}limit=${limit}`),
  document:     (id: string)              => get<{ path: string; content: string }>(`/inbox/${id}`),
  validate:     (file: File)              => { const f = new FormData(); f.append("file", file); return postForm<ValidationResult>("/validate", f); },
  send:         (document_type: string)   => post<SendResult>("/send", { document_type }),
  sendRaw:      (file: File)              => { const f = new FormData(); f.append("file", file); return postForm<SendResult>("/send/raw", f); },
  tdds:         ()                        => get<TddResponse>("/tdds"),
  mlsLog:       (lines = 100)             => get<{ log: string }>(`/tdds/mls-log?lines=${lines}`),
  smp:          ()                        => get<SmpResponse>("/smp/participants"),
  oxalisLogs:   (lines = 100)             => get<{ log: string }>(`/logs/oxalis?lines=${lines}`),
};

// ── Database-backed endpoints ─────────────────────────────────────────────

export interface DBDocument {
  id: string;
  direction: "inbound" | "outbound";
  doc_type: "invoice" | "credit_note";
  participant_type: "billing" | "selfbilling";
  status: string;
  invoice_number: string | null;
  issue_date: string | null;
  supplier_name: string | null;
  supplier_tax_id: string | null;
  buyer_name: string | null;
  buyer_tax_id: string | null;
  currency_code: string;
  tax_exclusive_amount: number | null;
  tax_amount: number | null;
  payable_amount: number | null;
  xml_filename: string;
  xml_size_bytes: number;
  sender_folder: string;
  tdd_generated: boolean;
  tdd_sent: boolean;
  mls_status: string | null;
  received_at: string;
}

export interface DBDocumentsResponse {
  total: number;
  documents: DBDocument[];
  limit: number;
  offset: number;
}

export interface DocStats {
  total: number;
  inbound: number;
  outbound: number;
  billing: number;
  selfbilling: number;
  invoices: number;
  credit_notes: number;
  tdds_generated: number;
  tdds_sent: number;
  total_amount: number;
}

export interface Party {
  id: string;
  name: string;
  trade_registry_code: string | null;
  tax_id: string | null;
  vat_number: string | null;
  country_code: string;
  city: string | null;
  peppol_id: string | null;
  vat_status: string;
  is_active: boolean;
  created_at: string;
}

export const dbApi = {
  stats: () => get<DocStats>("/documents/stats"),
  documents: (params?: {
    direction?: string;
    participant_type?: string;
    doc_type?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.direction) q.set("direction", params.direction);
    if (params?.participant_type) q.set("participant_type", params.participant_type);
    if (params?.doc_type) q.set("doc_type", params.doc_type);
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.offset) q.set("offset", String(params.offset));
    return get<DBDocumentsResponse>(`/documents?${q}`);
  },
  sync: () => post<{ synced: number; skipped: number; errors: unknown[]; total: number }>("/sync/inbox"),
  parties: () => get<{ total: number; parties: Party[] }>("/parties"),
  createParty: (data: Partial<Party>) => post<{ id: string; created: boolean }>("/parties", data),
};
