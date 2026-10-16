import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface Props {
  members: Doc<"members">[] | undefined;
  showToast: (msg: string) => void;
}

export function MemberList({ members, showToast }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGroup, setEditGroup] = useState("");

  const updateMember = useMutation(api.members.update);
  const deactivateMember = useMutation(api.members.deactivate);

  if (!members) return <div className="loading"><div className="spinner" /> Cargando...</div>;

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (m: Doc<"members">) => {
    setEditingId(m._id); setEditName(m.name);
    setEditPhone(m.phone || ""); setEditGroup(m.group || "General");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateMember({ id: editingId as Id<"members">, name: editName, phone: editPhone, group: editGroup });
    setEditingId(null); showToast("✅ Actualizado");
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`¿Quitar a ${name} de la lista?`)) {
      await deactivateMember({ id: id as Id<"members"> });
      showToast(`❌ ${name} desactivado`);
    }
  };

  return (
    <div className="card">
      <div className="card-title">👥 Miembros ({members.length})</div>
      <div className="search-box">
        <input className="form-input" placeholder="🔍 Buscar miembro..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="emoji">👥</div><p>No hay miembros</p></div>
      ) : (
        filtered.map((m) => (
          <div key={m._id} className="member-item">
            {editingId === m._id ? (
              <div style={{ flex: 1 }}>
                <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 8 }} />
                <input className="form-input" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Teléfono" style={{ marginBottom: 8 }} />
                <select className="form-select" value={editGroup} onChange={(e) => setEditGroup(e.target.value)} style={{ marginBottom: 8 }}>
                  <option value="General">General</option><option value="Jóvenes">Jóvenes</option>
                  <option value="Adultos">Adultos</option><option value="Niños">Niños</option>
                  <option value="Matrimonios">Matrimonios</option><option value="Líderes">Líderes</option>
                  <option value="Músicos">Músicos</option>
                </select>
                <div className="btn-group">
                  <button className="btn btn-success btn-sm" onClick={saveEdit}>💾 Guardar</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <div className="member-info">
                  <div className="member-avatar">{m.name.charAt(0).toUpperCase()}</div>
                  <div className="member-details">
                    <h4>{m.name}</h4>
                    <span>{m.phone && `📱 ${m.phone} · `}<span className="group-tag">{m.group}</span></span>
                  </div>
                </div>
                <div className="member-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => startEdit(m)}>✏️</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeactivate(m._id, m.name)}>🗑️</button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}