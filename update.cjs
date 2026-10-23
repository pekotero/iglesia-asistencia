const fs = require('fs');
const path = require('path');

const files = {
  // 1. SCHEMA ACTUALIZADO (Con tabla de grupos)
  'convex/schema.ts': `
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  members: defineTable({
    name: v.string(),
    phone: v.optional(v.string()),
    birthDate: v.optional(v.string()),
    group: v.string(),
    active: v.boolean(),
    createdAt: v.number(),
  }),
  meetingTypes: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),
  groups: defineTable({
    name: v.string(),
    createdAt: v.number(),
  }),
  attendance: defineTable({
    date: v.string(),
    title: v.optional(v.string()),
    records: v.array(
      v.object({
        memberId: v.id("members"),
        memberName: v.string(),
        present: v.boolean(),
      })
    ),
    totalPresent: v.number(),
    totalAbsent: v.number(),
    createdAt: v.number(),
  }),
});`,

  // 2. NUEVO BACKEND DE GRUPOS
  'convex/groups.ts': `
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const groups = await ctx.db.query("groups").collect();
    return groups.sort((a, b) => a.name.localeCompare(b.name));
  },
});

export const add = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const clean = args.name.trim();
    if (!clean) return;
    const existing = await ctx.db.query("groups").collect();
    if (existing.some((g) => g.name.toLowerCase() === clean.toLowerCase())) return;
    await ctx.db.insert("groups", { name: clean, createdAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("groups") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});`,

  // 3. ADD MEMBER (Con grupos editables y defaults)
  'src/components/AddMember.tsx': `
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props { showToast: (msg: string) => void; }

export function AddMember({ showToast }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showManageGroups, setShowManageGroups] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [group, setGroup] = useState("");
  const [newGroup, setNewGroup] = useState("");

  const groups = useQuery(api.groups.getAll);
  const addMember = useMutation(api.members.add);
  const addGroup = useMutation(api.groups.add);
  const removeGroup = useMutation(api.groups.remove);

  useEffect(() => {
    if (groups && groups.length === 0) {
      const defaults = ["Servidores", "Encargados", "Danza", "Alabanza", "Preadolescentes", "Adolescentes", "Jóvenes", "Mujeres", "Varones"];
      defaults.forEach((n) => addGroup({ name: n }));
    }
  }, [groups]);

  useEffect(() => {
    if (groups && groups.length > 0 && !group) {
      setGroup(groups[0].name);
    }
  }, [groups]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addMember({ name: name.trim(), phone, birthDate, group });
    setName(""); setPhone(""); setBirthDate("");
    showToast(\`✅ \${name} agregado\`);
    setShowForm(false);
  };

  const handleAddGroup = async () => {
    if (!newGroup.trim()) return;
    await addGroup({ name: newGroup.trim() });
    setNewGroup("");
    showToast("✅ Grupo agregado");
  };

  return (
    <div className="card">
      <div className="btn-group">
        <button className="btn btn-primary" style={{flex: 1}} onClick={() => {setShowForm(!showForm); setShowManageGroups(false);}}>
          {showForm ? "Cerrar" : "➕ Nueva Persona"}
        </button>
        <button className="btn btn-outline" onClick={() => {setShowManageGroups(!showManageGroups); setShowForm(false);}}>
          ⚙️ Grupos
        </button>
      </div>

      {showManageGroups && (
        <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12, marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="form-input" placeholder="Nuevo grupo..." value={newGroup} onChange={(e) => setNewGroup(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={handleAddGroup}>➕</button>
          </div>
          {groups?.map((g) => (
            <div key={g._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
              <span>{g.name}</span>
              <button className="btn btn-outline btn-sm" onClick={async () => {
                if (confirm(\`¿Eliminar "\${g.name}"?\`)) { await removeGroup({ id: g._id }); showToast("Eliminado"); }
              }}>🗑️</button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Grupo *</label>
            <select className="form-select" value={group} onChange={(e) => setGroup(e.target.value)}>
              {groups?.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Guardar</button>
        </form>
      )}
    </div>
  );
}`,

  // 4. MEMBER LIST (Listas dinámicas por grupo)
  'src/components/MemberList.tsx': `
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface Props { members: Doc<"members">[] | undefined; showToast: (msg: string) => void; }

export function MemberList({ members, showToast }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirth, setEditBirth] = useState("");
  const [editGroup, setEditGroup] = useState("");

  const groups = useQuery(api.groups.getAll) || [];
  const updateMember = useMutation(api.members.update);
  const deactivateMember = useMutation(api.members.deactivate);

  if (!members) return null;

  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (m: Doc<"members">) => {
    setEditingId(m._id); setEditName(m.name); setEditPhone(m.phone || "");
    setEditBirth(m.birthDate || ""); setEditGroup(m.group || (groups[0]?.name || ""));
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateMember({ id: editingId as Id<"members">, name: editName, phone: editPhone, birthDate: editBirth, group: editGroup });
    setEditingId(null); showToast("✅ Guardado");
  };

  const renderList = (list: Doc<"members">[], title: string) => {
    if (list.length === 0) return null;
    return (
      <div className="card" style={{ marginTop: 16 }} key={title}>
        <div className="card-title" style={{ marginBottom: 12 }}>📁 {title} ({list.length})</div>
        {list.map((m) => (
          <div key={m._id} className="member-item">
            {editingId === m._id ? (
              <div style={{ flex: 1 }}>
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 8 }} />
                <input className="form-input" placeholder="Teléfono" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ marginBottom: 8 }} />
                <input type="date" className="form-input" value={editBirth} onChange={(e) => setEditBirth(e.target.value)} style={{ marginBottom: 8 }} />
                <select className="form-select" value={editGroup} onChange={(e) => setEditGroup(e.target.value)} style={{ marginBottom: 8 }}>
                  {groups.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
                </select>
                <div className="btn-group">
                  <button className="btn btn-primary btn-sm" onClick={saveEdit}>Guardar</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="member-info">
                  <div className="member-avatar">{m.name.charAt(0)}</div>
                  <div className="member-details">
                    <h4>{m.name}</h4>
                    <span className="member-meta">
                      {m.phone && \`📱 \${m.phone}\`} {m.phone && m.birthDate && " • "} {m.birthDate && \`🎂 \${m.birthDate}\`}
                    </span>
                  </div>
                </div>
                <div className="member-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => startEdit(m)}>✏️</button>
                  <button className="btn btn-outline btn-sm" onClick={async () => {
                    if (confirm(\`¿Quitar a \${m.name}?\`)) { await deactivateMember({ id: m._id as Id<"members"> }); showToast("Eliminado"); }
                  }}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    );
  };

  const groupNames = groups.map(g => g.name);
  const sinGrupo = filtered.filter((m) => !groupNames.includes(m.group));

  return (
    <>
      <div className="card">
        <input className="form-input" placeholder="🔍 Buscar persona..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      
      {sinGrupo.length > 0 && (
        <div style={{ background: "#fef3c7", border: "1px solid #d97706", padding: 14, borderRadius: 12, marginTop: 16, fontSize: "0.9rem" }}>
          ⚠️ Tenés <strong>{sinGrupo.length}</strong> persona(s) sin grupo asignado. Tocá el ✏️ y asignales un grupo.
        </div>
      )}
      
      {renderList(sinGrupo, "Sin Grupo")}
      {groups.map((g) => renderList(filtered.filter((m) => m.group === g.name), g.name))}
    </>
  );
}`,

  // 5. ATTENDANCE FORM (Filtro por dropdown para ahorrar espacio)
  'src/components/AttendanceForm.tsx': `
import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { generatePDF } from "../utils/pdfGenerator";

interface Props { members: Doc<"members">[] | undefined; showToast: (msg: string) => void; }

export function AttendanceForm({ members, showToast }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [newType, setNewType] = useState("");
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [filterGroup, setFilterGroup] = useState("Todos");

  const meetingTypes = useQuery(api.meetingTypes.getAll);
  const groups = useQuery(api.groups.getAll);
  
  const saveAttendance = useMutation(api.attendance.save);
  const addType = useMutation(api.meetingTypes.add);
  const removeType = useMutation(api.meetingTypes.remove);

  useEffect(() => {
    if (meetingTypes && meetingTypes.length > 0 && !title) setTitle(meetingTypes[0].name);
  }, [meetingTypes]);

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => {
      const matchName = m.name.toLowerCase().includes(search.toLowerCase());
      const matchGroup = filterGroup === "Todos" || m.group === filterGroup;
      return matchName && matchGroup;
    });
  }, [members, search, filterGroup]);

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (filtered.length === 0) return;
    const allSelected = filtered.every((m) => presentIds.has(m._id));
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((m) => next.delete(m._id));
      else filtered.forEach((m) => next.add(m._id));
      return next;
    });
  };

  const handleSave = async () => {
    if (!members || members.length === 0 || !title) return;
    const records = members.map((m) => ({ memberId: m._id as Id<"members">, memberName: m.name, present: presentIds.has(m._id) }));
    await saveAttendance({ date, title, records });
    setSaved(true); showToast("✅ Asistencia guardada");
  };

  if (!members) return <div className="loading"><div className="spinner" /></div>;

  const totalPresent = presentIds.size;
  const totalAbsent = members.length - totalPresent;

  return (
    <>
      <div className="card no-print">
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de reunión</label>
          <select className="form-select" value={title} onChange={(e) => setTitle(e.target.value)}>
            {meetingTypes?.map((t) => <option key={t._id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setShowManageTypes(!showManageTypes)}>
          {showManageTypes ? "Cerrar" : "⚙️ Tipos de reunión"}
        </button>
        {showManageTypes && (
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 12, marginTop: 8 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input className="form-input" placeholder="Nuevo tipo..." value={newType} onChange={(e) => setNewType(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={async () => {
                if(newType) { await addType({name: newType}); setTitle(newType); setNewType(""); showToast("Agregado"); }
              }}>➕</button>
            </div>
            {meetingTypes?.map((t) => (
              <div key={t._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #e2e8f0" }}>
                <span>{t.name}</span>
                <button className="btn btn-outline btn-sm" onClick={async () => {
                  if (confirm(\`¿Eliminar \${t.name}?\`)) { await removeType({ id: t._id }); }
                }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="stats-row">
        <div className="stat-card total"><div className="stat-number">{members.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card present"><div className="stat-number">{totalPresent}</div><div className="stat-label">Presentes</div></div>
        <div className="stat-card absent"><div className="stat-number">{totalAbsent}</div><div className="stat-label">Ausentes</div></div>
      </div>

      <div className="card">
        <div className="form-group no-print">
          <label className="form-label">Filtrar lista por grupo</label>
          <select className="form-select" value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
            <option value="Todos">Todos los grupos</option>
            {groups?.map((g) => <option key={g._id} value={g.name}>{g.name}</option>)}
          </select>
        </div>
        <div className="search-box no-print">
          <input className="form-input" placeholder="🔍 Buscar persona..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="select-all-bar no-print">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" className="attendance-checkbox" checked={filtered.length > 0 && filtered.every((m) => presentIds.has(m._id))} onChange={selectAll} />
            Marcar visibles
          </label>
        </div>
        {filtered.map((m) => (
          <div key={m._id} className={\`attendance-item \${presentIds.has(m._id) ? "present" : ""}\`} onClick={() => toggle(m._id)}>
            <input type="checkbox" className="attendance-checkbox" checked={presentIds.has(m._id)} onChange={() => toggle(m._id)} onClick={(e) => e.stopPropagation()} />
            <div className="member-avatar">{m.name.charAt(0)}</div>
            <div style={{ flex: 1 }}>
              <div className="attendance-name">{m.name}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-light)" }}>{m.group}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card no-print">
        <div className="btn-group" style={{ flexDirection: "column" }}>
          <button className="btn btn-primary btn-block" onClick={handleSave}>💾 {saved ? "Actualizar" : "Guardar"} Asistencia</button>
          <button className="btn btn-outline btn-block" onClick={() => generatePDF(date, title, members.map(m => ({ name: m.name, group: m.group || "", present: presentIds.has(m._id) })))}>📄 Descargar PDF</button>
        </div>
      </div>
    </>
  );
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const fullPath = path.join(__dirname, filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`✅ Actualizado: ${filePath}`);
});