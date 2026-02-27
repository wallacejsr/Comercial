-- CRM Database Schema (PostgreSQL)

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'seller')) DEFAULT 'seller',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    manager_id INTEGER REFERENCES users(id)
);

-- Origins Table
CREATE TABLE IF NOT EXISTS origins (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Funnel Stages Table
CREATE TABLE IF NOT EXISTS funnel_stages (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    probability INTEGER DEFAULT 0,
    color TEXT DEFAULT '#3b82f6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    origin_id INTEGER REFERENCES origins(id),
    grupo TEXT,
    producao TEXT,
    cidade TEXT,
    uf TEXT,
    responsavel TEXT,
    cargo TEXT,
    ligacao_realizada TEXT DEFAULT 'Não',
    virou_agenda TEXT DEFAULT 'Não',
    empresa_homologada TEXT DEFAULT 'Não',
    data_follow_up DATE,
    status_follow_up TEXT,
    notes TEXT,
    owner_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loss Reasons Table
CREATE TABLE IF NOT EXISTS loss_reasons (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL
);

-- Opportunities Table
CREATE TABLE IF NOT EXISTS opportunities (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    stage_id INTEGER NOT NULL REFERENCES funnel_stages(id),
    owner_id INTEGER NOT NULL REFERENCES users(id),
    value DECIMAL DEFAULT 0,
    forecast_date DATE,
    status TEXT CHECK(status IN ('open', 'won', 'lost')) DEFAULT 'open',
    loss_reason_id INTEGER REFERENCES loss_reasons(id),
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities Table
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER NOT NULL REFERENCES opportunities(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT CHECK(type IN ('note', 'task', 'call', 'email')) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals Table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reference_month TEXT NOT NULL, -- YYYY-MM
    target_value DECIMAL NOT NULL
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
INSERT INTO origins (name) VALUES ('Paid Traffic'), ('Referral'), ('Organic'), ('Direct'), ('Event') ON CONFLICT (name) DO NOTHING;

INSERT INTO funnel_stages (name, sort_order, probability, color) VALUES 
('Lead', 1, 10, '#94a3b8'),
('Qualification', 2, 25, '#60a5fa'),
('Proposal', 3, 50, '#fbbf24'),
('Negotiation', 4, 75, '#f472b6'),
('Closing', 5, 90, '#c084fc')
ON CONFLICT DO NOTHING;

INSERT INTO loss_reasons (description) VALUES ('Price'), ('Competitor'), ('No Budget'), ('Bad Timing'), ('Other') ON CONFLICT DO NOTHING;

-- Tarefas Table
CREATE TABLE IF NOT EXISTS tarefas (
    id SERIAL PRIMARY KEY,
    oportunidade_id INTEGER REFERENCES opportunities(id),
    usuario_id INTEGER NOT NULL REFERENCES users(id),
    titulo TEXT NOT NULL,
    descricao TEXT,
    data_vencimento TIMESTAMP NOT NULL,
    concluida BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Produtos Table
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_unitario DECIMAL NOT NULL,
    categoria TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Oportunidade Itens Table
CREATE TABLE IF NOT EXISTS oportunidade_itens (
    id SERIAL PRIMARY KEY,
    oportunidade_id INTEGER NOT NULL REFERENCES opportunities(id),
    produto_id INTEGER NOT NULL REFERENCES produtos(id),
    quantidade INTEGER DEFAULT 1,
    preco_venda DECIMAL NOT NULL
);

-- Configuracoes Sistema Table
CREATE TABLE IF NOT EXISTS configuracoes_sistema (
    id SERIAL PRIMARY KEY,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campanhas de E-mail
CREATE TABLE IF NOT EXISTS campanhas_email (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    assunto TEXT NOT NULL,
    conteudo_html TEXT NOT NULL,
    filtro_etapa_id INTEGER REFERENCES funnel_stages(id),
    status TEXT DEFAULT 'rascunho', -- 'rascunho', 'enviando', 'concluido'
    total_destinatarios INTEGER DEFAULT 0,
    enviados INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fila de E-mails
CREATE TABLE IF NOT EXISTS fila_email (
    id SERIAL PRIMARY KEY,
    campanha_id INTEGER NOT NULL REFERENCES campanhas_email(id),
    email_destinatario TEXT NOT NULL,
    nome_destinatario TEXT,
    status TEXT DEFAULT 'pendente', -- 'pendente', 'enviado', 'erro'
    tentativas INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Campos Customizados
CREATE TABLE IF NOT EXISTS campos_customizados (
    id SERIAL PRIMARY KEY,
    entidade TEXT NOT NULL, -- 'lead', 'oportunidade'
    label TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'text', 'number', 'select'
    opcoes TEXT, -- JSON array para select
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campos_customizados_valores (
    id SERIAL PRIMARY KEY,
    campo_id INTEGER NOT NULL REFERENCES campos_customizados(id),
    entidade_id INTEGER NOT NULL,
    valor TEXT,
    UNIQUE(campo_id, entidade_id)
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    trigger_event TEXT NOT NULL, -- 'lead_created', 'opportunity_stage_changed'
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_actions (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER NOT NULL REFERENCES workflows(id),
    type TEXT NOT NULL, -- 'send_email', 'create_task'
    config TEXT -- JSON configuration
);

-- Communication Logs
CREATE TABLE IF NOT EXISTS communication_logs (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    type TEXT NOT NULL, -- 'whatsapp', 'sms', 'call'
    direction TEXT NOT NULL, -- 'inbound', 'outbound'
    content TEXT,
    status TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lead Scoring Rules
CREATE TABLE IF NOT EXISTS lead_scoring_rules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    criteria TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents & Proposals
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    opportunity_id INTEGER REFERENCES opportunities(id),
    customer_id INTEGER REFERENCES customers(id),
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    type TEXT, -- 'proposal', 'contract', 'other'
    category TEXT DEFAULT 'Empresa', -- 'Empresa', 'Vendas'
    status TEXT DEFAULT 'Finalizada', -- 'Rascunho', 'Enviada', 'Finalizada'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
