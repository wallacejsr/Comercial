import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pool from "./server/db"; // Initialize DB
import { OpportunityRepository, FunnelRepository, UserRepository, CustomerRepository, GoalRepository, TaskRepository, ProductRepository, OpportunityItemRepository, SettingRepository, CustomFieldRepository, ReportRepository, EmailRepository, WorkflowRepository, CommunicationRepository, LeadScoringRepository, DocumentRepository } from "./server/repositories";
import { authenticateToken, generateToken, comparePassword, hashPassword, checkRole } from "./server/auth";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Email Transporter (Mock or real SMTP)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "mock_user",
    pass: process.env.SMTP_PASS || "mock_pass",
  },
});

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Request logging for debugging
  app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
      console.log(`${req.method} ${req.url}`);
    }
    next();
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Email Marketing Routes
  app.get("/api/email/campaigns", authenticateToken, async (req, res) => {
    res.json(await EmailRepository.listCampaigns());
  });

  app.post("/api/email/campaigns", authenticateToken, async (req, res) => {
    const campaignId = await EmailRepository.createCampaign(req.body);
    res.json({ success: true, campaignId });
  });

  // Background Worker for Email Queue
  setInterval(async () => {
    const pending = await EmailRepository.getPendingEmails(5); // Send 5 at a time
    if (pending.length === 0) return;

    console.log(`Processing ${pending.length} emails from queue...`);

    for (const item of pending) {
      try {
        // In a real scenario, we'd use the actual SMTP
        // For demo, we just simulate success
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        await EmailRepository.updateEmailStatus(item.id, 'enviado');
        await EmailRepository.incrementSentCount(item.campanha_id);
        await EmailRepository.checkCampaignCompletion(item.campanha_id);
      } catch (err: any) {
        console.error(`Failed to send email to ${item.email_destinatario}:`, err);
        await EmailRepository.updateEmailStatus(item.id, 'erro', err.message);
      }
    }
  }, 10000); // Check every 10 seconds for demo purposes

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await UserRepository.findByEmail(email);
    if (!user || !(await comparePassword(password, user.password!))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  });

  // External Lead Entry (Webhook)
  app.post("/api/webhooks/leads", async (req, res) => {
    try {
      const { name, company, email, phone, whatsapp, origin_id } = req.body;
      const customerId = await CustomerRepository.create({ name, company, email, phone, whatsapp, origin_id: origin_id || 1 });
      
      // Automatically create an opportunity for the new lead
      const users = await UserRepository.list();
      const admin = users.find(u => u.role === 'admin');
      await pool.query("INSERT INTO opportunities (customer_id, stage_id, owner_id, value) VALUES ($1, $2, $3, $4)",
        [customerId, 1, admin?.id || 1, 0]);
        
      res.json({ success: true, customerId });
    } catch (err) {
      res.status(500).json({ error: "Failed to process external lead" });
    }
  });

  // WhatsApp Webhook
  app.post("/api/webhooks/whatsapp", async (req, res) => {
    try {
      const { from, text } = req.body;
      
      if (!from || !text) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      // Find or create customer
      let customer = await CustomerRepository.findByPhone(from) as any;
      let customerId: number;

      if (!customer) {
        customerId = await CustomerRepository.create({
          name: `WhatsApp ${from}`,
          whatsapp: from,
          origin_id: 1 // Default origin
        }) as number;
      } else {
        customerId = customer.id;
      }

      // Log communication
      await CommunicationRepository.log({
        customer_id: customerId,
        type: 'whatsapp',
        direction: 'inbound',
        content: text,
        status: 'received'
      });

      res.json({ success: true });
    } catch (err) {
      console.error("WhatsApp Webhook Error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Seed Data
  const usersList = await UserRepository.list();
  if (usersList.length === 0) {
    const hashedPassword = await hashPassword("admin123");
    const adminId = await UserRepository.create({
      name: "Admin User",
      email: "admin@crm.com",
      password: hashedPassword,
      role: "admin"
    });
    
    // Seed Customers
    const customers = [
      { 
        name: "João Silva", 
        company: "Tech Solutions", 
        email: "joao@tech.com", 
        origin_id: 1,
        grupo: "Agronegócio",
        producao: "Mista",
        cidade: "Ribeirão Preto",
        uf: "SP",
        responsavel: "João Silva",
        cargo: "Diretor Comercial",
        ligacao_realizada: "Sim",
        virou_agenda: "Sim",
        empresa_homologada: "Não",
        data_follow_up: "2026-03-01",
        status_follow_up: "Pendente",
        notes: "Interessado em expansão de frota."
      },
      { name: "Maria Oliveira", company: "Global Corp", email: "maria@global.com", origin_id: 2 },
      { name: "Carlos Souza", company: "Inova Soft", email: "carlos@inova.com", origin_id: 3 },
      { name: "Ana Costa", company: "Retail Plus", email: "ana@retail.com", origin_id: 1 },
    ];
    
    const customerIds = [];
    for (const c of customers) {
      customerIds.push(await CustomerRepository.create(c));
    }

    // Seed Opportunities
    const opps = [
      { customer_id: customerIds[0], stage_id: 1, owner_id: adminId, value: 15000, forecast_date: '2026-03-15' },
      { customer_id: customerIds[1], stage_id: 2, owner_id: adminId, value: 45000, forecast_date: '2026-04-10' },
      { customer_id: customerIds[2], stage_id: 3, owner_id: adminId, value: 12000, forecast_date: '2026-03-20' },
      { customer_id: customerIds[3], stage_id: 1, owner_id: adminId, value: 8000, forecast_date: '2026-03-05' },
    ];

    for (const o of opps) {
      await pool.query("INSERT INTO opportunities (customer_id, stage_id, owner_id, value, forecast_date) VALUES ($1, $2, $3, $4, $5)",
        [o.customer_id, o.stage_id, o.owner_id, o.value, o.forecast_date]);
    }

    // Seed Goals
    await GoalRepository.upsert({ user_id: adminId, reference_month: '2026-02', target_value: 100000 });

    // Seed Products
    await ProductRepository.create({ nome: 'Software CRM', descricao: 'Licença anual', preco_unitario: 5000, categoria: 'Software' });
    await ProductRepository.create({ nome: 'Consultoria', descricao: 'Implementação', preco_unitario: 2000, categoria: 'Serviço' });

    // Seed Workflows
    await WorkflowRepository.create({ name: 'Novo Lead - Boas Vindas', trigger_event: 'lead_created', active: 1 });
    
    // Seed Lead Scoring
    await LeadScoringRepository.createRule({ name: 'Origem: Tráfego Pago', criteria: 'origin:Paid Traffic', points: 50 });
    await LeadScoringRepository.createRule({ name: 'Empresa Preenchida', criteria: 'company:exists', points: 20 });

    console.log("Seed data created successfully.");
  } else {
    // Migration: Update old admin email if it exists
    await pool.query("UPDATE users SET email = 'admin@crm.com' WHERE email = 'admin@nexus.com'");
  }

  // Database Migrations
  try {
    await pool.query("ALTER TABLE customers ADD COLUMN owner_id INTEGER REFERENCES users(id)");
    console.log("Added owner_id column to customers table");
  } catch (e) {
    // Column already exists
  }

  // Ensure admin user exists and has correct role
  const adminUser = await UserRepository.findByEmail('admin@nexus.com') || await UserRepository.findByEmail('admin@crm.com');
  if (adminUser && adminUser.role !== 'admin') {
    await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [adminUser.id]);
  }

  // Protected Routes
  app.get("/api/dashboard/stats", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    const userId = user.role === 'seller' ? user.id : undefined;
    res.json(await OpportunityRepository.getStats(userId));
  });

  // Users Management (Admin Only)
  app.get("/api/users", authenticateToken, checkRole(['admin']), async (req, res) => {
    res.json(await UserRepository.list());
  });

  app.post("/api/users", authenticateToken, checkRole(['admin']), async (req, res) => {
    try {
      const { name, email, role, password } = req.body;
      const hashedPassword = await hashPassword(password || "123456");
      const userId = await UserRepository.create({ name, email, role, password: hashedPassword, active: true });
      res.json({ success: true, id: userId });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id", authenticateToken, checkRole(['admin']), async (req, res) => {
    await UserRepository.update(Number(req.params.id), req.body);
    res.json({ success: true });
  });

  app.delete("/api/users/:id", authenticateToken, checkRole(['admin']), async (req, res) => {
    await UserRepository.delete(Number(req.params.id));
    res.json({ success: true });
  });

  // Tasks
  app.get("/api/tasks", authenticateToken, async (req, res) => {
    const { status } = req.query;
    const user = (req as any).user;
    // Sellers only see their own tasks
    const userId = user.role === 'seller' ? user.id : undefined;
    res.json(await TaskRepository.list({ status: status as string, userId }));
  });

  app.post("/api/tasks", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    await TaskRepository.create({ ...req.body, usuario_id: user.id });
    res.json({ success: true });
  });

  app.patch("/api/tasks/:id/toggle", authenticateToken, async (req, res) => {
    await TaskRepository.toggleComplete(Number(req.params.id));
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", authenticateToken, async (req, res) => {
    res.json(await ProductRepository.list());
  });

  app.post("/api/products", authenticateToken, async (req, res) => {
    await ProductRepository.create(req.body);
    res.json({ success: true });
  });

  // Reports
  app.get("/api/reports/loss-reasons", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getLossReasons());
  });

  app.get("/api/reports/seller-conversion", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getConversionBySeller());
  });

  app.get("/api/reports/avg-closing-time", authenticateToken, async (req, res) => {
    const result = await ReportRepository.getAverageClosingTime();
    res.json(result || { avg_days: 0 });
  });

  app.get("/api/reports/revenue-monthly", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getRevenueByMonth());
  });

  app.get("/api/reports/leads-by-origin", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getLeadsByOrigin());
  });

  app.get("/api/reports/product-performance", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getProductPerformance());
  });

  app.get("/api/reports/advanced-stats", authenticateToken, async (req, res) => {
    res.json(await ReportRepository.getAdvancedStats());
  });

  // Settings & Customization
  app.get("/api/settings/:key", authenticateToken, async (req, res) => {
    const result = await SettingRepository.get(req.params.key);
    res.json(result || { valor: null });
  });

  app.post("/api/settings", authenticateToken, async (req, res) => {
    const { key, value } = req.body;
    await SettingRepository.set(key, value);
    res.json({ success: true });
  });

  app.get("/api/custom-fields/:entity", authenticateToken, async (req, res) => {
    res.json(await CustomFieldRepository.list(req.params.entity));
  });

  app.post("/api/custom-fields", authenticateToken, async (req, res) => {
    await CustomFieldRepository.create(req.body);
    res.json({ success: true });
  });

  app.get("/api/funnel/stages", authenticateToken, async (req, res) => {
    res.json(await FunnelRepository.listStages());
  });

  app.get("/api/opportunities", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    const filters: any = {};
    if (user.role === 'seller') {
      filters.owner_id = user.id;
    }
    res.json(await OpportunityRepository.list(filters));
  });

  app.get("/api/leads", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    const filters: any = {};
    if (user.role === 'seller') {
      filters.ownerId = user.id;
    }
    res.json(await CustomerRepository.list(filters));
  });

  app.post("/api/leads", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    const data = { ...req.body };
    if (user.role === 'seller' && !data.owner_id) {
      data.owner_id = user.id;
    }
    const id = await CustomerRepository.create(data);
    res.json({ id });
  });

  app.patch("/api/leads/:id", authenticateToken, async (req, res) => {
    await CustomerRepository.update(Number(req.params.id), req.body);
    res.json({ success: true });
  });

  app.get("/api/goals", authenticateToken, async (req, res) => {
    const user = (req as any).user;
    if (user.role === 'seller') {
      res.json(await GoalRepository.list(user.id));
    } else {
      res.json(await GoalRepository.list());
    }
  });

  app.patch("/api/opportunities/:id/stage", authenticateToken, async (req, res) => {
    const { stage_id } = req.body;
    await OpportunityRepository.updateStage(Number(req.params.id), stage_id);
    res.json({ success: true });
  });

  app.patch("/api/opportunities/:id/status", authenticateToken, async (req, res) => {
    const { status, loss_reason_id } = req.body;
    await OpportunityRepository.updateStatus(Number(req.params.id), status, loss_reason_id);
    res.json({ success: true });
  });

  // Workflows
  app.get("/api/workflows", authenticateToken, async (req, res) => {
    res.json(await WorkflowRepository.list());
  });
  app.post("/api/workflows", authenticateToken, async (req, res) => {
    const id = await WorkflowRepository.create(req.body);
    res.json({ success: true, id });
  });

  // Communication Logs
  app.get("/api/communication/:customerId", authenticateToken, async (req, res) => {
    res.json(await CommunicationRepository.listByCustomer(Number(req.params.customerId)));
  });
  app.post("/api/communication", authenticateToken, async (req, res) => {
    await CommunicationRepository.log(req.body);
    res.json({ success: true });
  });

  // Lead Scoring
  app.get("/api/lead-scoring/rules", authenticateToken, async (req, res) => {
    res.json(await LeadScoringRepository.listRules());
  });

  // Documents
  app.get("/api/documents", authenticateToken, async (req, res) => {
    const { opportunity_id, customer_id, category } = req.query;
    res.json(await DocumentRepository.list({ 
      opportunity_id: opportunity_id ? Number(opportunity_id) : undefined,
      customer_id: customer_id ? Number(customer_id) : undefined,
      category: category as string
    }));
  });
  app.post("/api/documents", authenticateToken, async (req, res) => {
    await DocumentRepository.create(req.body);
    res.json({ success: true });
  });

  // AI Insights
  app.post("/api/ai/insights", authenticateToken, async (req, res) => {
    const { prompt, context } = req.body;
    try {
      const settings = await SettingRepository.get('gemini_api_key');
      const apiKey = settings?.valor || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API Key do Gemini não configurada nas configurações do sistema.");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é um assistente comercial especialista. Analise os seguintes dados do CRM e forneça insights estratégicos: ${JSON.stringify(context)}. Pergunta do usuário: ${prompt}`,
      });
      res.json({ insight: response.text });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 404 for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
