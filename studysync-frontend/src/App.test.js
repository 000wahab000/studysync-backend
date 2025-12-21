import React, { useState, useEffect } from "react";

const BACKEND_URL = "http://localhost:3000";  // change 5000 to your backend port

function App() {
  const [subject, setSubject] = useState("");
  const [focus, setFocus] = useState(3);
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/study/all`);
      const data = await res.json();
      setSessions(data);
      setMessage("Sessions loaded");
    } catch (err) {
      console.error(err);
      setMessage("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const startSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/study/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, focus: Number(focus) })
      });
      const data = await res.json();
      setSessionId(data.id || data.sessionId || "");
      setMessage("Session started");
      await loadSessions();
    } catch (err) {
      console.error(err);
      setMessage("Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/study/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId })
      });
      await res.json();
      setMessage("Session ended");
      await loadSessions();
    } catch (err) {
      console.error(err);
      setMessage("Failed to end session");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", color: "#e5e7eb", padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>StudySync Dashboard</h1>

      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div style={{ background: "#111827", padding: "1rem", borderRadius: "0.75rem", flex: "1 1 260px" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Start session</h2>
          <input
            placeholder="Subject"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
          <input
            type="number"
            min="1"
            max="5"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
          <button
            onClick={startSession}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#22c55e", border: "none", color: "#022c22", fontWeight: 600 }}
          >
            Start
          </button>
        </div>

        <div style={{ background: "#111827", padding: "1rem", borderRadius: "0.75rem", flex: "1 1 260px" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>End session</h2>
          <input
            placeholder="Session ID"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
          <button
            onClick={endSession}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#f97316", border: "none", color: "#111827", fontWeight: 600 }}
          >
            End
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={loadSessions}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#3b82f6", border: "none", color: "#e5e7eb", fontWeight: 600 }}
        >
          Reload sessions
        </button>
        <span style={{ marginLeft: "1rem", color: "#9ca3af" }}>
          {loading ? "Loading..." : message}
        </span>
      </div>

      <h2 style={{ marginBottom: "0.5rem" }}>All sessions</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#020617", borderRadius: "0.75rem", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#111827" }}>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>ID</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>Subject</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>Focus</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>Start</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>End</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>Duration</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((s, i) => (
            <tr key={s.id || s._id || i} style={{ borderBottom: "1px solid #111827" }}>
              <td style={{ padding: "0.5rem" }}>{s.id || s._id}</td>
              <td style={{ padding: "0.5rem" }}>{s.subject}</td>
              <td style={{ padding: "0.5rem" }}>{s.focus}</td>
              <td style={{ padding: "0.5rem" }}>{s.startTime}</td>
              <td style={{ padding: "0.5rem" }}>{s.endTime || "-"}</td>
              <td style={{ padding: "0.5rem" }}>{s.durationMinutes ?? "-"}</td>
            </tr>
          ))}
          {sessions.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: "0.5rem", textAlign: "center", color: "#6b7280" }}>
                No sessions yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;
