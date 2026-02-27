import pool from "./db";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'manager' | 'seller';
  active: boolean;
  last_login?: string;
  created_at: string;
}

export class UserRepository {
  static async findByEmail(email: string): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    return res.rows[0] as User | undefined;
  }

  static async findById(id: number): Promise<User | undefined> {
    const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] as User | undefined;
  }

  static async create(user: Partial<User>): Promise<number> {
    const res = await pool.query(
      "INSERT INTO users (name, email, password, role, active) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [user.name, user.email, user.password, user.role || 'seller', user.active !== undefined ? user.active : true]
    );
    return res.rows[0].id;
  }

  static async update(id: number, data: any) {
    const fields = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      if (key === 'password') continue;
      fields.push(`${key} = $${i++}`);
      params.push(value);
    }
    params.push(id);
    return pool.query(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i}`, params);
  }

  static async delete(id: number) {
    return pool.query("DELETE FROM users WHERE id = $1", [id]);
  }

  static async list(): Promise<User[]> {
    const res = await pool.query("SELECT id, name, email, role, active, last_login, created_at FROM users ORDER BY name ASC");
    return res.rows as User[];
  }
}

export class CustomerRepository {
  static async list(filters: { ownerId?: number } = {}) {
    let query = `
      SELECT c.*, o.name as origin_name, u.name as owner_name
      FROM customers c 
      LEFT JOIN origins o ON c.origin_id = o.id 
      LEFT JOIN users u ON c.owner_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (filters.ownerId) {
      params.push(filters.ownerId);
      query += ` AND c.owner_id = $${params.length}`;
    }
    query += " ORDER BY c.created_at DESC";
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async create(data: any) {
    const res = await pool.query(`
      INSERT INTO customers (
        name, company, email, phone, whatsapp, origin_id, 
        grupo, producao, cidade, uf, responsavel, cargo, 
        ligacao_realizada, virou_agenda, empresa_homologada, 
        data_follow_up, status_follow_up, notes, owner_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING id
    `, [
      data.name, data.company, data.email, data.phone, data.whatsapp, data.origin_id,
      data.grupo || null, data.producao || null, data.cidade || null, data.uf || null,
      data.responsavel || null, data.cargo || null,
      data.ligacao_realizada || 'Não', data.virou_agenda || 'Não', data.empresa_homologada || 'Não',
      data.data_follow_up || null, data.status_follow_up || null, data.notes || null,
      data.owner_id || null
    ]);
    return res.rows[0].id;
  }

  static async update(id: number, data: any) {
    const fields = [];
    const params = [];
    let i = 1;
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = $${i++}`);
      params.push(value);
    }
    params.push(id);
    return pool.query(`UPDATE customers SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${i}`, params);
  }

  static async findByPhone(phone: string) {
    const res = await pool.query("SELECT * FROM customers WHERE phone = $1 OR whatsapp = $2", [phone, phone]);
    return res.rows[0];
  }
}

export class GoalRepository {
  static async list(userId?: number) {
    let query = "SELECT g.*, u.name as user_name FROM goals g JOIN users u ON g.user_id = u.id";
    const params = [];
    if (userId) {
      query += " WHERE g.user_id = $1";
      params.push(userId);
    }
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async upsert(data: any) {
    const existingRes = await pool.query("SELECT id FROM goals WHERE user_id = $1 AND reference_month = $2", [data.user_id, data.reference_month]);
    const existing = existingRes.rows[0];
    if (existing) {
      return pool.query("UPDATE goals SET target_value = $1 WHERE id = $2", [data.target_value, existing.id]);
    }
    return pool.query("INSERT INTO goals (user_id, reference_month, target_value) VALUES ($1, $2, $3)", [data.user_id, data.reference_month, data.target_value]);
  }
}

export interface Opportunity {
  id: number;
  customer_id: number;
  customer_name?: string;
  customer_company?: string;
  stage_id: number;
  stage_name?: string;
  owner_id: number;
  owner_name?: string;
  value: number;
  forecast_date: string;
  status: 'open' | 'won' | 'lost';
  loss_reason_id?: number;
  closed_at?: string;
  created_at: string;
}

export class OpportunityRepository {
  static async list(filters: { owner_id?: number; status?: string } = {}): Promise<Opportunity[]> {
    let query = `
      SELECT o.*, c.name as customer_name, c.company as customer_company, s.name as stage_name, u.name as owner_name
      FROM opportunities o
      JOIN customers c ON o.customer_id = c.id
      JOIN funnel_stages s ON o.stage_id = s.id
      JOIN users u ON o.owner_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.owner_id) {
      params.push(filters.owner_id);
      query += ` AND o.owner_id = $${params.length}`;
    }
    if (filters.status) {
      params.push(filters.status);
      query += ` AND o.status = $${params.length}`;
    }

    query += " ORDER BY o.created_at DESC";
    const res = await pool.query(query, params);
    return res.rows as Opportunity[];
  }

  static async updateStage(id: number, stageId: number): Promise<void> {
    await pool.query("UPDATE opportunities SET stage_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [stageId, id]);
  }

  static async updateStatus(id: number, status: string, lossReasonId?: number): Promise<void> {
    const closedAt = status !== 'open' ? new Date().toISOString() : null;
    await pool.query(
      "UPDATE opportunities SET status = $1, loss_reason_id = $2, closed_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4",
      [status, lossReasonId || null, closedAt, id]
    );
  }

  static async getStats(userId?: number) {
    let whereClause = "WHERE status = 'open'";
    let wonWhereClause = "WHERE status = 'won' AND to_char(closed_at, 'YYYY-MM') = to_char(CURRENT_TIMESTAMP, 'YYYY-MM')";
    const params: any[] = [];
    const wonParams: any[] = [];

    if (userId) {
      params.push(userId);
      whereClause += ` AND owner_id = $${params.length}`;
      wonParams.push(userId);
      wonWhereClause += ` AND owner_id = $${wonParams.length}`;
    }

    const totalOpenRes = await pool.query(`SELECT COALESCE(SUM(value), 0) as total FROM opportunities ${whereClause}`, params);
    const totalOpen = totalOpenRes.rows[0];

    const weightedRes = await pool.query(`
      SELECT COALESCE(SUM(o.value * s.probability / 100), 0) as weighted 
      FROM opportunities o 
      JOIN funnel_stages s ON o.stage_id = s.id 
      ${whereClause.replace('status', 'o.status').replace('owner_id', 'o.owner_id')}
    `, params);
    const weighted = weightedRes.rows[0];

    const wonMonthRes = await pool.query(`SELECT COALESCE(SUM(value), 0) as total FROM opportunities ${wonWhereClause}`, wonParams);
    const wonMonth = wonMonthRes.rows[0];

    return {
      total_open_value: totalOpen || { total: 0 },
      weighted_value: weighted || { weighted: 0 },
      won_this_month: wonMonth || { total: 0 }
    };
  }
}

export class FunnelRepository {
  static async listStages() {
    const res = await pool.query("SELECT * FROM funnel_stages ORDER BY sort_order ASC");
    return res.rows;
  }

  static async updateStage(id: number, data: any) {
    return pool.query("UPDATE funnel_stages SET name = $1, sort_order = $2, probability = $3, color = $4 WHERE id = $5",
      [data.name, data.sort_order, data.probability, data.color, id]);
  }

  static async createStage(data: any) {
    return pool.query("INSERT INTO funnel_stages (name, sort_order, probability, color) VALUES ($1, $2, $3, $4)",
      [data.name, data.sort_order, data.probability, data.color]);
  }
}

export class TaskRepository {
  static async list(filters: { status?: string; userId?: number } = {}) {
    let query = `
      SELECT t.*, u.name as user_name, o.customer_id, c.name as customer_name
      FROM tarefas t
      JOIN users u ON t.usuario_id = u.id
      LEFT JOIN opportunities o ON t.oportunidade_id = o.id
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.userId) {
      params.push(filters.userId);
      query += ` AND t.usuario_id = $${params.length}`;
    }

    if (filters.status === 'today') {
      query += " AND t.data_vencimento::date = CURRENT_DATE AND t.concluida = false";
    } else if (filters.status === 'overdue') {
      query += " AND t.data_vencimento::date < CURRENT_DATE AND t.concluida = false";
    } else if (filters.status === 'completed') {
      query += " AND t.concluida = true";
    }

    query += " ORDER BY t.data_vencimento ASC";
    const res = await pool.query(query, params);
    return res.rows;
  }

  static async create(data: any) {
    return pool.query(
      "INSERT INTO tarefas (oportunidade_id, usuario_id, titulo, descricao, data_vencimento) VALUES ($1, $2, $3, $4, $5)",
      [data.oportunidade_id, data.usuario_id, data.titulo, data.descricao, data.data_vencimento]
    );
  }

  static async toggleComplete(id: number) {
    return pool.query("UPDATE tarefas SET concluida = NOT concluida WHERE id = $1", [id]);
  }
}

export class ProductRepository {
  static async list() {
    const res = await pool.query("SELECT * FROM produtos ORDER BY nome ASC");
    return res.rows;
  }

  static async create(data: any) {
    return pool.query("INSERT INTO produtos (nome, descricao, preco_unitario, categoria) VALUES ($1, $2, $3, $4)",
      [data.nome, data.descricao, data.preco_unitario, data.categoria]);
  }

  static async update(id: number, data: any) {
    return pool.query("UPDATE produtos SET name = $1, description = $2, preco_unitario = $3, categoria = $4 WHERE id = $5",
      [data.nome, data.descricao, data.preco_unitario, data.categoria, id]);
  }

  static async delete(id: number) {
    return pool.query("DELETE FROM produtos WHERE id = $1", [id]);
  }
}

export class OpportunityItemRepository {
  static async listByOpportunity(opportunityId: number) {
    const res = await pool.query(`
      SELECT oi.*, p.nome as product_name
      FROM oportunidade_itens oi
      JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.oportunidade_id = $1
    `, [opportunityId]);
    return res.rows;
  }

  static async add(data: any) {
    return pool.query("INSERT INTO oportunidade_itens (oportunidade_id, produto_id, quantidade, preco_venda) VALUES ($1, $2, $3, $4)",
      [data.opportunity_id, data.product_id, data.quantity, data.price_venda]);
  }
}

export class SettingRepository {
  static async get(key: string) {
    const res = await pool.query("SELECT valor FROM configuracoes_sistema WHERE chave = $1", [key]);
    return res.rows[0];
  }

  static async set(key: string, value: string) {
    const existingRes = await pool.query("SELECT id FROM configuracoes_sistema WHERE chave = $1", [key]);
    const existing = existingRes.rows[0];
    if (existing) {
      return pool.query("UPDATE configuracoes_sistema SET valor = $1, updated_at = CURRENT_TIMESTAMP WHERE chave = $2", [value, key]);
    }
    return pool.query("INSERT INTO configuracoes_sistema (chave, valor) VALUES ($1, $2)", [key, value]);
  }
}

export class CustomFieldRepository {
  static async list(entity: string) {
    const res = await pool.query("SELECT * FROM campos_customizados WHERE entidade = $1", [entity]);
    return res.rows;
  }

  static async create(data: any) {
    return pool.query("INSERT INTO campos_customizados (entidade, label, tipo, opcoes) VALUES ($1, $2, $3, $4)",
      [data.entidade, data.label, data.tipo, data.opcoes]);
  }

  static async setValues(entityId: number, values: Record<number, string>) {
    // For PostgreSQL, we can use a loop or a more complex query.
    // Since we are in a server environment, a loop with individual queries is okay for small sets,
    // but a transaction is better.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const [campoId, valor] of Object.entries(values)) {
        await client.query(`
          INSERT INTO campos_customizados_valores (campo_id, entidade_id, valor) 
          VALUES ($1, $2, $3)
          ON CONFLICT (campo_id, entidade_id) DO UPDATE SET valor = EXCLUDED.valor
        `, [Number(campoId), entityId, valor]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }
}

export class EmailRepository {
  static async listCampaigns() {
    const res = await pool.query(`
      SELECT c.*, s.name as stage_name 
      FROM campanhas_email c 
      LEFT JOIN funnel_stages s ON c.filtro_etapa_id = s.id 
      ORDER BY c.created_at DESC
    `);
    return res.rows;
  }

  static async createCampaign(data: any) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const campaignRes = await client.query(
        "INSERT INTO campanhas_email (titulo, assunto, conteudo_html, filtro_etapa_id) VALUES ($1, $2, $3, $4) RETURNING id",
        [data.titulo, data.assunto, data.conteudo_html, data.filtro_etapa_id]
      );
      const campaignId = campaignRes.rows[0].id;

      // Add recipients to queue
      let query = "SELECT name, email FROM customers";
      const params = [];
      if (data.filtro_etapa_id) {
        query = `
          SELECT c.name, c.email 
          FROM customers c
          JOIN opportunities o ON c.id = o.customer_id
          WHERE o.stage_id = $1
        `;
        params.push(data.filtro_etapa_id);
      }

      const recipientsRes = await client.query(query, params);
      const recipients = recipientsRes.rows;

      for (const r of recipients) {
        if (r.email) {
          await client.query(
            "INSERT INTO fila_email (campanha_id, email_destinatario, nome_destinatario) VALUES ($1, $2, $3)",
            [campaignId, r.email, r.name]
          );
        }
      }

      // Update total recipients
      await client.query("UPDATE campanhas_email SET total_destinatarios = $1 WHERE id = $2",
        [recipients.length, campaignId]);

      await client.query('COMMIT');
      return campaignId;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async getPendingEmails(limit = 10) {
    const res = await pool.query(`
      SELECT f.*, c.assunto, c.conteudo_html 
      FROM fila_email f
      JOIN campanhas_email c ON f.campanha_id = c.id
      WHERE f.status = 'pendente' 
      LIMIT $1
    `, [limit]);
    return res.rows;
  }

  static async updateEmailStatus(id: number, status: string, error?: string) {
    return pool.query("UPDATE fila_email SET status = $1, erro_mensagem = $2, tentativas = tentativas + 1 WHERE id = $3",
      [status, error || null, id]);
  }

  static async incrementSentCount(campaignId: number) {
    return pool.query("UPDATE campanhas_email SET enviados = enviados + 1, status = 'enviando' WHERE id = $1",
      [campaignId]);
  }

  static async checkCampaignCompletion(campaignId: number) {
    const res = await pool.query("SELECT total_destinatarios, enviados FROM campanhas_email WHERE id = $1", [campaignId]);
    const stats = res.rows[0];
    if (stats && stats.enviados >= stats.total_destinatarios) {
      await pool.query("UPDATE campanhas_email SET status = 'concluido' WHERE id = $1", [campaignId]);
    }
  }
}

export class ReportRepository {
  static async getLossReasons() {
    const res = await pool.query(`
      SELECT lr.description as name, COUNT(o.id) as value
      FROM opportunities o
      JOIN loss_reasons lr ON o.loss_reason_id = lr.id
      WHERE o.status = 'lost'
      GROUP BY lr.description
    `);
    return res.rows;
  }

  static async getConversionBySeller() {
    const res = await pool.query(`
      SELECT u.name, 
             COUNT(CASE WHEN o.status = 'won' THEN 1 END) as won,
             COUNT(o.id) as total,
             CAST(COUNT(CASE WHEN o.status = 'won' THEN 1 END) AS FLOAT) / NULLIF(COUNT(o.id), 0) * 100 as rate
      FROM users u
      LEFT JOIN opportunities o ON u.id = o.owner_id
      GROUP BY u.id, u.name
      HAVING COUNT(o.id) > 0
      ORDER BY rate DESC
    `);
    return res.rows;
  }

  static async getAverageClosingTime() {
    const res = await pool.query(`
      SELECT AVG(EXTRACT(EPOCH FROM (closed_at - created_at)) / 86400) as avg_days
      FROM opportunities
      WHERE status = 'won' AND closed_at IS NOT NULL
    `);
    return res.rows[0];
  }

  static async getRevenueByMonth() {
    const res = await pool.query(`
      SELECT to_char(closed_at, 'YYYY-MM') as month, SUM(value) as total
      FROM opportunities
      WHERE status = 'won' AND closed_at IS NOT NULL
      GROUP BY month
      ORDER BY month ASC
      LIMIT 12
    `);
    return res.rows;
  }

  static async getLeadsByOrigin() {
    const res = await pool.query(`
      SELECT o.name, COUNT(c.id) as value
      FROM origins o
      LEFT JOIN customers c ON o.id = c.origin_id
      GROUP BY o.name
      ORDER BY value DESC
    `);
    return res.rows;
  }

  static async getProductPerformance() {
    const res = await pool.query(`
      SELECT p.nome as name, COUNT(oi.id) as sales, SUM(oi.preco_venda * oi.quantidade) as revenue
      FROM produtos p
      JOIN oportunidade_itens oi ON p.id = oi.produto_id
      JOIN opportunities o ON oi.oportunidade_id = o.id
      WHERE o.status = 'won'
      GROUP BY p.nome
      ORDER BY revenue DESC
      LIMIT 10
    `);
    return res.rows;
  }

  static async getAdvancedStats() {
    const revenueRes = await pool.query("SELECT COALESCE(SUM(value), 0) as total FROM opportunities WHERE status = 'won'");
    const totalOppsRes = await pool.query("SELECT COUNT(*) as count FROM opportunities");
    const wonOppsRes = await pool.query("SELECT COUNT(*) as count FROM opportunities WHERE status = 'won'");
    const totalLeadsRes = await pool.query("SELECT COUNT(*) as count FROM customers");
    const avgTicketRes = await pool.query("SELECT COALESCE(AVG(value), 0) as avg FROM opportunities WHERE status = 'won'");

    const revenue = revenueRes.rows[0];
    const totalOpps = totalOppsRes.rows[0];
    const wonOpps = wonOppsRes.rows[0];
    const totalLeads = totalLeadsRes.rows[0];
    const avgTicket = avgTicketRes.rows[0];

    return {
      total_revenue: parseFloat(revenue.total),
      total_opportunities: parseInt(totalOpps.count),
      won_opportunities: parseInt(wonOpps.count),
      conversion_rate: totalOpps.count > 0 ? (wonOpps.count / totalOpps.count) * 100 : 0,
      total_leads: parseInt(totalLeads.count),
      average_ticket: parseFloat(avgTicket.avg)
    };
  }
}

export class WorkflowRepository {
  static async list() {
    const res = await pool.query("SELECT * FROM workflows ORDER BY created_at DESC");
    return res.rows;
  }
  static async create(data: any) {
    const res = await pool.query("INSERT INTO workflows (name, trigger_event, active) VALUES ($1, $2, $3) RETURNING id", [data.name, data.trigger_event, data.active ? true : false]);
    return res.rows[0].id;
  }
  static async addAction(workflowId: number, data: any) {
    return pool.query("INSERT INTO workflow_actions (workflow_id, type, config) VALUES ($1, $2, $3)", [workflowId, data.type, JSON.stringify(data.config)]);
  }
}

export class CommunicationRepository {
  static async listByCustomer(customerId: number) {
    const res = await pool.query("SELECT * FROM communication_logs WHERE customer_id = $1 ORDER BY created_at DESC", [customerId]);
    return res.rows;
  }
  static async log(data: any) {
    return pool.query("INSERT INTO communication_logs (customer_id, type, direction, content, status) VALUES ($1, $2, $3, $4, $5)",
      [data.customer_id, data.type, data.direction, data.content, data.status]);
  }
}

export class LeadScoringRepository {
  static async listRules() {
    const res = await pool.query("SELECT * FROM lead_scoring_rules");
    return res.rows;
  }
  static async createRule(data: any) {
    return pool.query("INSERT INTO lead_scoring_rules (name, criteria, points) VALUES ($1, $2, $3)", [data.name, data.criteria, data.points]);
  }
}

export class DocumentRepository {
  static async list(filters: { opportunity_id?: number; customer_id?: number; category?: string } = {}) {
    let query = `
      SELECT d.*, c.name as customer_name 
      FROM documents d 
      LEFT JOIN customers c ON d.customer_id = c.id 
      WHERE 1=1
    `;
    const params = [];
    if (filters.opportunity_id) {
      params.push(filters.opportunity_id);
      query += ` AND d.opportunity_id = $${params.length}`;
    }
    if (filters.customer_id) {
      params.push(filters.customer_id);
      query += ` AND d.customer_id = $${params.length}`;
    }
    if (filters.category) {
      params.push(filters.category);
      query += ` AND d.category = $${params.length}`;
    }
    const res = await pool.query(query, params);
    return res.rows;
  }
  static async create(data: any) {
    return pool.query("INSERT INTO documents (opportunity_id, customer_id, name, file_path, type, category, status) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        data.opportunity_id || null, 
        data.customer_id || null, 
        data.name, 
        data.file_path, 
        data.type,
        data.category || 'Empresa',
        data.status || 'Finalizada'
      ]);
  }
}
