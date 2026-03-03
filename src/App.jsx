import { useState, useMemo, useRef, useEffect } from "react";
import { supabase } from "./supabaseClient";
import * as XLSX from "xlsx";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  LayoutDashboard, Users, Building2, TrendingUp, Upload, Plus, Search,
  ChevronDown, X, Phone, MapPin, Calendar, CheckCircle2, Send, Zap,
  Bell, Pencil, Trash2, Tag, Loader2, MessageCircle, AlertTriangle,
  CheckSquare, Square, StickyNote, Activity, PhoneCall, Coffee,
  FileCheck, BarChart2, Download, FileSpreadsheet, Target, Clock,
  Star, TrendingDown, Award, Mail
} from "lucide-react";

const PRIMARY = "#820ad1";
const SECONDARY = "#F7B500";
const DIAS_FRIO = 5;

const ESTADOS = [
  { label: "Lead Nuevo",           color: "#6366f1", bg: "#eef2ff", icon: Zap },
  { label: "Contacto Inicial",     color: "#0ea5e9", bg: "#e0f2fe", icon: Phone },
  { label: "Email Enviado",        color: "#ec4899", bg: "#fdf2f8", icon: Mail },
  { label: "WhatsApp Enviado",     color: "#25D366", bg: "#f0fdf4", icon: MessageCircle }, // NUEVO
  { label: "En Seguimiento",      color: "#8b5cf6", bg: "#f5f3ff", icon: Activity },
  { label: "Reagendar",            color: "#f97316", bg: "#fff7ed", icon: Clock },
  { label: "Cita Programada",      color: "#f59e0b", bg: "#fffbeb", icon: Calendar },
  { label: "Cotización Enviada",   color: "#06b6d4", bg: "#ecfeff", icon: Send },
  { label: "Cerrado / Ganado",     color: "#10b981", bg: "#ecfdf5", icon: CheckCircle2 },
  { label: "No Interesado",        color: "#94a3b8", bg: "#f8fafc", icon: X },
  { label: "Perdido / Descartado", color: "#ef4444", bg: "#fef2f2", icon: TrendingDown },
];

const TIPOS = ["Unidad Residencial", "Administrador"];
const FUENTES = ["Landing","Referido", "Instagram", "WhatsApp", "Puerta a Puerta", "Llamada en Frío", "Salida de Campo","Apollo","Linkedln", "Otro"];
const TIPO_ACTIVIDAD = [
  { value: "llamada", label: "Llamada", icon: PhoneCall, color: "#0ea5e9" },
  { value: "reunion", label: "Reunión", icon: Coffee, color: "#f59e0b" },
  { value: "cotizacion", label: "Cotización", icon: FileCheck, color: "#8b5cf6" },
  { value: "nota", label: "Nota", icon: StickyNote, color: "#10b981" },
];

// ─── Plantillas WhatsApp por estado ──────────────────────────────────────────
const WA_TEMPLATES = {
  "Lead Nuevo": (n) =>
    `Hola ${n}, te saluda el equipo de *Domonow* 👋\n\nNos especializamos en soluciones integrales e inteligentes para unidades residenciales en el Valle de Aburrá.\n\n¿Tienes unos minutos para que te contemos cómo podemos ayudarles?`,
  "Contacto Inicial": (n) =>
    `Hola ${n}, qué gusto saludarte nuevamente 😊\n\nQuería hacer seguimiento a nuestra conversación sobre los servicios de *Domonow*.\n\n¿Pudiste comentarlo? ¿Quedó alguna duda que pueda resolver?`,
  "Cita Programada": (n) =>
    `Hola ${n} ✅\n\nTe confirmo nuestra cita para presentarte los servicios de *Domonow*.\n\nPor favor confírmame si la fecha y hora siguen bien. ¡Nos vemos pronto!`,
  "Cotización Enviada": (n) =>
    `Hola ${n}, espero estés muy bien 🙌\n\nQuería saber si tuviste la oportunidad de revisar la cotización de *Domonow*.\n\n¿Tienes alguna pregunta o ajuste? Estoy a tu disposición.`,
  "Cerrado / Ganado": (n) =>
    `Hola ${n} 🎉\n\n¡Bienvenido a la familia *Domonow*!\n\nEn los próximos días nuestro equipo técnico se pondrá en contacto para coordinar la instalación.\n\n¡Gracias por confiar en nosotros!`,
};

function normalizarFuente(valor) {
  const v = (valor || "").toLowerCase().trim();
  if (v.includes("referid"))                                return "Referido";
  if (v.includes("instagram") || v === "ig")                return "Instagram";
  if (v.includes("whatsapp") || v === "wa" || v === "wsp")  return "WhatsApp";
  if (v.includes("linkedin"))                               return "LinkedIn";
  if (v.includes("puerta"))                                 return "Puerta a Puerta";
  if (v.includes("llamada") || v.includes("fria") || v.includes("fría")) return "Llamada en Frío";
  if (v.includes("campo") || v.includes("salida"))          return "Salida de Campo";
  return "Otro";
}

function normalizarTipo(valor) {
  const v = (valor || "").toLowerCase().trim();
  if (v.includes("admin")) return "Administrador";
  return "Unidad Residencial";
}

function normalizarEstado(valor) {
  const v = (valor || "").toLowerCase().trim();
  if (v.includes("nuevo") || v === "")                       return "Lead Nuevo";
  if (v.includes("contacto") || v.includes("inicial"))       return "Contacto Inicial";
  if (v.includes("email") || v.includes("correo"))           return "Email Enviado";
  if (v.includes("whatsapp") || v.includes("wha"))           return "WhatsApp Enviado";
  if (v.includes("seguimiento"))                             return "En Seguimiento";
  if (v.includes("reagend"))                                 return "Reagendar";
  if (v.includes("cita") || v.includes("programad"))         return "Cita Programada";
  if (v.includes("cotiz"))                                   return "Cotización Enviada";
  if (v.includes("negoci"))                                  return "En Negociación";
  if (v.includes("ganado") || v.includes("cerrado") || v.includes("contrato")) return "Cerrado / Ganado";
  if (v.includes("no inter") || v.includes("interesado"))    return "No Interesado";
  if (v.includes("perdido") || v.includes("descart"))        return "Perdido / Descartado";
  return "Lead Nuevo";
}
function diasDesde(fecha) {
  if (!fecha) return 999;
  return Math.floor((new Date() - new Date(fecha)) / (1000 * 60 * 60 * 24));
}

// ─── Helpers UI ───────────────────────────────────────────────────────────────
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
        <div style={{ position: "absolute", zIndex: 99, top: "calc(100% + 4px)", left: 0, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #f0ebf7", minWidth: 185, overflow: "hidden" }}>
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

// ─── Modal WhatsApp ───────────────────────────────────────────────────────────
function WhatsAppModal({ lead, onClose }) {
  const template = WA_TEMPLATES[lead.estado] || WA_TEMPLATES["Lead Nuevo"];
  const [msg, setMsg] = useState(template(lead.nombre));
  const numero = lead.celular?.replace(/\s/g, "");
  const url = `https://wa.me/57${numero}?text=${encodeURIComponent(msg)}`;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 480, margin: "0 16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.15)" }}>
        <div style={{ background: "#25D366", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <MessageCircle size={20} color="#fff" />
            <span style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "Montserrat, sans-serif" }}>WhatsApp a {lead.nombre}</span>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}><X size={15} color="#fff" /></button>
        </div>
        <div style={{ padding: 22 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Plantilla para estado: <span style={{ color: "#25D366" }}>{lead.estado}</span>
          </p>
          <textarea value={msg} onChange={e => setMsg(e.target.value)}
            style={{ width: "100%", height: 160, padding: "12px", borderRadius: 10, border: "1.5px solid #ede8f7", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box", color: "#333" }} />
          <p style={{ fontSize: 11, color: "#bbb", marginTop: 6, marginBottom: 14 }}>Puedes editar el mensaje antes de enviarlo.</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 700, color: "#888", cursor: "pointer" }}>Cancelar</button>
            <a href={url} target="_blank" rel="noreferrer" onClick={onClose}
              style={{ flex: 2, padding: "10px", borderRadius: 10, background: "#25D366", color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
              <MessageCircle size={15} /> Abrir WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Crear/Editar Lead ──────────────────────────────────────────────────
function LeadModal({ lead, onClose, onSave, saving }) {
  const [f, setF] = useState(lead || {
    nombre: "", tipo: "Unidad Residencial", lugar: "",
    celular: "", telefono: "", email: "", fuente: "Referido",
    estado: "Lead Nuevo", notas: "", contacto_nombre: "", unidades: ""
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const inp = { width: "100%", padding: "9px 12px", borderRadius: 8, border: "1.5px solid #ede8f7", fontFamily: "Montserrat, sans-serif", fontSize: 13, outline: "none", color: "#1A1A1A", boxSizing: "border-box" };
  const lbl = { fontSize: 10, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 5 };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)" }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 500, margin: "0 16px", overflow: "hidden", boxShadow: "0 24px 64px rgba(130,10,209,0.2)" }}>

        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 16, fontFamily: "Montserrat, sans-serif" }}>
            {lead ? "Editar Lead" : "Nuevo Lead"}
          </span>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}>
            <X size={16} color="#fff" />
          </button>
        </div>

        {/* Campos */}
        <div style={{ padding: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxHeight: "62vh", overflowY: "auto" }}>

          {/* Nombre */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Nombre / Unidad</label>
            <input style={inp} value={f.nombre || ""} onChange={e => set("nombre", e.target.value)} placeholder="Ej: Torres del Norte" />
          </div>

          {/* Tipo */}
          <div>
            <label style={lbl}>Tipo</label>
            <select style={{ ...inp, background: "#fff" }} value={f.tipo} onChange={e => set("tipo", e.target.value)}>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          {/* Lugar */}
          <div>
            <label style={lbl}>Lugar / Municipio</label>
            <input style={inp} value={f.lugar || ""} onChange={e => set("lugar", e.target.value)} placeholder="Ej: Medellín" />
          </div>

          {/* Celular */}
          <div>
            <label style={lbl}>Celular</label>
            <input style={inp} value={f.celular || ""} onChange={e => set("celular", e.target.value)} placeholder="310 000 0000" />
          </div>

          {/* Teléfono fijo */}
          <div>
            <label style={lbl}>Teléfono Fijo</label>
            <input style={inp} value={f.telefono || ""} onChange={e => set("telefono", e.target.value)} placeholder="604 000 0000" />
          </div>

          {/* Email */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Correo Electrónico</label>
            <input style={inp} type="email" value={f.email || ""} onChange={e => set("email", e.target.value)} placeholder="correo@ejemplo.com" />
          </div>

          {/* Nombre contacto */}
          <div>
            <label style={lbl}>Nombre Contacto</label>
            <input style={inp} value={f.contacto_nombre || ""} onChange={e => set("contacto_nombre", e.target.value)} placeholder="Ej: Carlos Pérez" />
          </div>

          {/* Unidades */}
          <div>
            <label style={lbl}>N° de Unidades</label>
            <input style={inp} type="number" value={f.unidades || ""} onChange={e => set("unidades", e.target.value)} placeholder="Ej: 120" />
          </div>

          {/* Fuente */}
          <div>
            <label style={lbl}>Fuente</label>
            <select style={{ ...inp, background: "#fff" }} value={f.fuente} onChange={e => set("fuente", e.target.value)}>
              {FUENTES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label style={lbl}>Estado</label>
            <select style={{ ...inp, background: "#fff" }} value={f.estado} onChange={e => set("estado", e.target.value)}>
              {ESTADOS.map(e => <option key={e.label}>{e.label}</option>)}
            </select>
          </div>

          {/* Notas */}
          <div style={{ gridColumn: "1/-1" }}>
            <label style={lbl}>Notas</label>
            <textarea style={{ ...inp, height: 70, resize: "none" }} value={f.notas || ""} onChange={e => set("notas", e.target.value)} placeholder="Información relevante sobre este lead..." />
          </div>

        </div>

        {/* Botones */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f5f0fb", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 700, color: "#888", cursor: "pointer" }}>
            Cancelar
          </button>
          <button onClick={() => onSave(f)} disabled={saving} style={{ flex: 2, padding: "10px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 13, fontWeight: 800, cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1 }}>
            {saving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
            {lead ? "Guardar Cambios" : "Crear Lead"}
          </button>
        </div>

      </div>
    </div>
  );
}


// ─── Panel Detalle Lead ───────────────────────────────────────────────────────
function LeadPanel({ lead, onClose, onUpdate, onWhatsApp }) {
  const [tab, setTab] = useState("historial");
  const [actividades, setActividades] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [loadingAct, setLoadingAct] = useState(true);
  const [newAct, setNewAct] = useState({ tipo: "llamada", descripcion: "" });
  const [newTarea, setNewTarea] = useState({ descripcion: "", fecha: "" });
  const [notas, setNotas] = useState(lead.notas || "");
  const [savingNotas, setSavingNotas] = useState(false);

  useEffect(() => {
    fetchActividades();
    fetchTareas();
  }, [lead.id]);

  async function fetchActividades() {
    setLoadingAct(true);
    const { data } = await supabase.from("actividades").select("*").eq("lead_id", lead.id).order("created_at", { ascending: false });
    setActividades(data || []);
    setLoadingAct(false);
  }

  async function fetchTareas() {
    const { data } = await supabase.from("tareas").select("*").eq("lead_id", lead.id).order("fecha", { ascending: true });
    setTareas(data || []);
  }

  async function addActividad() {
    if (!newAct.descripcion.trim()) return;
    const { data } = await supabase.from("actividades").insert([{ lead_id: lead.id, tipo: newAct.tipo, descripcion: newAct.descripcion }]).select();
    if (data) {
      setActividades(p => [data[0], ...p]);
      setNewAct({ tipo: "llamada", descripcion: "" });
      await supabase.from("leads").update({ ultimo_contacto: new Date().toISOString() }).eq("id", lead.id);
      onUpdate();
    }
  }

  async function addTarea() {
    if (!newTarea.descripcion.trim()) return;
    const { data } = await supabase.from("tareas").insert([{ lead_id: lead.id, descripcion: newTarea.descripcion, fecha: newTarea.fecha || null }]).select();
    if (data) { setTareas(p => [...p, data[0]]); setNewTarea({ descripcion: "", fecha: "" }); }
  }

  async function toggleTarea(tarea) {
    await supabase.from("tareas").update({ completada: !tarea.completada }).eq("id", tarea.id);
    setTareas(p => p.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t));
  }

  async function saveNotas() {
    setSavingNotas(true);
    await supabase.from("leads").update({ notas }).eq("id", lead.id);
    setSavingNotas(false);
    onUpdate();
  }

  const tipoAct = TIPO_ACTIVIDAD.find(t => t.value === newAct.tipo);
  const inp = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1.5px solid #ede8f7", fontFamily: "Montserrat, sans-serif", fontSize: 12, outline: "none", boxSizing: "border-box" };
  const dias = diasDesde(lead.ultimo_contacto || lead.created_at);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 150, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ flex: 1, background: "rgba(0,0,0,0.3)" }} />
      <div style={{ width: 430, background: "#fff", height: "100%", display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(130,10,209,0.12)", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>{lead.nombre}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 3 }}>{lead.lugar} · {lead.fuente}</div>
            </div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}><X size={15} color="#fff" /></button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge estado={lead.estado} />
            {dias > DIAS_FRIO && lead.estado !== "Cerrado / Ganado" && (
              <span style={{ background: "rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={10} /> {dias}d sin contacto
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {lead.celular && (
              <button onClick={() => onWhatsApp(lead)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "#25D366", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer" }}>
                <MessageCircle size={13} /> WhatsApp
              </button>
            )}
            {lead.celular && (
              <a href={`tel:${lead.celular}`}
                style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.2)", color: "#fff", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                <Phone size={13} /> Llamar
              </a>
            )}
          </div>
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #f0ebf7", background: "#faf5ff" }}>
          {[
            { id: "historial", icon: Activity, label: "Historial" },
            { id: "tareas", icon: CheckSquare, label: `Tareas ${tareas.filter(t => !t.completada).length > 0 ? `(${tareas.filter(t => !t.completada).length})` : ""}` },
            { id: "notas", icon: StickyNote, label: "Notas" },
          ].map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "10px 8px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, color: tab === id ? PRIMARY : "#bbb", borderBottom: tab === id ? `2px solid ${PRIMARY}` : "2px solid transparent", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {tab === "historial" && (
            <div>
              <div style={{ background: "#faf5ff", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Registrar actividad</p>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {TIPO_ACTIVIDAD.map(t => (
                    <button key={t.value} onClick={() => setNewAct(p => ({ ...p, tipo: t.value }))}
                      style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${newAct.tipo === t.value ? t.color : "#e5e7eb"}`, background: newAct.tipo === t.value ? t.color + "15" : "#fff", color: newAct.tipo === t.value ? t.color : "#aaa", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                      <t.icon size={12} />{t.label}
                    </button>
                  ))}
                </div>
                <textarea value={newAct.descripcion} onChange={e => setNewAct(p => ({ ...p, descripcion: e.target.value }))}
                  placeholder={`¿Qué pasó en esta ${tipoAct?.label.toLowerCase()}?`}
                  style={{ ...inp, height: 64, resize: "none", marginBottom: 8 }} />
                <button onClick={addActividad} style={{ width: "100%", padding: "8px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>
                  Guardar actividad
                </button>
              </div>
              {loadingAct ? <div style={{ textAlign: "center", padding: 20 }}><Loader2 size={20} color={PRIMARY} style={{ animation: "spin 1s linear infinite" }} /></div> : (
                <div>
                  {actividades.length === 0 && <p style={{ textAlign: "center", color: "#ddd", fontSize: 12, padding: 20 }}>Sin actividad registrada</p>}
                  {actividades.map(a => {
                    const t = TIPO_ACTIVIDAD.find(t => t.value === a.tipo) || TIPO_ACTIVIDAD[3];
                    return (
                      <div key={a.id} style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: t.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                          <t.icon size={14} color={t.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#333", fontWeight: 600, lineHeight: 1.5 }}>{a.descripcion}</div>
                          <div style={{ fontSize: 10, color: "#bbb", marginTop: 3 }}>{t.label} · {new Date(a.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "tareas" && (
            <div>
              <div style={{ background: "#faf5ff", borderRadius: 12, padding: 14, marginBottom: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nueva tarea</p>
                <input value={newTarea.descripcion} onChange={e => setNewTarea(p => ({ ...p, descripcion: e.target.value }))} placeholder="Ej: Llamar para confirmar cita" style={{ ...inp, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <input type="date" value={newTarea.fecha} onChange={e => setNewTarea(p => ({ ...p, fecha: e.target.value }))} style={{ ...inp, flex: 1 }} />
                  <button onClick={addTarea} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>+ Agregar</button>
                </div>
              </div>
              {tareas.length === 0 && <p style={{ textAlign: "center", color: "#ddd", fontSize: 12, padding: 20 }}>Sin tareas programadas</p>}
              {tareas.map(t => {
                const vencida = t.fecha && new Date(t.fecha) < new Date() && !t.completada;
                return (
                  <div key={t.id} onClick={() => toggleTarea(t)} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 10, marginBottom: 8, border: `1.5px solid ${vencida ? "#fee2e2" : "#f0ebf7"}`, background: t.completada ? "#f9fafb" : vencida ? "#fff5f5" : "#fff", cursor: "pointer" }}>
                    {t.completada ? <CheckSquare size={18} color="#10b981" style={{ flexShrink: 0 }} /> : <Square size={18} color={vencida ? "#ef4444" : "#ccc"} style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: t.completada ? "#bbb" : "#333", textDecoration: t.completada ? "line-through" : "none" }}>{t.descripcion}</div>
                      {t.fecha && <div style={{ fontSize: 10, marginTop: 3, color: vencida ? "#ef4444" : "#bbb", fontWeight: 600 }}>{vencida ? "⚠ Vencida · " : ""}{new Date(t.fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "notas" && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Notas internas</p>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Escribe información relevante sobre este lead..."
                style={{ ...inp, height: 220, resize: "none", marginBottom: 10, lineHeight: 1.6 }} />
              <button onClick={saveNotas} disabled={savingNotas} style={{ width: "100%", padding: "9px", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {savingNotas ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null} Guardar notas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Vista Tareas Global ──────────────────────────────────────────────────────
function TareasView() {
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("pendientes");

  useEffect(() => { fetchTareas(); }, []);

  async function fetchTareas() {
    setLoading(true);
    const { data } = await supabase.from("tareas").select("*, leads(nombre, celular, estado)").order("fecha", { ascending: true });
    setTareas(data || []);
    setLoading(false);
  }

  async function toggleTarea(tarea) {
    await supabase.from("tareas").update({ completada: !tarea.completada }).eq("id", tarea.id);
    setTareas(p => p.map(t => t.id === tarea.id ? { ...t, completada: !t.completada } : t));
  }

  const hoy = new Date().toISOString().slice(0, 10);
  const filtradas = tareas.filter(t => {
    if (filtro === "hoy") return t.fecha === hoy && !t.completada;
    if (filtro === "pendientes") return !t.completada;
    if (filtro === "vencidas") return t.fecha && t.fecha < hoy && !t.completada;
    if (filtro === "completadas") return t.completada;
    return true;
  });

  const badges = [
    { id: "hoy", label: `Hoy (${tareas.filter(t => t.fecha === hoy && !t.completada).length})` },
    { id: "pendientes", label: `Pendientes (${tareas.filter(t => !t.completada).length})` },
    { id: "vencidas", label: `Vencidas (${tareas.filter(t => t.fecha && t.fecha < hoy && !t.completada).length})`, alert: true },
    { id: "completadas", label: "Completadas" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {badges.map(f => (
          <button key={f.id} onClick={() => setFiltro(f.id)} style={{ padding: "8px 14px", borderRadius: 10, border: `1.5px solid ${filtro === f.id ? (f.alert ? "#ef4444" : PRIMARY) : "#ede8f7"}`, background: filtro === f.id ? (f.alert ? "#fef2f2" : "#f5edfd") : "#fff", color: filtro === f.id ? (f.alert ? "#ef4444" : PRIMARY) : "#888", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>
      {loading ? <div style={{ textAlign: "center", padding: 40 }}><Loader2 size={24} color={PRIMARY} style={{ animation: "spin 1s linear infinite" }} /></div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtradas.length === 0 && (
            <div style={{ textAlign: "center", padding: 48, color: "#ddd" }}>
              <CheckSquare size={36} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
              <p style={{ fontWeight: 700, fontSize: 13 }}>Sin tareas en esta categoría</p>
            </div>
          )}
          {filtradas.map(t => {
            const vencida = t.fecha && t.fecha < hoy && !t.completada;
            const esHoy = t.fecha === hoy;
            return (
              <div key={t.id} style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: `1.5px solid ${vencida ? "#fee2e2" : esHoy ? "#fef3c7" : "#f0ebf7"}`, display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => toggleTarea(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", flexShrink: 0 }}>
                  {t.completada ? <CheckSquare size={20} color="#10b981" /> : <Square size={20} color={vencida ? "#ef4444" : "#ccc"} />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: t.completada ? "#bbb" : "#333", textDecoration: t.completada ? "line-through" : "none" }}>{t.descripcion}</div>
                  <div style={{ fontSize: 11, color: "#bbb", marginTop: 3, display: "flex", alignItems: "center", gap: 6 }}>
                    <Building2 size={11} />{t.leads?.nombre}
                    {t.fecha && <span style={{ color: vencida ? "#ef4444" : esHoy ? "#f59e0b" : "#bbb", fontWeight: vencida || esHoy ? 700 : 400 }}>· {vencida ? "⚠ Vencida " : esHoy ? "📌 Hoy " : ""}{new Date(t.fecha + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</span>}
                  </div>
                </div>
                {t.leads?.celular && (
                  <a href={`https://wa.me/57${t.leads.celular.replace(/\s/g, "")}`} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 4, background: "#25D36615", color: "#25D366", padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>
                    <MessageCircle size={12} /> WA
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Vista Reportes ───────────────────────────────────────────────────────────
function ReportesView({ leads }) {
  const COLORS = ["#820ad1", "#0ea5e9", "#f59e0b", "#10b981", "#6366f1", "#ec4899"];

  const porEstado = ESTADOS.map(e => ({
    name: e.label.replace("Cotización Enviada", "Cotización").replace("Contacto Inicial", "Contacto").replace("Cerrado / Ganado", "Ganado"),
    value: leads.filter(l => l.estado === e.label).length,
    color: e.color,
  }));

  const porFuente = FUENTES.map((f, i) => ({
    name: f,
    leads: leads.filter(l => l.fuente === f).length,
    fill: COLORS[i % COLORS.length],
  })).filter(f => f.leads > 0).sort((a, b) => b.leads - a.leads);

  const porMes = useMemo(() => {
    const meses = {};
    leads.forEach(l => {
      if (!l.created_at) return;
      const key = new Date(l.created_at).toLocaleDateString("es-CO", { month: "short", year: "2-digit" });
      meses[key] = (meses[key] || 0) + 1;
    });
    return Object.entries(meses).slice(-6).map(([mes, total]) => ({ mes, total }));
  }, [leads]);

  const total = leads.length;
  const ganados = leads.filter(l => l.estado === "Cerrado / Ganado").length;
  const conversion = total > 0 ? ((ganados / total) * 100).toFixed(1) : 0;
  const fuenteTop = porFuente[0]?.name || "—";
  const esteMes = leads.filter(l => {
    if (!l.created_at) return false;
    const d = new Date(l.created_at);
    const hoy = new Date();
    return d.getMonth() === hoy.getMonth() && d.getFullYear() === hoy.getFullYear();
  }).length;

  return (
    <div>
      {/* KPIs de métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
        {[
          { label: "Tasa de Conversión", val: `${conversion}%`, icon: Target, color: "#10b981", bg: "#ecfdf5", sub: "leads cerrados" },
          { label: "Leads este Mes", val: esteMes, icon: TrendingUp, color: PRIMARY, bg: "#f5edfd", sub: "nuevos ingresos" },
          { label: "Fuente #1", val: fuenteTop, icon: Star, color: "#f59e0b", bg: "#fffbeb", sub: "más efectiva" },
          { label: "Total Activos", val: leads.filter(l => l.estado !== "Cerrado / Ganado").length, icon: Activity, color: "#6366f1", bg: "#eef2ff", sub: "en proceso" },
        ].map(({ label, val, icon: Icon, color, bg, sub }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 16, padding: 18, border: "1px solid #f0ebf7" }}>
            <div style={{ background: bg, borderRadius: 10, padding: 9, display: "inline-flex", marginBottom: 12 }}><Icon size={17} color={color} /></div>
            <div style={{ fontSize: typeof val === "string" && val.length > 5 ? 16 : 26, fontWeight: 800, color: "#1A1A1A", lineHeight: 1, marginBottom: 3 }}>{val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#333", marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 10, color: "#bbb" }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Leads por mes */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
          <h3 style={{ fontWeight: 800, fontSize: 14, color: "#1A1A1A", marginBottom: 18 }}>Leads por Mes</h3>
          {porMes.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porMes} barSize={32}>
                <XAxis dataKey="mes" tick={{ fontSize: 11, fontFamily: "Montserrat", fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: "Montserrat", fill: "#aaa" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontFamily: "Montserrat", fontSize: 12, borderRadius: 10, border: "1px solid #f0ebf7" }} />
                <Bar dataKey="total" fill={PRIMARY} radius={[6, 6, 0, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: "center", color: "#ddd", padding: 40, fontSize: 12 }}>Sin datos aún</p>}
        </div>

        {/* Leads por fuente */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
          <h3 style={{ fontWeight: 800, fontSize: 14, color: "#1A1A1A", marginBottom: 18 }}>Leads por Fuente</h3>
          {porFuente.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={porFuente} layout="vertical" barSize={18}>
                <XAxis type="number" tick={{ fontSize: 11, fontFamily: "Montserrat", fill: "#aaa" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "Montserrat", fill: "#555" }} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={{ fontFamily: "Montserrat", fontSize: 12, borderRadius: 10, border: "1px solid #f0ebf7" }} />
                <Bar dataKey="leads" radius={[0, 6, 6, 0]} name="Leads">
                  {porFuente.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p style={{ textAlign: "center", color: "#ddd", padding: 40, fontSize: 12 }}>Sin datos aún</p>}
        </div>
      </div>

      {/* Embudo de conversión */}
      <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
        <h3 style={{ fontWeight: 800, fontSize: 14, color: "#1A1A1A", marginBottom: 20 }}>Embudo de Conversión</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {ESTADOS.map(({ label, color, bg, icon: Icon }, i) => {
            const count = leads.filter(l => l.estado === label).length;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const width = 100 - (i * 10);
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ background: bg, padding: "5px 7px", borderRadius: 8, flexShrink: 0 }}><Icon size={13} color={color} /></div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555", width: 160, flexShrink: 0 }}>{label}</span>
                <div style={{ flex: 1, height: 28, background: "#f9fafb", borderRadius: 8, overflow: "hidden", position: "relative" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 8, opacity: 0.85, minWidth: count > 0 ? 40 : 0, display: "flex", alignItems: "center", paddingLeft: 10, transition: "width 0.6s ease" }}>
                    {count > 0 && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>{count}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, color, width: 38, textAlign: "right", flexShrink: 0 }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("Todos");
  const [filterEstado, setFilterEstado] = useState("Todos");
  const [filterFuente, setFilterFuente] = useState("Todos");
  const [seleccionados, setSeleccionados] = useState([]);
  const [bulkEstado, setBulkEstado] = useState("");
  const [ultimaImportacion, setUltimaImportacion] = useState([]);
  const [modal, setModal] = useState(null);
  const [panel, setPanel] = useState(null);
  const [waModal, setWaModal] = useState(null);
  const fileRef = useRef();

  useEffect(() => { fetchLeads(); }, []);

  async function fetchLeads() {
    setLoading(true);
    const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
    setLeads(data || []);
    setLoading(false);
  }

  async function save(form) {
  setSaving(true);

  const payload = {
    nombre:          form.nombre          || "",
    tipo:            form.tipo            || "Unidad Residencial",
    lugar:           form.lugar           || "",
    celular:         form.celular         || "",
    telefono:        form.telefono        || "",
    email:           form.email           || "",
    fuente:          form.fuente          || "Otro",
    estado:          form.estado          || "Lead Nuevo",
    notas:           form.notas           || "",
    contacto_nombre: form.contacto_nombre || "",
    unidades:        parseInt(form.unidades) || 0,
  };

  if (form.id) {
    const { error } = await supabase
      .from("leads")
      .update(payload)
      .eq("id", form.id);
    if (!error) setLeads(p => p.map(l => l.id === form.id ? { ...l, ...payload } : l));
  } else {
    const { data, error } = await supabase
      .from("leads")
      .insert([payload])
      .select();
    if (error) {
      alert("Error al guardar: " + error.message);
      setSaving(false);
      return;
    }
    if (data) setLeads(p => [data[0], ...p]);
  }

  setSaving(false);
  setModal(null);
}
  async function deleteLead(id) {
    await supabase.from("leads").delete().eq("id", id);
    setLeads(p => p.filter(l => l.id !== id));
  }
  // Deshacer última importación
async function deshacerImportacion() {
  if (ultimaImportacion.length === 0) {
    alert("No hay importación reciente para deshacer.");
    return;
  }
  const confirmar = window.confirm(`¿Eliminar los últimos ${ultimaImportacion.length} contactos importados?`);
  if (!confirmar) return;
  await supabase.from("leads").delete().in("id", ultimaImportacion);
  setLeads(p => p.filter(l => !ultimaImportacion.includes(l.id)));
  setUltimaImportacion([]);
  alert("✅ Importación deshecha correctamente.");
}

// Eliminar seleccionados
async function eliminarSeleccionados() {
  if (seleccionados.length === 0) return;
  const confirmar = window.confirm(`¿Eliminar ${seleccionados.length} contactos seleccionados?`);
  if (!confirmar) return;
  await supabase.from("leads").delete().in("id", seleccionados);
  setLeads(p => p.filter(l => !seleccionados.includes(l.id)));
  setSeleccionados([]);
}

// Cambiar estado en masa
async function cambiarEstadoMasivo() {
  if (seleccionados.length === 0 || !bulkEstado) return;
  await supabase.from("leads").update({ estado: bulkEstado }).in("id", seleccionados);
  setLeads(p => p.map(l => seleccionados.includes(l.id) ? { ...l, estado: bulkEstado } : l));
  setSeleccionados([]);
  setBulkEstado("");
}

// Seleccionar / deseleccionar todos
function toggleSelectAll() {
  if (seleccionados.length === filtered.length) {
    setSeleccionados([]);
  } else {
    setSeleccionados(filtered.map(l => l.id));
  }
}

  async function updateEstado(id, estado) {
    await supabase.from("leads").update({ estado }).eq("id", id);
    setLeads(p => p.map(l => l.id === id ? { ...l, estado } : l));
    await supabase.from("actividades").insert([{ lead_id: id, tipo: "nota", descripcion: `Estado cambiado a: ${estado}` }]);
  }

  // ── Exportar Excel ──
  function exportarExcel() {
    const datos = leads.map(l => ({
      "Nombre / Unidad": l.nombre,
      "Tipo": l.tipo,
      "Lugar": l.lugar,
      "Celular": l.celular,
      "Email": l.email,
      "Fuente": l.fuente,
      "Estado": l.estado,
      "Notas": l.notas || "",
      "Fecha Creación": l.created_at ? new Date(l.created_at).toLocaleDateString("es-CO") : "",
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leads Domonow");
    ws["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 28 }, { wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 15 }];
    XLSX.writeFile(wb, `domonow-leads-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const newLeads = data.map(row => {
        // Normaliza claves: quita espacios y convierte a minúsculas
        const r = {};
        Object.keys(row).forEach(k => { r[k.trim().toLowerCase()] = String(row[k] || "").trim(); });

        return {
          nombre:          r["lead"] || r["nombre unidad"] || r["nombre"] || "",
          tipo:            normalizarTipo(r["tipo"]),
          lugar:           r["lugar"] || "",
          celular:         r["celular"] || "",
          telefono:        r["telefono"] || r["teléfono"] || "",
          email:           r["email"] || "",
          fuente:          normalizarFuente(r["fuente"]),
          estado:          normalizarEstado(r["estado"]),
          notas:           r["notas"] || "",
          contacto_nombre: r["contacto"] || r["contacto_nombre"] || "",
          unidades:        parseInt(r["unidades"]) || 0,
        };
        }).filter(l => l.nombre);

      if (newLeads.length === 0) {
        alert("No se encontraron contactos. Verifica que el archivo tenga datos y que la primera fila sea el encabezado.");
        return;
      }

      const { data: inserted, error } = await supabase.from("leads").insert(newLeads).select();
      if (error) {
        alert("Error al importar: " + error.message);
        return;
      }
      if (inserted) {
        setLeads(p => [...inserted, ...p]);
        setUltimaImportacion(inserted.map(l => l.id));
        alert(`✅ ${inserted.length} contactos importados. Puedes deshacer esta importación con el botón "Deshacer importación".`);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const filtered = useMemo(() => leads.filter(l => {
    const q = search.toLowerCase();
    return (!q || l.nombre?.toLowerCase().includes(q) || (l.lugar || "").toLowerCase().includes(q) || (l.email || "").toLowerCase().includes(q))
      && (filterTipo === "Todos" || l.tipo === filterTipo)
      && (filterEstado === "Todos" || l.estado === filterEstado)
      && (filterFuente === "Todos" || l.fuente === filterFuente);
  }), [leads, search, filterTipo, filterEstado, filterFuente]);

  const kpis = useMemo(() => ({
    total: leads.length,
    res: leads.filter(l => l.tipo === "Unidad Residencial").length,
    adm: leads.filter(l => l.tipo === "Administrador").length,
    won: leads.filter(l => l.estado === "Cerrado / Ganado").length,
  }), [leads]);

  const leadsFrios = leads.filter(l => l.estado !== "Cerrado / Ganado" && diasDesde(l.ultimo_contacto || l.created_at) > DIAS_FRIO);

  const navItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { id: "leads", icon: Users, label: "Leads" },
    { id: "tareas", icon: CheckSquare, label: "Tareas" },
    { id: "pipeline", icon: TrendingUp, label: "Pipeline" },
    { id: "reportes", icon: BarChart2, label: "Reportes" },
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
            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1A1A1A", margin: 0 }}>
              {{ dashboard: "Dashboard", leads: "Gestión de Leads", tareas: "Tareas y Seguimientos", pipeline: "Pipeline de Ventas", reportes: "Reportes y Métricas" }[nav]}
            </h1>
            <p style={{ fontSize: 10, color: "#bbb", fontWeight: 600, margin: 0 }}>Valle de Aburrá · {new Date().toLocaleDateString("es-CO", { dateStyle: "long" })}</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {leadsFrios.length > 0 && (
              <button onClick={() => setNav("leads")} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fef2f2", border: "1.5px solid #fecaca", color: "#ef4444", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <AlertTriangle size={12} /> {leadsFrios.length} fríos
              </button>
            )}
            {nav === "leads" && (
              <button onClick={exportarExcel} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1.5px solid #bbf7d0", color: "#16a34a", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                <FileSpreadsheet size={13} /> Exportar Excel
              </button>
            )}
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(130,10,209,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={15} color={PRIMARY} />
            </div>
          </div>
        </header>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <Loader2 size={32} color={PRIMARY} style={{ animation: "spin 1s linear infinite" }} />
            <p style={{ fontSize: 13, color: "#bbb", fontWeight: 600 }}>Cargando CRM...</p>
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

                {leadsFrios.length > 0 && (
                  <div style={{ background: "#fff5f5", borderRadius: 14, padding: 16, border: "1.5px solid #fecaca", marginBottom: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <AlertTriangle size={16} color="#ef4444" />
                      <span style={{ fontWeight: 800, fontSize: 13, color: "#ef4444" }}>{leadsFrios.length} leads sin contacto hace más de {DIAS_FRIO} días</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {leadsFrios.slice(0, 4).map(l => (
                        <div key={l.id} onClick={() => setPanel(l)} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 12px", borderRadius: 10, cursor: "pointer", border: "1px solid #fee2e2" }}>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#333" }}>{l.nombre}</span>
                            <span style={{ fontSize: 11, color: "#bbb", marginLeft: 8 }}>{l.lugar}</span>
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", background: "#fee2e2", padding: "2px 8px", borderRadius: 20 }}>{diasDesde(l.ultimo_contacto || l.created_at)}d</span>
                          <StatusBadge estado={l.estado} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
                    <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: "#1A1A1A" }}>Por Estado</h3>
                    {ESTADOS.map(({ label, color, bg, icon: Icon }) => {
                      const count = leads.filter(l => l.estado === label).length;
                      const pct = leads.length ? Math.round((count / leads.length) * 100) : 0;
                      return (
                        <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ background: bg, padding: 5, borderRadius: 7 }}><Icon size={12} color={color} /></div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#555", width: 130, flexShrink: 0 }}>{label}</span>
                          <div style={{ flex: 1, height: 6, background: "#f3f4f6", borderRadius: 10, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 10 }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 800, color, width: 28, textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ background: "#fff", borderRadius: 16, padding: 22, border: "1px solid #f0ebf7" }}>
                    <h3 style={{ fontWeight: 800, fontSize: 14, marginBottom: 16, color: "#1A1A1A" }}>Recientes</h3>
                    {leads.slice(0, 5).map(l => (
                      <div key={l.id} onClick={() => setPanel(l)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 10, marginBottom: 3, cursor: "pointer" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#faf5ff"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                        <div style={{ width: 30, height: 30, borderRadius: 9, background: l.tipo === "Administrador" ? "#fffbeb" : "#f5edfd", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {l.tipo === "Administrador" ? <Users size={13} color="#f59e0b" /> : <Building2 size={13} color={PRIMARY} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A" }}>{l.nombre}</div>
                          <div style={{ fontSize: 10, color: "#bbb" }}>{l.lugar} · {l.fuente}</div>
                        </div>
                        <StatusBadge estado={l.estado} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LEADS */}
            {nav === "leads" && (
              <div>
                <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: 160 }}>
                    <Search size={13} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#ccc" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, lugar o email..." style={{ width: "100%", paddingLeft: 32, paddingRight: 10, paddingTop: 9, paddingBottom: 9, borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 12, outline: "none" }} />
                  </div>
                  <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                    <option>Todos</option>{TIPOS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                    <option>Todos</option>{ESTADOS.map(e => <option key={e.label}>{e.label}</option>)}
                  </select>
                  <select value={filterFuente} onChange={e => setFilterFuente(e.target.value)} style={{ padding: "9px 10px", borderRadius: 10, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                    <option>Todos</option>
                    {FUENTES.map(f => <option key={f}>{f}</option>)}
                  </select>
                  <button onClick={() => fileRef.current.click()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 13px", borderRadius: 10, border: `1.5px solid ${SECONDARY}`, background: "#fffdf0", color: "#b88000", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700 }}>
                    <Upload size={13} /> Importar
                  </button>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleFile} />
                  <button onClick={() => setModal("new")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 15px", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${PRIMARY}, #a020f0)`, color: "#fff", cursor: "pointer", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 800 }}>
                    <Plus size={13} /> Nuevo Lead
                  </button>
                </div>
                {/* Barra de acciones masivas */}
                {seleccionados.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "#f5edfd", border: `1.5px solid ${PRIMARY}30`, marginBottom: 12, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: PRIMARY }}>{seleccionados.length} seleccionados</span>
                    <div style={{ display: "flex", gap: 8, flex: 1, flexWrap: "wrap" }}>
                      <select value={bulkEstado} onChange={e => setBulkEstado(e.target.value)}
                        style={{ padding: "6px 10px", borderRadius: 8, border: "1.5px solid #ede8f7", background: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, outline: "none", cursor: "pointer" }}>
                        <option value="">Cambiar estado a...</option>
                        {ESTADOS.map(e => <option key={e.label} value={e.label}>{e.label}</option>)}
                      </select>
                      <button onClick={cambiarEstadoMasivo} disabled={!bulkEstado}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: bulkEstado ? PRIMARY : "#e5e7eb", color: "#fff", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: bulkEstado ? "pointer" : "not-allowed" }}>
                        Aplicar
                      </button>
                      <button onClick={eliminarSeleccionados}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        🗑 Eliminar seleccionados
                      </button>
                      <button onClick={() => setSeleccionados([])}
                        style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid #ede8f7", background: "#fff", color: "#888", fontFamily: "Montserrat, sans-serif", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

              <p style={{ fontSize: 11, color: "#bbb", fontWeight: 600, marginBottom: 10 }}>
                {filtered.length} de {leads.length} leads · clic en una fila para ver detalle
              </p>
                <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #f0ebf7", overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                      <thead>
                        <tr style={{ background: "#faf5ff" }}>
                          <th style={{ padding: "10px 10px 10px 14px", borderBottom: "1px solid #f0ebf7" }}>
                            <input type="checkbox"
                              checked={seleccionados.length === filtered.length && filtered.length > 0}
                              onChange={toggleSelectAll}
                              style={{ cursor: "pointer", accentColor: PRIMARY, width: 14, height: 14 }} />
                          </th>
                          {["Lead", "Tipo", "Lugar", "Celular", "Fuente", "Estado", "Actividad", ""].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 9, fontWeight: 800, color: "#bbb", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid #f0ebf7" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                            {filtered.map((l, i) => {
                              const dias = diasDesde(l.ultimo_contacto || l.created_at);
                              const frio = dias > DIAS_FRIO && l.estado !== "Cerrado / Ganado";
                              return (
                                <tr key={l.id} onClick={() => setPanel(l)} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #faf5ff" : "none", cursor: "pointer", background: frio ? "#fff8f8" : "transparent" }}
                                  onMouseEnter={e => e.currentTarget.style.background = frio ? "#fff0f0" : "#faf5ff"}
                                  onMouseLeave={e => e.currentTarget.style.background = frio ? "#fff8f8" : "transparent"}>

                                  {/* ── CHECKBOX ── */}
                                  <td style={{ padding: "10px 10px 10px 14px" }} onClick={e => e.stopPropagation()}>
                                    <input type="checkbox"
                                      checked={seleccionados.includes(l.id)}
                                      onChange={() => setSeleccionados(p => p.includes(l.id) ? p.filter(id => id !== l.id) : [...p, l.id])}
                                      style={{ cursor: "pointer", accentColor: PRIMARY, width: 14, height: 14 }} />
                                  </td>

                                  {/* ── NOMBRE ── */}
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

                                  {/* ── TIPO ── */}
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: l.tipo === "Administrador" ? "#fffbeb" : "#f5edfd", color: l.tipo === "Administrador" ? "#f59e0b" : PRIMARY }}>
                                      {l.tipo === "Unidad Residencial" ? "Residencial" : "Admin"}
                                    </span>
                                  </td>

                                  {/* ── LUGAR ── */}
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 11, color: "#777", display: "flex", alignItems: "center", gap: 3 }}>
                                      <MapPin size={10} color="#ccc" />{l.lugar}
                                    </span>
                                  </td>

                                  {/* ── CELULAR ── */}
                                  <td style={{ padding: "10px 14px" }}>
                                    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                                      <span style={{ fontSize: 11, color: "#999" }}>{l.celular}</span>
                                      {l.celular && (
                                        <button onClick={e => { e.stopPropagation(); setWaModal(l); }}
                                          style={{ background: "#25D36615", color: "#25D366", padding: "2px 7px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: "none", cursor: "pointer" }}>WA</button>
                                      )}
                                    </div>
                                  </td>

                                  {/* ── FUENTE ── */}
                                  <td style={{ padding: "10px 14px" }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: "#aaa" }}>{l.fuente}</span>
                                  </td>

                                  {/* ── ESTADO ── */}
                                  <td style={{ padding: "10px 14px" }} onClick={e => e.stopPropagation()}>
                                    <StatusDropdown value={l.estado} onChange={v => updateEstado(l.id, v)} />
                                  </td>

                                  {/* ── ACTIVIDAD ── */}
                                  <td style={{ padding: "10px 14px" }}>
                                    {frio ? (
                                      <span style={{ fontSize: 10, fontWeight: 700, color: "#ef4444", background: "#fee2e2", padding: "2px 8px", borderRadius: 20, display: "flex", alignItems: "center", gap: 3, width: "fit-content" }}>
                                        <AlertTriangle size={9} />{dias}d
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 10, color: "#bbb" }}>{dias === 0 ? "hoy" : `${dias}d`}</span>
                                    )}
                                  </td>

                                  {/* ── ACCIONES ── */}
                                  <td style={{ padding: "10px 14px" }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: "flex", gap: 4 }}>
                                      <button onClick={() => setModal(l)} style={{ padding: 5, borderRadius: 6, border: "none", background: "#f5edfd", cursor: "pointer" }}>
                                        <Pencil size={11} color={PRIMARY} />
                                      </button>
                                      <button onClick={() => deleteLead(l.id)} style={{ padding: 5, borderRadius: 6, border: "none", background: "#fef2f2", cursor: "pointer" }}>
                                        <Trash2 size={11} color="#ef4444" />
                                      </button>
                                    </div>
                                  </td>

                                </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filtered.length === 0 && (
                      <div style={{ textAlign: "center", padding: 40, color: "#e0d0f5" }}>
                        <p style={{ fontWeight: 700, fontSize: 13 }}>Sin resultados</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {nav === "tareas" && <TareasView />}

            {nav === "reportes" && <ReportesView leads={leads} />}

            {/* PIPELINE */}
            {nav === "pipeline" && (
              <div>
                <p style={{ fontSize: 11, color: "#bbb", marginBottom: 16, fontWeight: 600 }}>Vista Kanban · {leads.length} leads · clic en una tarjeta para ver detalle</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
                  {ESTADOS.map(({ label, color, bg, icon: Icon }) => {
                    const col = leads.filter(l => l.estado === label);
                    return (
                      <div key={label} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #f0ebf7" }}>
                        <div style={{ background: bg, padding: "12px 14px", borderBottom: `3px solid ${color}` }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><Icon size={12} color={color} strokeWidth={2.5} /><span style={{ fontSize: 9, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span></div>
                          <span style={{ fontSize: 24, fontWeight: 800, color: "#1A1A1A" }}>{col.length}</span>
                        </div>
                        <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, maxHeight: 380, overflowY: "auto" }}>
                          {col.map(l => {
                            const frio = diasDesde(l.ultimo_contacto || l.created_at) > DIAS_FRIO;
                            return (
                              <div key={l.id} onClick={() => setPanel(l)} style={{ background: frio ? "#fff8f8" : "#faf7fe", borderRadius: 10, padding: "10px 12px", border: `1px solid ${frio ? "#fecaca" : "#f0e8fb"}`, cursor: "pointer" }}>
                                <div style={{ fontWeight: 700, fontSize: 11, color: "#1A1A1A", marginBottom: 4 }}>{l.nombre}</div>
                                <div style={{ fontSize: 10, color: "#bbb", display: "flex", alignItems: "center", gap: 3 }}><MapPin size={9} />{l.lugar}</div>
                                {frio && <div style={{ fontSize: 9, color: "#ef4444", fontWeight: 700, marginTop: 4 }}>⚠ {diasDesde(l.ultimo_contacto || l.created_at)}d sin contacto</div>}
                              </div>
                            );
                          })}
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

      {modal && <LeadModal lead={modal === "new" ? null : modal} onClose={() => setModal(null)} onSave={save} saving={saving} />}
      {panel && <LeadPanel lead={panel} onClose={() => setPanel(null)} onUpdate={fetchLeads} onWhatsApp={setWaModal} />}
      {waModal && <WhatsAppModal lead={waModal} onClose={() => setWaModal(null)} />}
    </div>
  );
}