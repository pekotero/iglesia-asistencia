import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { generatePDF } from "../utils/pdfGenerator";

interface Props { members: Doc<"members">[] | undefined; showToast: (msg: string) => void; }

export function AttendanceForm({ members, showToast }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("Asistencia Reunion General");
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const saveAttendance = useMutation(api.attendance.save);
  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));
  }, [members, search]);

  const toggle = (id: string) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!members) return;
    if (presentIds.size === members.length) setPresentIds(new Set());
    else setPresentIds(new Set(members.map((m) => m._id)));
  };

  const handleSave = async () => {
    if (!members || members.length === 0) return;
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
            <option>Asistencia Reunion General</option>
            <option>Asistencia Oracion</option>
            <option>Asistencia casa de Paz</option>
            <option>Entrevistas</option>
          </select>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card total"><div className="stat-number">{members.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card present"><div className="stat-number">{totalPresent}</div><div className="stat-label">Presentes</div></div>
        <div className="stat-card absent"><div className="stat-number">{totalAbsent}</div><div className="stat-label">Ausentes</div></div>
      </div>

      <div className="card">
        <div className="search-box no-print">
          <input className="form-input" placeholder="🔍 Buscar persona..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="select-all-bar no-print">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" className="attendance-checkbox" checked={presentIds.size === members.length && members.length > 0} onChange={selectAll} />
            Marcar Todos
          </label>
        </div>
        {filtered.map((m) => (
          <div key={m._id} className={`attendance-item ${presentIds.has(m._id) ? "present" : ""}`} onClick={() => toggle(m._id)}>
            <input type="checkbox" className="attendance-checkbox" checked={presentIds.has(m._id)} onChange={() => toggle(m._id)} onClick={(e) => e.stopPropagation()} />
            <div className="member-avatar">{m.name.charAt(0)}</div>
            <span className="attendance-name">{m.name}</span>
          </div>
        ))}
      </div>

      <div className="card no-print">
        <div className="btn-group" style={{ flexDirection: "column" }}>
          <button className="btn btn-primary btn-block" onClick={handleSave}>💾 {saved ? "Actualizar" : "Guardar"} Asistencia</button>
          <button className="btn btn-outline btn-block" onClick={() => {
            const records = members.map((m) => ({ name: m.name, group: m.group || "", present: presentIds.has(m._id) }));
            generatePDF(date, title, records);
          }}>📄 Descargar PDF</button>
        </div>
      </div>
    </>
  );
}