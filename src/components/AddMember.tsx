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
    showToast(`✅ ${name} agregado`);
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
                if (confirm(`¿Eliminar "${g.name}"?`)) { await removeGroup({ id: g._id }); showToast("Eliminado"); }
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
}
