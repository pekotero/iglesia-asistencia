import { useState, useMemo } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { generatePDF } from "../utils/pdfGenerator";

interface Props {
  members: Doc<"members">[] | undefined;
  showToast: (msg: string) => void;
}

export function AttendanceForm({ members, showToast }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("Culto Dominical");
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
    const records = members.map((m) => ({
      memberId: m._id as Id<"members">, memberName: m.name, present: presentIds.has(m._id),
    }));
    await saveAttendance({ date, title, records });
    setSaved(true);
    showToast("✅ Asistencia guardada");
  };

  const handlePDF = () => {
    if (!members) return;
    const records = members.map((m) => ({
      name: m.name, group: m.group || "General", present: presentIds.has(m._id),
    }));
    generatePDF(date, title, records);
    showToast("📄 PDF generado");
  };

  if (!members) return <div className="loading"><div className="spinner" /> Cargando...</div>;
  if (members.length === 0) return (
    <div className="card"><div className="empty-state"><div className="emoji">👥</div><p>Agrega miembros primero en la pestaña "Miembros"</p></div></div>
  );

  const totalPresent = presentIds.size;
  const totalAbsent = members.length - totalPresent;

  return (
    <>
      <div className="card no-print">
        <div className="card-title">📝 Datos de la Reunión</div>
        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Tipo de reunión</label>
          <select className="form-select" value={title} onChange={(e) => setTitle(e.target.value)}>
            <option>Culto Dominical</option><option>Estudio Bíblico</option>
            <option>Reunión de Oración</option><option>Reunión de Jóvenes</option>
            <option>Ensayo de Música</option><option>Reunión de Líderes</option>
            <option>Evento Especial</option>
          </select>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card total"><div className="stat-number">{members.length}</div><div className="stat-label">Total</div></div>
        <div className="stat-card present"><div className="stat-number">{totalPresent}</div><div className="stat-label">Presentes</div></div>
        <div className="stat-card absent"><div className="stat-number">{totalAbsent}</div><div className="stat-label">Ausentes</div></div>
      </div>

      <div className="card">
        <div className="card-title">✅ Pasar Lista</div>
        <div className="search-box no-print">
          <input className="form-input" placeholder="🔍 Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="select-all-bar no-print">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" className="attendance-checkbox" checked={presentIds.size === members.length} onChange={selectAll} />
            Todos
          </label>
          <span>{totalPresent}/{members.length}</span>
        </div>
        {filtered.map((m) => (
          <div key={m._id} className={`attendance-item ${presentIds.has(m._id) ? "present" : ""}`} onClick={() => toggle(m._id)}>
            <input type="checkbox" className="attendance-checkbox" checked={presentIds.has(m._id)}
              onChange={() => toggle(m._id)} onClick={(e) => e.stopPropagation()} />
            <div className="member-avatar" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{m.name.charAt(0)}</div>
            <span className="attendance-name">{m.name}</span>
            <span className={`attendance-badge ${presentIds.has(m._id) ? "badge-present" : "badge-absent"}`}>
              {presentIds.has(m._id) ? "✓" : "✗"}
            </span>
          </div>
        ))}
      </div>

      <div className="card no-print">
        <div className="btn-group" style={{ flexDirection: "column" }}>
          <button className="btn btn-success btn-block" onClick={handleSave}>💾 {saved ? "Actualizar" : "Guardar"} Asistencia</button>
          <button className="btn btn-primary btn-block" onClick={handlePDF}>📄 Descargar PDF</button>
          <button className="btn btn-outline btn-block" onClick={() => window.print()}>🖨️ Imprimir</button>
          {saved && <button className="btn btn-secondary btn-block" onClick={() => { setPresentIds(new Set()); setSaved(false); }}>🔄 Nueva Lista</button>}
        </div>
      </div>
    </>
  );
}