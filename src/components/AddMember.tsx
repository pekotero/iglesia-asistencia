import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props { showToast: (msg: string) => void; }

export function AddMember({ showToast }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [group, setGroup] = useState("Servidores");

  const addMember = useMutation(api.members.add);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await addMember({ name: name.trim(), phone, birthDate, group });
    setName(""); setPhone(""); setBirthDate(""); setGroup("Servidores");
    showToast(`✅ ${name} agregado a ${group}`);
    setShowForm(false);
  };

  return (
    <div className="card">
      <button className="btn btn-primary btn-block" onClick={() => setShowForm(!showForm)}>
        {showForm ? "Cerrar" : "➕ Agregar Nueva Persona"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="form-group">
            <label className="form-label">Nombre completo *</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono</label>
            <input type="tel" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 11 2345 6789" />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de Nacimiento</label>
            <input type="date" className="form-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Grupo *</label>
            <select className="form-select" value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="Servidores">Servidores</option>
              <option value="Encargados">Encargados</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 10 }}>Guardar</button>
        </form>
      )}
    </div>
  );
}