import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { generatePDF } from "../utils/pdfGenerator";

interface Props { showToast: (msg: string) => void; }

export function AttendanceHistory({ showToast }: Props) {
  const history = useQuery(api.attendance.getAll);
  const removeAttendance = useMutation(api.attendance.remove);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!history) return <div className="loading"><div className="spinner" /> Cargando...</div>;
  if (history.length === 0) return (
    <div className="card"><div className="empty-state"><div className="emoji">📋</div><p>No hay registros aún. Pasa tu primera lista.</p></div></div>
  );

  const selected = history.find((h) => h._id === selectedId);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return new Date(Number(y), Number(m) - 1, Number(day)).toLocaleDateString("es-MX", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
  };

  const handleShare = (record: Doc<"attendance">) => {
    const present = record.records.filter((r) => r.present);
    const absent = record.records.filter((r) => !r.present);
    let text = `⛪ *Asistencia - ${record.title}*\n📅 ${formatDate(record.date)}\n\n`;
    text += `✅ *Presentes (${present.length}):*\n`;
    present.forEach((r) => { text += `  • ${r.memberName}\n`; });
    text += `\n❌ *Ausentes (${absent.length}):*\n`;
    absent.forEach((r) => { text += `  • ${r.memberName}\n`; });
    text += `\n📊 *Total: ${record.totalPresent}/${record.records.length}*`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
    showToast("📤 Abriendo WhatsApp...");
  };

  if (selected) {
    return (
      <>
        <button className="btn btn-secondary" onClick={() => setSelectedId(null)} style={{ marginBottom: 16 }}>← Volver</button>
        <div className="card" id="report-content">
          <div className="report-header">
            <h2>⛪ Reporte de Asistencia</h2>
            <p><strong>{selected.title}</strong></p>
            <p>{formatDate(selected.date)}</p>
          </div>
          <div className="stats-row">
            <div className="stat-card total"><div className="stat-number">{selected.records.length}</div><div className="stat-label">Total</div></div>
            <div className="stat-card present"><div className="stat-number">{selected.totalPresent}</div><div className="stat-label">Presentes</div></div>
            <div className="stat-card absent"><div className="stat-number">{selected.totalAbsent}</div><div className="stat-label">Ausentes</div></div>
          </div>
          <table className="report-table">
            <thead><tr><th>#</th><th>Nombre</th><th>Estado</th></tr></thead>
            <tbody>
              {selected.records.sort((a, b) => a.memberName.localeCompare(b.memberName)).map((r, i) => (
                <tr key={i}><td>{i + 1}</td><td>{r.memberName}</td>
                  <td><span className={`attendance-badge ${r.present ? "badge-present" : "badge-absent"}`}>
                    {r.present ? "✅ Presente" : "❌ Ausente"}</span></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card no-print">
          <div className="btn-group" style={{ flexDirection: "column" }}>
            <button className="btn btn-primary btn-block" onClick={() => {
              const data = selected.records.map((r) => ({ name: r.memberName, group: "", present: r.present }));
              generatePDF(selected.date, selected.title || "Reunión", data);
            }}>📄 Descargar PDF</button>
            <button className="btn btn-success btn-block" onClick={() => handleShare(selected)}>📤 Compartir por WhatsApp</button>
            <button className="btn btn-outline btn-block" onClick={() => window.print()}>🖨️ Imprimir</button>
            <button className="btn btn-danger btn-block" onClick={async () => {
              if (confirm("¿Eliminar este registro?")) {
                await removeAttendance({ id: selected._id as Id<"attendance"> });
                setSelectedId(null); showToast("🗑️ Eliminado");
              }
            }}>🗑️ Eliminar</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="card">
      <div className="card-title">📋 Historial de Asistencias</div>
      {history.map((r) => (
        <div key={r._id} className="history-item" onClick={() => setSelectedId(r._id)}>
          <div><div className="history-date">{formatDate(r.date)}</div><div className="history-title">{r.title}</div></div>
          <div><div className="history-count">✅ {r.totalPresent}/{r.records.length}</div>
            <div className="history-total">{Math.round((r.totalPresent / r.records.length) * 100)}%</div></div>
        </div>
      ))}
    </div>
  );
}