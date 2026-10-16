import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { MemberList } from "./components/MemberList";
import { AddMember } from "./components/AddMember";
import { AttendanceForm } from "./components/AttendanceForm";
import { AttendanceHistory } from "./components/AttendanceHistory";

type Tab = "attendance" | "members" | "history";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [toast, setToast] = useState<string | null>(null);
  const members = useQuery(api.members.getAll);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div>
      <header className="app-header">
        <h1>⛪ Asistencia Iglesia</h1>
        <p>Sistema de control de asistencia</p>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === "attendance" ? "active" : ""}`} onClick={() => setActiveTab("attendance")}>
          ✅ Pasar Lista
        </button>
        <button className={`nav-tab ${activeTab === "members" ? "active" : ""}`} onClick={() => setActiveTab("members")}>
          👥 Miembros
        </button>
        <button className={`nav-tab ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
          📋 Historial
        </button>
      </nav>

      <div className="container">
        {activeTab === "attendance" && <AttendanceForm members={members} showToast={showToast} />}
        {activeTab === "members" && (
          <>
            <AddMember showToast={showToast} />
            <MemberList members={members} showToast={showToast} />
          </>
        )}
        {activeTab === "history" && <AttendanceHistory showToast={showToast} />}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export default App;