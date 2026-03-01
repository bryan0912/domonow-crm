import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import {
  LayoutDashboard, Users, Building2, TrendingUp, Upload, Plus, Search,
  ChevronDown, X, Phone, MapPin, Calendar, CheckCircle2,
  Send, Zap, Bell, Pencil, Trash2, Tag, Loader2
} from "lucide-react";

const PRIMARY = "#820ad1";
const SECONDARY = "#F7B500";

const ESTADOS = [
  { label: "Lead Nuevo", color: "#6366f1", bg: "#eef2ff", icon: Zap },
  { label: "Contacto Inicial", color: "#0ea5e9", bg: "#e0f2fe", icon: Phone },
  { label: "Cita Programada", color: "#f59e0b", bg: "#fffbeb", icon: Calendar },
  { label: "Cotización Enviada", color: "#8b5cf6", bg: "#f5f3ff", icon: Send },
  { label: "Cerrado / Ganado", color: "#10b981", bg: "#ecfdf5", icon: CheckCircle2 },
];

const TIPOS = ["Unidad Residencial", "Administrador"];
const FUENTES = ["Referido", "Instagram", "WhatsApp", "Puerta a Puerta", "Llamada en Frío", "Otro"];

function StatusBadge({ estado }) {
  const s = ESTADOS.find(e => e.label === estado) || ESTADOS[0];
  const Icon = s.icon;
  return (
    <span style={{ background: s.bg, color: s.color, border: `1.5px solid ${s.color}30`, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Icon size={11} strokeWidth={2.5} />{s.label}
    </span>
  );
}

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const s = ESTADOS.find(e => e.label === value) || ESTADOS[0];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${s.color}40`, background: s.bg, color: s.color, fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
        {value} <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{ position: "absolute", zIndex: 99, top: "calc(100% + 4px)", left: 0, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #f0ebf7", minWidth: 180, overflow: "hidden" }}>
          {ESTADOS.map(e => {
            const Icon = e.icon;
            return (
              <button key={e.label} onClick={() => { onChange(e.label); setOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "9px 12px", border: "none", background: "transparent", color: e.color, fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                onMouseEnter={ev => ev.currentTarget.style.background = e.bg}
                onMouseLeave={ev => ev.currentTarget.style.background = "transparent"}>
                <Icon size={13} /> {e.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Modal({ lead, onClose, onSave, saving }) {
  const [f, setF] = useState(lead || { nombre: "", tipo: "Unidad Residencial", lugar: "", celular: "", email: "", fuente: "Referido", estado: "Lead Nuevo" });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #ede8f7", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none", color: "#1A1A1A", boxSizing: "border-box" };
  const lbl = { fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 460, margin: "0 16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(130,10,209,0.2)" }}>
        <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "Montserrat, sans-serif" }}>{lead ? "Editar Lead" : "Nuevo Lead"}</span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}><X size={16} color="#fff" /></button>
        </div>
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "55vh", overflowY: "auto" }}>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Nombre / Unidad</label><input style={inp} value={f.nombre} onChange={e => set("nombre", e.target.value)} /></div>
          <div><label style={lbl}>Tipo</label><select style={{ ...inp, background: "#fff" }} value={f.tipo} onChange={e => set("tipo", e.target.value)}>{TIPOS.map(t => <option key={t}>{t}</option>)}</select></div>
          <div><label style={lbl}>Lugar</label><input style={inp} value={f.lugar} onChange={e => set("lugar", e.target.value)} /></div>
          <div><label style={lbl}>Celular</label><input style={inp} value={f.celular} onChange={e => set("celular", e.target.value)} /></div>
          <div><label style={lbl}>Fuente</label><select style={{ ...inp, background: "#fff" }} value={f.fuente} onChange={e => set("fuente", e.target.value)}>{FUENTES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Email</label><input style={inp} type="email" value={f.email} onChange={e => set("email", e.target.value)} /></div>
          <div style={{ gridColumn: "1/-1" }}><label style={lbl}>Estado</label><select style={{ ...inp, background: "#fff" }} value={f.estado} onChange={e => set("estado", e.target.value)}>{ESTADOS.map(e => <option key={e.label}>{e.label}</option>)}</select></div>
        </div>
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f5f0fb", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 700, color: "#888", cursor: "pointer" }}>Cancelar</button>
          <button onClick={() => onSave(f)} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {lead ? "Guardar" : "Crear Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [modal, setModal] = useState(null);
  const fileRef = useRef();

  // ── Cargar leads desde Supabase ──
  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setLeads(data || []);
    setLoading(false);
  }

  // ── Crear o editar ──
  async function save(form) {
    setSaving(true);
    if (form.id) {
      const { error } = await supabase
        .from("leads")
        .update({ nombre: form.nombre, tipo: form.tipo, lugar: form.lugar, celular: form.celular, email: form.email, fuente: form.fuente, estado: form.estado })
        .eq("id", form.id);
      if (!error) setLeads(p => p.map(l => l.id === form.id ? { ...l, ...form } : l));
    } else {
      const { data, error } = await supabase
        .from("leads")
        .insert([{ nombre: form.nombre, tipo: form.tipo, lugar: form.lugar, celular: form.celular, email: form.email, fuente: form.fuente, estado: form.estado }])
        .select();
      if (!error && data) setLeads(p => [data[0], ...p]);
    }
    setSaving(false);
    setModal(null);
  }

  // ── Eliminar ──
  async function deleteLead(id) {
    await supabase.from("leads").delete().eq("id", id);
    setLeads(p => p.filter(l => l.id !== id));
  }

  // ── Cambiar estado ──
  async function updateEstado(id, estado) {
    await supabase.from("leads").update({ estado }).eq("id", id);
    setLeads(p => p.map(l => l.id === id ? { ...l, estado } : l));
  }

  // ── Importar CSV ──
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const lines = ev.target.result.trim().split("\n");
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const newLeads = lines.slice(1).map(line => {
        const cols = line.split(",").map(c => c.trim().replace(/"/g, ""));
        const row = {};
        headers.forEach((h, i) => row[h] = cols[i] || "");
        return { nombre: row["Nombre Unidad"] || row["nombre"] || "", tipo: row["Tipo"] || "Unidad Residencial", lugar: row["Lugar"] || "", celular: row["Celular"] || "", email: row["Email"] || "", fuente: row["Fuente"] || "Otro", estado: row["Estado"] || "Lead Nuevo" };
      }).filter(l => l.nombre);
      const { data } = await supabase.from("leads").insert(newLeads).select();
      if (data) setLeads(p => [...data, ...p]);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.nombre?.toLowerCase().includes(q) || (l.lugar || "").toLowerCase().includes(q))
      && (filterTipo === "Todos" || l.tipo === filterTipo)
      && (filterEstado === "Todos" || l.estado === filterEstado);
  }), [leads, search, filterTipo, filterEstado]);

  const kpis = useMemo(() => ({
    total: leads.length,
    res: leads.filter(l => l.tipo === "Unidad Residencial").length,
    adm: leads.filter(l => l.tipo === "Administrador").length,
    won: leads.filter(l => l.estado === "Cerrado / Ganado").length,
  }), [leads]);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "leads", icon: Users, label: "Leads" },
    { id: "pipeline", icon: TrendingUp, label: "Pipeline" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", background: "#F2F2F2", fontFamily: "'Montserrat', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 215, background: "#fff", borderRight: "1px solid #ede8f7", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "18px 16px", borderBottom: "1px solid #f5f0fb", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: SECONDARY, fontWeight: 800, fontSize: 17 }}>D</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: PRIMARY }}>Domonow</div>
            <div style={{ fontSize: 10, color: "#bbb", fontWeight: 600 }}>CRM Platform</div>
          </div>
        </div>
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {navItems.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setNav(id)} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontWeight: 700, fontSize: 13, marginBottom: 3, background: nav === id ? "rgba(130,10,209,0.1)" : "transparent", color: nav === id ? PRIMARY : "#999" }}>
              <Icon size={17} strokeWidth={2} />{label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "14px 16px", borderTop: "1px solid #f5f0fb", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: SECONDARY, fontWeight: 800, fontSize: 11 }}>DN</span>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>Domonow</div>
            <div style={{ fontSize: 10, color: "#bbb" }}>Admin</div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ background: "#fff", borderBottom: "1px solid #ede8f7", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>{nav === "dashboard" ? "Dashboard" : nav === "leads" ? "Gestión de Leads" : "Pipeline de Ventas"}</h1>
            <p style={{ fontSize: 10, color: "#bbb", fontWeight: 600, margin: 0 }}>Valle de Aburrá · {new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}</p>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(130,10,209,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bell size={15} color={PRIMARY} />
          </div>
        </header>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <Loader2 size={32} color={PRIMARY} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#bbb", fontWeight: 600 }}>Conectando con Supabase...</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>

            {/* DASHBOARD */}
            {nav === "dashboard" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
                  {[
                    { label: "Total Leads", val: kpis.total, icon: Users, color: PRIMARY, bg: "#f5edfd" },
                    { label: "Residenciales", val: kpis.res, icon: Building2, color: "#0ea5e9", bg: "#e0f2fe" },
                    { label: "Administradores", val: kpis.adm, icon: Tag, color: "#f59e0b", bg: "#fffbeb" },
                    { label: "Ganados", val: kpis.won, icon: CheckCircle2, color: "#10b981", bg: "#ecfdf5" },
                  ].map(({ label, val, icon: Icon, color, bg }) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #f0ebf7" }}>
                      <div style={{ background: bg, borderRadius: 10, padding: 10, display: "inline-flex", marginBottom: 14 }}><Icon size={18} color={color} /></div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: "#1A1A1A", lineHeight: 1, marginBottom: 4 }}>{val}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#aaa" }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7", marginBottom: 18 }}>
                  <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 18, color: "#1A1A1A" }}>Distribución por Estado</h3>
                  {ESTADOS.map(({ label, color, bg, icon: Icon }) => {
                    const count = leads.filter(l => l.estado === label).length;
                    const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                    return (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <div style={{ background: bg, padding: 6, borderRadius: 8 }}><Icon size={13} color={color} /></div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#555", width: 150, flexShrink: 0 }}>{label}</span>
                        <div style={{ flex: 1, height: 7, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 10 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 800, color, width: 32, textAlign: "right" }}>{pct}%</span>
                        <span style={{ fontSize: 11, color: "#ccc", width: 16 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontWeight: 800, fontSize: 14, color: "#1A1A1A" }}>Leads Recientes</h3>
                    <button onClick={() => setNav("leads")} style={{ fontSize: 12, fontWeight: 700, color: PRIMARY, background: "none", border: "none", cursor: "pointer" }}>Ver todos →</button>
                  </div>
                  {leads.slice(0, 5).map(l => (
                    <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, marginBottom: 3 }}
                      onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: l.tipo === "Administrador" ? "#fffbeb" : "#f5edfd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {l.tipo === "Administrador" ? <Users size={14} color="#f59e0b" /> : <Building2 size={14} color={PRIMARY} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{l.nombre}</div>
                        <div style={{ fontSize: 11, color: "#bbb" }}>{l.lugar} · {l.fuente}</div>
                      </div>
                      <StatusBadge estado={l.estado} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LEADS */}
            {nav === "leads" && (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#ccc" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 12, outline: "none" }} />
                  </div>
                  <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                    <option>Todos</option>{TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                    <option>Todos</option>{ESTADOS.map(e => <option key={e.label}>{e.label}</option>)}
                  </select>
                  <button onClick={() => fileRef.current.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: `1.5px solid ${SECONDARY}`, background: "#fffdf0", color: "#b88000", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700 }}>
                    <Upload size={13} /> Subir CSV
                  </button>
                  <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFile} />
                  <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 800 }}>
                    <Plus size={13} /> Nuevo Lead
                  </button>
                </div>
                <p style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 10 }}>{filtered.length} de {leads.length} leads</p>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0ebf7", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 680 }}>
                      <thead>
                        <tr style={{ background: "#faf5ff" }}>
                          {["Lead", "Tipo", "Lugar", "Celular", "Fuente", "Estado", "Fecha", ""].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 800, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #f0ebf7" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((l, i) => (
                          <tr key={l.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #faf5ff" : "none" }}
                            onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 7, background: l.tipo === "Administrador" ? "#fffbeb" : "#f5edfd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  {l.tipo === "Administrador" ? <Users size={12} color="#f59e0b" /> : <Building2 size={12} color={PRIMARY} />}
                                </div>
                                <div>
                                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{l.nombre}</div>
                                  <div style={{ fontSize: 10, color: "#ccc" }}>{l.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: l.tipo === "Administrador" ? "#fffbeb" : "#f5edfd", color: l.tipo === "Administrador" ? "#f59e0b" : PRIMARY }}>{l.tipo === "Unidad Residencial" ? "Residencial" : "Admin"}</span></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, color: "#777", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={10} color="#ccc" />{l.lugar}</span></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, color: "#999" }}>{l.celular}</span></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 11, fontWeight: 600, color: "#aaa" }}>{l.fuente}</span></td>
                            <td style={{ padding: "10px 14px" }}><StatusDropdown value={l.estado} onChange={v => updateEstado(l.id, v)} /></td>
                            <td style={{ padding: "10px 14px" }}><span style={{ fontSize: 10, color: "#ccc", fontWeight: 600 }}>{l.created_at ? new Date(l.created_at).toLocaleDateString("es-CO") : ""}</span></td>
                            <td style={{ padding: "10px 14px" }}>
                              <div style={{ display: "flex", gap: 4 }}>
                                <button onClick={() => setModal(l)} style={{ padding: 5, borderRadius: 6, border: "none", background: "#f5edfd", cursor: "pointer" }}><Pencil size={11} color={PRIMARY} /></button>
                                <button onClick={() => deleteLead(l.id)} style={{ padding: 5, borderRadius: 6, border: "none", background: "#fef2f2", cursor: "pointer" }}><Trash2 size={11} color="#ef4444" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filtered.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#e0d0f5" }}><p style={{ fontWeight: 700, fontSize: 13 }}>Sin resultados</p></div>}
                  </div>
                </div>
              </div>
            )}

            {/* PIPELINE */}
            {nav === "pipeline" && (
              <div>
                <p style={{ fontSize: 11, color: "#bbb", marginBottom: 16, fontWeight: 600 }}>Vista Kanban · {leads.length} leads activos</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                  {ESTADOS.map(({ label, color, bg, icon: Icon }) => {
                    const col = leads.filter(l => l.estado === label);
                    return (
                      <div key={label} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f0ebf7" }}>
                        <div style={{ background: bg, padding: "12px 14px", borderBottom: `3px solid ${color}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                            <Icon size={12} color={color} strokeWidth={2.5} />
                            <span style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                          </div>
                          <span style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A" }}>{col.length}</span>
                        </div>
                        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                          {col.map(l => (
                            <div key={l.id} style={{ background: "#faf7fe", borderRadius: 10, padding: "10px 12px", border: "1px solid #f0e8fb" }}>
                              <div style={{ fontWeight: 700, fontSize: 11, color: "#1A1A1A", marginBottom: 4 }}>{l.nombre}</div>
                              <div style={{ fontSize: 10, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} />{l.lugar}</div>
                              <div style={{ fontSize: 10, color: "#ccc", marginTop: 2 }}>{l.fuente}</div>
                            </div>
                          ))}
                          {col.length === 0 && <div style={{ textAlign: "center", padding: "18px 0", fontSize: 10, color: "#e0d0f5", fontWeight: 700 }}>Sin leads</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {modal && <Modal lead={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} saving={saving} />}
    </div>
  );
}