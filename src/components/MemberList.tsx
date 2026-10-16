import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface Props { members: Doc<"members">[] | undefined; showToast: (msg: string) => void; }

export function MemberList({ members, showToast }: Props) {
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBirth, setEditBirth] = useState("");

  const updateMember = useMutation(api.members.update);
  const deactivateMember = useMutation(api.members.deactivate);

  if (!members) return null;
  const filtered = members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()));

  const startEdit = (m: Doc<"members">) => {
    setEditingId(m._id); setEditName(m.name); setEditPhone(m.phone || ""); setEditBirth(m.birthDate || "");
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await updateMember({ id: editingId as Id<"members">, name: editName, phone: editPhone, birthDate: editBirth, group: "General" });
    setEditingId(null); showToast("✅ Guardado");
  };

  return (
    <div className="card">
      <div className="search-box">
        <input className="form-input" placeholder="🔍 Buscar persona..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      {filtered.map((m) => (
        <div key={m._id} className="member-item">
          {editingId === m._id ? (
            <div style={{ flex: 1 }}>
              <input className="form-input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 8 }} />
              <input className="form-input" placeholder="Teléfono" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ marginBottom: 8 }} />
              <input type="date" className="form-input" value={editBirth} onChange={(e) => setEditBirth(e.target.value)} style={{ marginBottom: 8 }} />
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
                    {m.phone && `📱 ${m.phone}`} {m.phone && m.birthDate && ' • '}
                    {m.birthDate && `🎂 ${new Date(m.birthDate).toLocaleDateString('es-ES')}`}
                  </span>
                </div>
              </div>
              <div className="member-actions">
                <button className="btn btn-outline btn-sm" onClick={() => startEdit(m)}>✏️</button>
                <button className="btn btn-outline btn-sm" onClick={async () => {
                  if (confirm(`¿Quitar a ${m.name}?`)) { await deactivateMember({ id: m._id as Id<"members"> }); }
                }}>🗑️</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}