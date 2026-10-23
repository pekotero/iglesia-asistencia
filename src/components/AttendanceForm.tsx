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
                  if (confirm(`¿Eliminar ${t.name}?`)) { await removeType({ id: t._id }); }
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
          <div key={m._id} className={`attendance-item ${presentIds.has(m._id) ? "present" : ""}`} onClick={() => toggle(m._id)}>
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
}
