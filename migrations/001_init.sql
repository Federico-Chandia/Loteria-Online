-- migrations/001_init.sql

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- mejora concurrencia
PRAGMA synchronous = NORMAL;     -- buen tradeoff entre seguridad y perf

-- Tabla de sorteos en caché (últimos 10)
CREATE TABLE IF NOT EXISTS draws (
  draw_id TEXT PRIMARY KEY,      -- identificador único (ej: "2025-08-06_TRAD")
  date TEXT NOT NULL,            -- fecha legible
  modality TEXT NOT NULL,        -- 'TRADICIONAL'|'REVANCHA'|'SIEMPRE_SALE'...
  numbers TEXT NOT NULL,         -- JSON string o CSV: "[1,2,3,4,5,6]"
  fetched_at INTEGER NOT NULL    -- epoch ms cuando se guardó
);

CREATE INDEX IF NOT EXISTS idx_draws_fetched_at ON draws(fetched_at);

-- Tabla de tickets (comprobantes)
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,           -- UUID (jti)
  draw_id TEXT NOT NULL,         -- FK a draws.draw_id (opcional)
  numbers TEXT NOT NULL,         -- JSON array como string
  token TEXT NOT NULL,           -- JWT firmado (o token firmado)
  payment_ref TEXT,              -- referencia de pago (MercadoPago, Uala, etc)
  state TEXT NOT NULL DEFAULT 'PENDING',  -- PENDING|ACTIVE|USED|REVOKED
  created_at INTEGER NOT NULL,   -- epoch ms
  used_at INTEGER,               -- epoch ms cuando se canjeó
  expires_at INTEGER,            -- epoch ms si querés expiración
  kid TEXT,                      -- id de clave usada para firmar (opcional)
  CONSTRAINT fk_draw FOREIGN KEY (draw_id) REFERENCES draws(draw_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tickets_state ON tickets(state);
CREATE INDEX IF NOT EXISTS idx_tickets_draw ON tickets(draw_id);

-- Tabla de logs para auditoría
CREATE TABLE IF NOT EXISTS ticket_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT,
  action TEXT NOT NULL,          -- e.g. 'CREATED','PAY_CONFIRMED','VERIFIED','USED','REVOKED'
  actor TEXT,                    -- ip, user id, sistema
  meta TEXT,                     -- json con info extra
  ts INTEGER NOT NULL,           -- epoch ms
  FOREIGN KEY(ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticket_logs_ticket ON ticket_logs(ticket_id);
