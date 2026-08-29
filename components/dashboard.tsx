"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, Bot, Check, CheckCircle2, ChevronDown,
  ChevronRight, CircleGauge, ClipboardCheck, Clock3, Database, FileCheck2, FileText,
  Fingerprint, Gauge, History, LayoutDashboard, Loader2, LockKeyhole, Menu, MessageSquareText,
  Plus, RefreshCw, Search, Send, ShieldCheck, SlidersHorizontal, Sparkles, Upload, UserCheck,
  Users, X, XCircle,
} from "lucide-react";
import type { BootstrapSnapshot } from "@/lib/bootstrap";
import type { AuditEvent, ClaimAnswer, GovernanceProposal, RiskCase, RiskStatus, Role } from "@/lib/types";

type View = "overview" | "claims" | "risk" | "knowledge" | "governance" | "audit";

type BootstrapData = BootstrapSnapshot;

const navItems: Array<{ id: View; label: string; icon: typeof Activity }> = [
  { id: "overview", label: "运行总览", icon: LayoutDashboard },
  { id: "claims", label: "理赔 Copilot", icon: MessageSquareText },
  { id: "risk", label: "风险案件", icon: ShieldCheck },
  { id: "knowledge", label: "知识库", icon: BookOpen },
  { id: "governance", label: "治理审批", icon: FileCheck2 },
  { id: "audit", label: "审计日志", icon: History },
];

const roleProfiles: Record<Role, { name: string; label: string }> = {
  advisor: { name: "顾问演示账号", label: "保险顾问" },
  developer: { name: "张凯文", label: "AI 开发人员" },
  compliance: { name: "林慧敏", label: "合规复核员" },
  admin: { name: "陈志豪", label: "系统管理员" },
};

export function Dashboard({ initialData }: { initialData: BootstrapData }) {
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<BootstrapData>(initialData);
  const [mobileNav, setMobileNav] = useState(false);
  const [role, setRole] = useState<Role>("developer");

  const refresh = async () => {
    const response = await fetch("/api/bootstrap", { cache: "no-store" });
    setData(await response.json());
  };

  const title = navItems.find((item) => item.id === view)?.label ?? "运行总览";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Fingerprint size={23} /></div>
          <div><strong>Broker AI</strong><span>CONTROL ROOM</span></div>
          <button className="mobile-close" onClick={() => setMobileNav(false)} aria-label="关闭菜单"><X size={20} /></button>
        </div>
        <nav>
          <p className="nav-eyebrow">工作空间</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => { setView(item.id); setMobileNav(false); }}>
                <Icon size={18} /><span>{item.label}</span>
                {item.id === "risk" && data.stats.highRisk > 0 && <em>{data.stats.highRisk}</em>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="governance-card">
          <div className="governance-icon"><LockKeyhole size={18} /></div>
          <div><strong>人工监督已启用</strong><span>关键决定须经授权人员确认</span></div>
        </div>
        <div className="profile">
          <div className="avatar">{roleProfiles[role].name.slice(0, 1)}</div>
          <div><strong>{roleProfiles[role].name}</strong><span>{roleProfiles[role].label}</span></div>
          <ChevronDown size={16} />
        </div>
      </aside>

      {mobileNav && <button className="scrim" onClick={() => setMobileNav(false)} aria-label="关闭菜单" />}

      <main className="main">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)} aria-label="打开菜单"><Menu size={21} /></button>
          <div><p>智能运营中心</p><h1>{title}</h1></div>
          <div className="topbar-actions">
            <label className="role-switch"><UserCheck size={15} /><select value={role} onChange={(event) => setRole(event.target.value as Role)}><option value="developer">开发人员</option><option value="compliance">合规复核员</option><option value="admin">管理员</option><option value="advisor">保险顾问</option></select></label>
            <div className={`mode-pill ${data.mode}`}><span />{data.mode === "model" ? "模型在线" : "安全演示模式"}</div>
            <button className="icon-button" onClick={() => refresh()} title="刷新"><RefreshCw size={17} /></button>
          </div>
        </header>

        <div className="page">
          {view === "overview" && <Overview data={data} onNavigate={setView} onRefresh={refresh} />}
          {view === "claims" && <Claims data={data} onRefresh={refresh} />}
          {view === "risk" && <RiskReview data={data} onRefresh={refresh} />}
          {view === "knowledge" && <Knowledge data={data} onNavigate={setView} />}
          {view === "governance" && <GovernanceApprovals data={data} role={role} onRefresh={refresh} />}
          {view === "audit" && <AuditLog events={data.audit} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ data, onNavigate, onRefresh }: { data: BootstrapData; onNavigate: (view: View) => void; onRefresh: () => Promise<void> }) {
  const [scanning, setScanning] = useState(false);
  const runScan = async () => {
    setScanning(true);
    await fetch("/api/risk/analyze", { method: "POST" });
    await onRefresh();
    setScanning(false);
  };
  const maxRule = Math.max(1, ...data.rules.map((rule) => data.riskCases.filter((item) => item.evidence.some((e) => e.ruleId === rule.id)).length));
  const recentCases = data.riskCases.slice(0, 4);
  return (
    <div className="stack-xl">
      <section className="hero">
        <div>
          <div className="eyebrow"><Sparkles size={14} /> RESPONSIBLE AI OPERATIONS</div>
          <h2>让每一次判断都有依据，<br /><span>让每一个风险都被看见。</span></h2>
          <p>以可解释的 AI 辅助理赔沟通和中介风险审查。模型提供建议，人始终保有最终决定权。</p>
          <div className="hero-actions">
            <button className="primary" onClick={() => onNavigate("claims")}><MessageSquareText size={17} />开始理赔咨询</button>
            <button className="secondary" onClick={runScan} disabled={scanning}>{scanning ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}运行风险扫描</button>
          </div>
        </div>
        <div className="trust-visual">
          <div className="orbit orbit-a" /><div className="orbit orbit-b" />
          <div className="trust-core"><ShieldCheck size={40} /><strong>HUMAN</strong><span>IN CONTROL</span></div>
          <div className="trust-tag tag-a"><CheckCircle2 size={14} />有据可查</div>
          <div className="trust-tag tag-b"><UserCheck size={14} />人工复核</div>
          <div className="trust-tag tag-c"><LockKeyhole size={14} />审计留痕</div>
        </div>
      </section>

      <section className="stats-grid">
        <StatCard label="监测中介" value={data.stats.brokers} suffix="名" icon={Users} tone="blue" foot="全量合成数据" />
        <StatCard label="待复核案件" value={data.stats.openCases} suffix="宗" icon={ClipboardCheck} tone="amber" foot={`${data.stats.highRisk} 宗高风险`} />
        <StatCard label="已索引文档" value={data.stats.documents} suffix="份" icon={Database} tone="green" foot="条款级引用" />
        <StatCard label="理赔草稿" value={data.stats.claims} suffix="次" icon={Bot} tone="purple" foot="全部需人工批准" />
      </section>

      <div className="two-column">
        <section className="panel">
          <PanelHeader title="优先审查案件" subtitle="按可解释风险分数排序" action="查看全部" onAction={() => onNavigate("risk")} />
          <div className="case-list compact">
            {recentCases.map((item) => <CaseRow key={item.id} item={item} onClick={() => onNavigate("risk")} />)}
          </div>
        </section>
        <section className="panel">
          <PanelHeader title="预警信号分布" subtitle="当前扫描命中的规则" />
          <div className="rule-bars">
            {data.rules.slice(0, 5).map((rule) => {
              const count = data.riskCases.filter((item) => item.evidence.some((e) => e.ruleId === rule.id)).length;
              return <div className="rule-bar" key={rule.id}><div><span>{rule.name}</span><b>{count}</b></div><div className="bar-track"><i style={{ width: `${Math.max(6, count / maxRule * 100)}%` }} /></div></div>;
            })}
          </div>
        </section>
      </div>

      <section className="principles">
        <div><ShieldCheck size={20} /><strong>负责任 AI 设计</strong></div>
        <p>系统不会自动判赔、拒赔或认定欺诈。引用校验、确定性规则、角色权限和完整审计共同构成安全边界。</p>
        <button onClick={() => onNavigate("audit")}>查看治理记录 <ArrowRight size={15} /></button>
      </section>
    </div>
  );
}

function StatCard({ label, value, suffix, icon: Icon, tone, foot }: { label: string; value: number; suffix: string; icon: typeof Activity; tone: string; foot: string }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={20} /></div><span>{label}</span><div className="stat-value">{value}<small>{suffix}</small></div><p><span className="status-dot" />{foot}</p></article>;
}

function Claims({ data, onRefresh }: { data: BootstrapData; onRefresh: () => Promise<void> }) {
  const [question, setQuestion] = useState("客户投保两周后因意外住院，是否还在等待期？需要准备哪些资料？");
  const [context, setContext] = useState("保单生效日：2026-08-10；意外跌倒入院：2026-08-24；保单状态有效。");
  const [answer, setAnswer] = useState<ClaimAnswer | null>(data.claims[0] ?? null);
  const [editable, setEditable] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const ask = async () => {
    setSending(true); setError("");
    const response = await fetch("/api/claims/query", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, caseContext: context }) });
    const body = await response.json();
    if (!response.ok) setError(body.error || "生成失败");
    else { setAnswer(body); setEditable(body.answer); await onRefresh(); }
    setSending(false);
  };

  const approve = async () => {
    if (!answer) return;
    const response = await fetch(`/api/claims/${answer.id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ answer: editable || answer.answer }) });
    if (response.ok) { setAnswer(await response.json()); await onRefresh(); }
  };

  useEffect(() => { if (answer) setEditable(answer.answer); }, [answer?.id]);

  return (
    <div className="claims-layout">
      <section className="claim-workbench">
        <div className="section-intro">
          <div><div className="eyebrow"><Bot size={14} /> ADVISOR COPILOT</div><h2>理赔咨询工作台</h2><p>生成清晰、有出处的答复草稿。发送给客户前必须由顾问确认。</p></div>
          <div className="safe-badge"><ShieldCheck size={16} />人工确认后生效</div>
        </div>
        <div className="form-card">
          <label>客户问题<span>必填</span></label>
          <textarea value={question} onChange={(event) => setQuestion(event.target.value)} rows={3} placeholder="输入客户的理赔问题…" />
          <label>案件背景<span>可选</span></label>
          <textarea value={context} onChange={(event) => setContext(event.target.value)} rows={3} placeholder="保单生效日、事故日期、诊断等…" />
          <div className="suggestions">
            <span>示例：</span>
            {["理赔需要什么材料？", "普通案件多久完成审核？", "既往症是否可以赔？"].map((text) => <button key={text} onClick={() => setQuestion(text)}>{text}</button>)}
          </div>
          {error && <div className="inline-error"><AlertTriangle size={15} />{error}</div>}
          <button className="primary wide" onClick={ask} disabled={sending || question.trim().length < 4}>{sending ? <><Loader2 className="spin" size={17} />正在检索条款并生成…</> : <><Send size={17} />生成带依据的答复</>}</button>
        </div>

        <div className="boundary-note"><LockKeyhole size={16} /><div><strong>安全边界</strong><p>系统只能依据已索引条款回答；资料不足或涉及免责时会自动建议升级人工。</p></div></div>
      </section>

      <section className="answer-pane">
        {!answer ? <EmptyAnswer /> : (
          <div className="answer-card">
            <div className="answer-head">
              <div><div className="ai-mark"><Sparkles size={17} /></div><div><span>AI 答复草稿</span><small>{answer.provider === "model" ? "模型生成" : "确定性演示"} · {new Date(answer.createdAt).toLocaleTimeString("zh-HK", { hour: "2-digit", minute: "2-digit" })}</small></div></div>
              <Confidence value={answer.confidence} />
            </div>
            {answer.status === "approved" && <div className="approved-banner"><CheckCircle2 size={17} />已由顾问人工复核并批准</div>}
            <div className="answer-block">
              <div className="block-label"><MessageSquareText size={15} />建议答复</div>
              <textarea className="answer-editor" value={editable} onChange={(event) => setEditable(event.target.value)} rows={6} disabled={answer.status === "approved"} />
            </div>
            {answer.escalationReason && <div className="escalation"><AlertTriangle size={16} /><div><strong>建议升级人工</strong><p>{answer.escalationReason}</p></div></div>}
            <div className="answer-grid">
              <AnswerList title="所需材料" icon={FileCheck2} items={answer.requiredDocuments} />
              <AnswerList title="下一步" icon={ArrowRight} items={answer.nextSteps} numbered />
            </div>
            <div className="citations">
              <div className="block-label"><BookOpen size={15} />引用依据 <span>{answer.citations.length}</span></div>
              {answer.citations.length === 0 ? <p className="muted">未检索到可引用条款。</p> : answer.citations.map((citation, index) => (
                <details key={`${citation.chunkId}-${index}`} open={index === 0}>
                  <summary><span>[{index + 1}] {citation.documentName}</span><ChevronDown size={15} /></summary>
                  <div><b>{citation.clause} · 第 {citation.page} 页</b><p>“{citation.quote}”</p></div>
                </details>
              ))}
            </div>
            <div className="approval-row">
              <div><UserCheck size={17} /><span>批准即代表你已核对内容与引用</span></div>
              <button className="primary" onClick={approve} disabled={answer.status === "approved"}>{answer.status === "approved" ? <><Check size={17} />已批准</> : <><UserCheck size={17} />人工复核并批准</>}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyAnswer() {
  return <div className="empty-answer"><div><Sparkles size={30} /></div><h3>答案将在这里生成</h3><p>系统会检索相关条款，生成带原文引用的答复草稿。</p><ul><li><Check size={14} />逐条引用来源</li><li><Check size={14} />明确材料与下一步</li><li><Check size={14} />低置信度自动升级</li></ul></div>;
}

function AnswerList({ title, icon: Icon, items, numbered = false }: { title: string; icon: typeof Activity; items: string[]; numbered?: boolean }) {
  return <div className="answer-list"><div className="block-label"><Icon size={15} />{title}</div>{items.map((item, index) => <p key={item}><i>{numbered ? index + 1 : <Check size={11} />}</i>{item}</p>)}</div>;
}

function Confidence({ value }: { value: ClaimAnswer["confidence"] }) {
  const map = { high: "高置信度", medium: "中等置信度", low: "低置信度" };
  return <div className={`confidence ${value}`}><span />{map[value]}</div>;
}

function RiskReview({ data, onRefresh }: { data: BootstrapData; onRefresh: () => Promise<void> }) {
  const [selected, setSelected] = useState<RiskCase | null>(data.riskCases[0] ?? null);
  const [filter, setFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState(selected?.reviewerNote ?? "");
  const [scanning, setScanning] = useState(false);
  const filtered = data.riskCases.filter((item) => (filter === "all" || item.level === filter) && `${item.id}${item.broker.name}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => { if (selected) setNote(selected.reviewerNote); }, [selected?.id]);

  const scan = async () => { setScanning(true); await fetch("/api/risk/analyze", { method: "POST" }); await onRefresh(); setScanning(false); };
  const update = async (status: RiskStatus) => {
    if (!selected) return;
    const response = await fetch(`/api/risk-cases/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, reviewerNote: note }) });
    if (response.ok) { const item = await response.json(); setSelected(item); await onRefresh(); }
  };

  return (
    <div className="stack-lg">
      <div className="section-intro risk-intro">
        <div><div className="eyebrow"><CircleGauge size={14} /> INTERMEDIARY RISK REVIEW</div><h2>中介风险案件</h2><p>规则发现异常模式，AI 整理证据；合规人员决定是否需要调查。</p></div>
        <button className="primary" onClick={scan} disabled={scanning}>{scanning ? <Loader2 className="spin" size={17} /> : <RefreshCw size={17} />}重新扫描</button>
      </div>
      <div className="risk-summary">
        <div><span>扫描范围</span><b>100</b><small>名中介</small></div>
        <div><span>合成交易</span><b>500</b><small>条记录</small></div>
        <div><span>高风险</span><b className="red">{data.riskCases.filter((item) => item.level === "high").length}</b><small>需优先复核</small></div>
        <div><span>规则命中</span><b>{data.rules.length}</b><small>项可解释规则</small></div>
      </div>
      <div className="risk-workspace">
        <section className="risk-queue panel">
          <div className="queue-tools">
            <div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索案件或中介" /></div>
            <div className="filter-tabs">{(["all", "high", "medium", "low"] as const).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{({ all: "全部", high: "高", medium: "中", low: "低" })[item]}</button>)}</div>
          </div>
          <div className="queue-count">{filtered.length} 宗案件 <span>按风险分数排序</span></div>
          <div className="case-list">
            {filtered.map((item) => <CaseRow key={item.id} item={item} active={selected?.id === item.id} onClick={() => setSelected(item)} />)}
          </div>
        </section>
        <section className="case-detail panel">
          {selected ? <RiskDetail item={selected} note={note} setNote={setNote} onUpdate={update} /> : <div className="empty-detail">请选择一个案件</div>}
        </section>
      </div>
    </div>
  );
}

function CaseRow({ item, active, onClick }: { item: RiskCase; active?: boolean; onClick: () => void }) {
  const statusLabel: Record<RiskStatus, string> = { pending: "待复核", investigating: "调查中", confirmed: "已确认", false_positive: "误报", closed: "已关闭" };
  return (
    <button className={`case-row ${active ? "selected" : ""}`} onClick={onClick}>
      <div className={`score-ring ${item.level}`}>{item.score}</div>
      <div className="case-main"><div><strong>{item.broker.name}</strong><span>{item.id}</span></div><p>{item.evidence.slice(0, 2).map((e) => e.ruleName).join(" · ")}</p><small><span className={`level-dot ${item.level}`} />{statusLabel[item.status]} · {item.broker.region}</small></div>
      <ChevronRight size={16} />
    </button>
  );
}

function RiskDetail({ item, note, setNote, onUpdate }: { item: RiskCase; note: string; setNote: (value: string) => void; onUpdate: (status: RiskStatus) => void }) {
  return <div className="risk-detail-inner">
    <div className="detail-head">
      <div><span className={`risk-label ${item.level}`}>{item.level === "high" ? "高风险" : item.level === "medium" ? "中风险" : "低风险"}</span><h3>{item.broker.name}</h3><p>{item.id} · {item.broker.region} · {item.broker.clients} 名客户</p></div>
      <div className={`big-score ${item.level}`}><b>{item.score}</b><span>/ 100</span><small>规则风险分</small></div>
    </div>
    <div className="ai-summary"><div><Sparkles size={16} />AI 证据摘要</div><p>{item.summary}</p></div>
    <div className="evidence-list">
      <div className="block-label"><AlertTriangle size={15} />触发证据 <span>{item.evidence.length}</span></div>
      {item.evidence.map((evidence) => <div className="evidence" key={evidence.ruleId}><div><Fingerprint size={16} /></div><p><strong>{evidence.ruleName}</strong><span>{evidence.detail}</span></p><b>+{evidence.points}</b></div>)}
    </div>
    <div className="next-review"><div className="block-label"><ClipboardCheck size={15} />建议调查步骤</div>{item.nextSteps.map((step, index) => <p key={step}><i>{index + 1}</i>{step}</p>)}</div>
    <label className="review-note">复核意见<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} placeholder="记录核查结果、依据或后续安排…" /></label>
    <div className="review-actions">
      <button className="secondary" onClick={() => onUpdate("false_positive")}><XCircle size={16} />标记误报</button>
      <button className="secondary" onClick={() => onUpdate("investigating")}><Search size={16} />开始调查</button>
      <button className="danger-button" onClick={() => onUpdate("confirmed")}><AlertTriangle size={16} />确认风险</button>
    </div>
    <p className="decision-note"><LockKeyhole size={13} />系统只提供风险线索，不作欺诈认定。决定与意见将写入审计日志。</p>
  </div>;
}

function Knowledge({ data, onNavigate }: { data: BootstrapData; onNavigate: (view: View) => void }) {
  return <div className="stack-lg">
    <div className="section-intro"><div><div className="eyebrow"><BookOpen size={14} /> KNOWLEDGE GOVERNANCE</div><h2>理赔知识库</h2><p>只允许使用已审核、可追溯的条款生成客户答复。</p></div><button className="primary" onClick={() => onNavigate("governance")}><FileCheck2 size={17} />进入治理审批</button></div>
    <section className="knowledge-health">
      <div><Database size={23} /><p><strong>{data.documents.length}</strong><span>已审核文档</span></p></div>
      <div><FileText size={23} /><p><strong>{data.documents.reduce((sum, item) => sum + item.chunks, 0)}</strong><span>可检索条款片段</span></p></div>
      <div><Gauge size={23} /><p><strong>100%</strong><span>引用可追溯</span></p></div>
      <div><CheckCircle2 size={23} /><p><strong>正常</strong><span>索引运行状态</span></p></div>
    </section>
    <section className="panel document-panel">
      <PanelHeader title="文档清单" subtitle="上传、审核和索引状态" />
      <div className="table-wrap"><table><thead><tr><th>文档</th><th>类型</th><th>片段</th><th>状态</th><th>更新时间</th></tr></thead><tbody>{data.documents.map((doc) => <tr key={doc.id}><td><div className="file-cell"><div><FileText size={18} /></div><p><strong>{doc.name}</strong><span>{doc.id}</span></p></div></td><td>理赔规则</td><td>{doc.chunks}</td><td><span className="indexed"><Check size={12} />{doc.status}</span></td><td>{new Date(doc.createdAt).toLocaleDateString("zh-HK")}</td></tr>)}</tbody></table></div>
    </section>
    <div className="upload-note"><LockKeyhole size={19} /><div><strong>直接上传已关闭</strong><p>先使用 `$broker-claims-knowledge` 生成带来源、版本和测试证据的 JSON 草稿，再到治理审批页面导入。只有合规批准且管理员启用后才进入检索库。</p></div></div>
  </div>;
}

function GovernanceApprovals({ data, role, onRefresh }: { data: BootstrapData; role: Role; onRefresh: () => Promise<void> }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedId, setSelectedId] = useState(data.proposals[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const selected = data.proposals.find((item) => item.id === selectedId) ?? data.proposals[0] ?? null;
  const headers = { "Content-Type": "application/json", "x-demo-role": role };

  const importProposal = async (file?: File) => {
    if (!file) return;
    setBusy(true); setMessage(null);
    try {
      const proposal = JSON.parse(await file.text());
      const response = await fetch("/api/governance/proposals", { method: "POST", headers, body: JSON.stringify(proposal) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "导入失败");
      setSelectedId(body.id); setMessage({ tone: "success", text: `草稿 ${body.id} 已导入，尚未提交审批。` });
      await onRefresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "无法读取提案文件。" });
    } finally {
      setBusy(false); if (inputRef.current) inputRef.current.value = "";
    }
  };

  const transition = async (action: "submit" | "approve" | "reject" | "activate") => {
    if (!selected) return;
    setBusy(true); setMessage(null);
    const url = action === "activate" ? `/api/governance/proposals/${selected.id}/activate` : `/api/governance/proposals/${selected.id}/review`;
    const response = await fetch(url, { method: action === "activate" ? "POST" : "PATCH", headers, body: action === "activate" ? undefined : JSON.stringify({ action, note }) });
    const body = await response.json();
    if (response.ok) {
      setMessage({ tone: "success", text: `提案状态已更新为“${proposalStatusLabel[body.status as GovernanceProposal["status"]]}”。` }); setNote(""); await onRefresh();
    } else setMessage({ tone: "error", text: body.error || "操作失败。" });
    setBusy(false);
  };

  return <div className="stack-lg">
    <div className="section-intro governance-intro"><div><div className="eyebrow"><FileCheck2 size={14} /> HUMAN APPROVAL GATE</div><h2>治理审批中心</h2><p>Skill 生成证据草稿，合规作出审批决定，管理员负责最终启用。</p></div><button className="primary" onClick={() => inputRef.current?.click()} disabled={busy || !["developer", "admin"].includes(role)}><Upload size={17} />导入 Skill 草稿</button><input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={(event) => importProposal(event.target.files?.[0])} /></div>
    <section className="role-banner"><div className="role-icon"><UserCheck size={20} /></div><div><span>当前模拟角色</span><strong>{roleProfiles[role].name} · {roleProfiles[role].label}</strong></div><p>{role === "developer" ? "可以导入和提交草稿，不能审批或启用。" : role === "compliance" ? "可以批准或拒绝已提交提案，不能启用。" : role === "admin" ? "可以导入并启用已批准提案，不能代替合规审批。" : "顾问只能查看治理状态。"}</p><em>演示权限，非生产认证</em></section>
    {message && <div className={message.tone === "success" ? "success-message" : "governance-error"}>{message.tone === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}{message.text}</div>}
    <div className="governance-layout">
      <section className="panel proposal-queue">
        <div className="panel-head"><div><h3>提案队列</h3><p>{data.proposals.length} 个治理包</p></div></div>
        {data.proposals.length === 0 ? <div className="empty-proposals"><FileText size={26} /><strong>暂无治理提案</strong><p>使用项目 Skills 生成 JSON 草稿后导入。</p><code>$broker-claims-knowledge</code><code>$broker-risk-rule</code></div> : <div className="proposal-list">{data.proposals.map((proposal) => <button key={proposal.id} className={selected?.id === proposal.id ? "active" : ""} onClick={() => { setSelectedId(proposal.id); setNote(""); }}><div className={`proposal-kind ${proposal.kind}`}>{proposal.kind === "knowledge" ? <BookOpen size={16} /> : proposal.kind === "risk_rule" ? <CircleGauge size={16} /> : <ShieldCheck size={16} />}</div><p><strong>{proposal.title}</strong><span>{proposal.id}</span><small>{proposalKindLabel[proposal.kind]} · {proposal.createdBy}</small></p><em className={`proposal-status ${proposal.status}`}>{proposalStatusLabel[proposal.status]}</em></button>)}</div>}
      </section>
      <section className="panel proposal-detail">
        {selected ? <>
          <div className="proposal-detail-head"><div><span className={`proposal-status ${selected.status}`}>{proposalStatusLabel[selected.status]}</span><h3>{selected.title}</h3><p>{proposalKindLabel[selected.kind]} · Schema {selected.schemaVersion}</p></div><div className="proposal-id">{selected.id}</div></div>
          <div className="lifecycle"><span className={["draft", "submitted", "approved", "activated"].includes(selected.status) ? "done" : ""}>1 草稿</span><i /><span className={["submitted", "approved", "activated"].includes(selected.status) ? "done" : ""}>2 已提交</span><i /><span className={["approved", "activated"].includes(selected.status) ? "done" : selected.status === "rejected" ? "rejected" : ""}>3 合规审批</span><i /><span className={selected.status === "activated" ? "done" : ""}>4 启用</span></div>
          <div className="proposal-section"><div className="block-label"><MessageSquareText size={15} />变更理由</div><p>{selected.rationale}</p></div>
          <div className="proposal-metadata"><div><span>创建者</span><b>{selected.createdBy}</b></div><div><span>来源</span><b>{selected.provenance[0]?.source}</b></div><div><span>版本</span><b>{selected.provenance[0]?.version}</b></div><div><span>创建时间</span><b>{new Date(selected.createdAt).toLocaleString("zh-HK")}</b></div></div>
          <div className="proposal-section"><div className="block-label"><ClipboardCheck size={15} />自动化证据 <span>{selected.evidence.tests.length}</span></div><div className="gate-list">{selected.evidence.tests.map((test) => <div key={test.name} className={test.passed ? "pass" : "fail"}>{test.passed ? <CheckCircle2 size={16} /> : <XCircle size={16} />}<p><strong>{test.name}</strong><span>{test.detail}</span></p></div>)}</div></div>
          <div className="proposal-section"><div className="block-label"><AlertTriangle size={15} />待人工判断风险 <span>{selected.evidence.risks.length}</span></div>{selected.evidence.risks.length ? <ul className="risk-notes">{selected.evidence.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul> : <p className="muted">没有未解决风险。</p>}</div>
          {selected.reviewedBy && <div className="review-record"><UserCheck size={17} /><div><strong>{selected.reviewedBy} 的复核记录</strong><p>{selected.reviewNote}</p></div></div>}
          {selected.status === "submitted" && role === "compliance" && <label className="review-note governance-note">复核意见（必填）<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="说明批准依据、限制条件或拒绝理由…" /></label>}
          <div className="proposal-actions">
            {selected.status === "draft" && role === "developer" && <button className="primary" disabled={busy} onClick={() => transition("submit")}><Send size={16} />提交合规审批</button>}
            {selected.status === "submitted" && role === "compliance" && <><button className="secondary" disabled={busy || note.trim().length < 4} onClick={() => transition("reject")}><XCircle size={16} />拒绝</button><button className="primary" disabled={busy || note.trim().length < 4} onClick={() => transition("approve")}><CheckCircle2 size={16} />批准</button></>}
            {selected.status === "approved" && role === "admin" && <button className="primary" disabled={busy} onClick={() => transition("activate")}><ShieldCheck size={16} />管理员启用</button>}
            {!((selected.status === "draft" && role === "developer") || (selected.status === "submitted" && role === "compliance") || (selected.status === "approved" && role === "admin")) && <span className="action-hint"><LockKeyhole size={14} />当前角色或状态没有可执行操作</span>}
          </div>
        </> : <div className="empty-detail">导入或选择一个治理提案</div>}
      </section>
    </div>
  </div>;
}

const proposalStatusLabel: Record<GovernanceProposal["status"], string> = { draft: "草稿", submitted: "待审批", approved: "已批准", rejected: "已拒绝", activated: "已启用" };
const proposalKindLabel: Record<GovernanceProposal["kind"], string> = { knowledge: "知识变更", risk_rule: "风险规则", release: "发布审查" };

function AuditLog({ events }: { events: AuditEvent[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => events.filter((item) => `${item.actor}${item.action}${item.target}${item.detail}`.toLowerCase().includes(query.toLowerCase())), [events, query]);
  return <div className="stack-lg">
    <div className="section-intro"><div><div className="eyebrow"><History size={14} /> IMMUTABLE EVIDENCE</div><h2>审计日志</h2><p>记录模型建议、人工决定和知识库变更，支持事后追溯。</p></div><div className="safe-badge"><LockKeyhole size={16} />只读记录</div></div>
    <section className="audit-statement"><ShieldCheck size={24} /><div><strong>治理证据链完整</strong><p>每个关键动作都记录执行人、对象、时间和结果。演示环境中的记录保存在当前进程。</p></div><span>{events.length} 条记录</span></section>
    <section className="panel audit-panel"><div className="audit-toolbar"><div className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索人员、动作或对象" /></div><button className="secondary"><SlidersHorizontal size={15} />筛选</button></div><div className="audit-list">{filtered.map((event) => <div className="audit-row" key={event.id}><div className="timeline-dot"><Check size={12} /></div><div className="audit-content"><div><strong>{event.action}</strong><span>{new Date(event.createdAt).toLocaleString("zh-HK")}</span></div><p>{event.actor} · <b>{event.target}</b></p><small>{event.detail}</small></div><span className="audit-id">{event.id}</span></div>)}</div></section>
  </div>;
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action?: string; onAction?: () => void }) {
  return <div className="panel-head"><div><h3>{title}</h3><p>{subtitle}</p></div>{action && <button onClick={onAction}>{action}<ArrowRight size={14} /></button>}</div>;
}
