import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props { showToast: (msg: string) => void; }

export function AddMember({ showToast }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("General");
  const [bulkText, setBulkText] = useState("");

  const addMember = useMutation(api.members.add);
  const addBulk = useMutation(api.members.addBulk);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addMember({ name: name.trim(), phone, group });
    setName(""); setPhone(""); setGroup("General");
    showToast(`✅ ${name} agregado`);
    setShowForm(false);
  };

  const handleBulk = async () => {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;
    const members = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      return { name: parts[0], phone: parts[1] || undefined, group: parts[2] || "General" };
    });
    await addBulk({ members });
    setBulkText(""); setShowBulk(false);
    showToast(`✅ ${members.length} miembros agregados`);
  };

  return (
    <div className="card">
      <div className="card-title">➕ Agregar Miembros</div>
      <div className="btn-group" style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => { setShowForm(!showForm); setShowBulk(false); }}>
          👤 Agregar Uno
        </button>
        <button className="btn btn-outline btn-sm" onClick={() => { setShowBulk(!showBulk); setShowForm(false); }}>
          📋 Agregar Varios
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Juan Pérez" required />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono (opcional)</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 55 1234 5678" />
          </div>
          <div className="form-group">
            <label className="form-label">Grupo</label>
            <select className="form-select" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="General">General</option>
              <option value="Jóvenes">Jóvenes</option>
              <option value="Adultos">Adultos</option>
              <option value="Niños">Niños</option>
              <option value="Matrimonios">Matrimonios</option>
              <option value="Líderes">Líderes</option>
              <option value="Músicos">Músicos</option>
            </select>
          </div>
          <button type="submit" className="btn btn-success btn-block">✅ Guardar</button>
        </form>
      )}

      {showBulk && (
        <div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-light)", marginBottom: 12 }}>
            Un nombre por línea. Opcional: nombre, teléfono, grupo (separados por coma)
          </p>
          <div className="form-group">
            <textarea className="form-textarea" value={bulkText} onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Juan Pérez\nMaría García, 55 1234 5678, Jóvenes\nPedro López"} />
          </div>
          <button className="btn btn-success btn-block" onClick={handleBulk}>
            ✅ Agregar Todos ({bulkText.split("\n").filter((l) => l.trim()).length})
          </button>
        </div>
      )}
    </div>
  );
}