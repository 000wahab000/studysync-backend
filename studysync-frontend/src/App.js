import React, { useState, useEffect } from "react";
import { Pie, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { auth, provider, signInWithPopup, signOut } from "./firebaseClient";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000"; // your backend

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function App() {
  const [subject, setSubject] = useState("");
  const [focus, setFocus] = useState(3);
  const [name, setName] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ totalSessions: 0, totalMinutes: 0, avgFocus: 0 });
  const [loadingAction, setLoadingAction] = useState(null); // 'start' | 'end' | 'ai' | null
  const [message, setMessage] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [user, setUser] = useState(null);
  

  const loadSessions = async () => {
    try {
      setError("");
      setLoadingAction('');
      const res = await fetch(`${BACKEND_URL}/study/all`);
      const data = await res.json();
      setSessions(data);
      // compute stats
      const totalSessions = Array.isArray(data) ? data.length : 0;
      const totalMinutes = Array.isArray(data) ? data.reduce((sum, s) => sum + (s.durationMinutes || 0), 0) : 0;
      const avgFocus = totalSessions
        ? (data.reduce((sum, s) => sum + (s.focusLevel ?? s.focus ?? 0), 0) / totalSessions).toFixed(1)
        : 0;
      setStats({ totalSessions, totalMinutes, avgFocus });
      setMessage("Sessions loaded");
    } catch (err) {
      console.error(err);
      setError("Couldn't fetch sessions. Try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const getAiSummary = async () => {
    try {
      setError("");
      setLoadingAction('ai');
      const res = await fetch(`${BACKEND_URL}/study/ai-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      });
      const data = await res.json();
      if (res.ok) {
        setAiSummary(data.summary || "No summary");
      } else {
        setAiSummary(data.error || "Failed to get AI summary");
      }
    } catch (e) {
      setAiSummary("Network error");
    } finally {
      setLoadingAction(null);
    }
  };

  const startSession = async () => {
    try {
      setError("");
      setLoadingAction('start');
      const res = await fetch(`${BACKEND_URL}/study/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, subject, focusLevel: Number(focus), userId: user?.uid || null })
      });
      const data = await res.json();
      const id = data.id || data.sessionId || "";
      setSessionId(id);
      setCurrentSessionId(id);
      setMessage("Session started");
      setIsRunning(true);
      setElapsedSeconds(0);
      await loadSessions();
    } catch (err) {
      console.error(err);
      setError("Could not start session. Try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  
const endSession = async () => {
  try {
    setError("");
    setLoadingAction('end');
    setIsRunning(false);
    const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
    const res = await fetch(`${BACKEND_URL}/study/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId,
        durationMinutes: minutes,
        conceptsCovered: [],
        testScore: null
      })
    });
    const data = await res.json();
    console.log("end response:", data);
    setMessage("Session ended");
    await loadSessions();
  } catch (err) {
    console.error(err);
    setError('Could not end session. Try again.');
  } finally {
    setLoadingAction(null);
  }
};



  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (!isRunning) return undefined;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
    } catch (e) {
      console.error(e);
      setError('Login failed');
    }
  };

  const handleCancel = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setCurrentSessionId(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (e) {
      console.error(e);
      setError('Logout failed');
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b1120", color: "#e5e7eb", padding: "2rem" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>StudySync Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <span style={{ color: '#9ca3af' }}>{user.displayName}</span>
              <button onClick={handleLogout} style={{ padding: '0.25rem 0.5rem', borderRadius: 6 }}>Logout</button>
            </>
          ) : (
            <button onClick={handleLogin} style={{ padding: '0.25rem 0.5rem', borderRadius: 6 }}>Sign in with Google</button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ background: "#111827", padding: "0.75rem 1rem", borderRadius: "0.75rem", minWidth: "180px" }}>
          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Total sessions</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>{stats.totalSessions}</div>
        </div>
        <div style={{ background: "#111827", padding: "0.75rem 1rem", borderRadius: "0.75rem", minWidth: "180px" }}>
          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Total minutes</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>{stats.totalMinutes}</div>
        </div>
        <div style={{ background: "#111827", padding: "0.75rem 1rem", borderRadius: "0.75rem", minWidth: "180px" }}>
          <div style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Average focus</div>
          <div style={{ fontSize: "1.3rem", fontWeight: 600 }}>{stats.avgFocus}</div>
        </div>
      </div>
      {sessions.length === 0 && (
        <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>
          Start your first study session to see insights here.
        </p>
      )}

      <div style={{ marginBottom: "1rem" }}>
        <button onClick={getAiSummary} disabled={sessions.length === 0 || loadingAction === 'ai'} style={{ marginBottom: "1rem", padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#8b5cf6", border: "none", color: "#fff", fontWeight: 600 }}>
          {loadingAction === 'ai' ? 'Fetching AI insights…' : 'Get AI Insight'}
        </button>

        {aiSummary && (
          <div style={{ padding: "0.75rem", borderRadius: "8px", background: "#f9f5ff", marginBottom: "1rem", color: "#111827" }}>
            <strong>AI Insight: </strong>{aiSummary}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "2rem", marginBottom: "2rem", flexWrap: "wrap" }}>
        <div style={{ background: "#111827", padding: "1rem", borderRadius: "0.75rem", flex: "1 1 260px" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>Start session</h2>
          <input
            placeholder="Your name / ID"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
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
            placeholder="Focus (1-5)"
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
          <button
            onClick={startSession}
            disabled={!name.trim() || !subject.trim() || !String(focus).trim() || loadingAction === 'start'}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#22c55e", border: "none", color: "#022c22", fontWeight: 600 }}
          >
            {loadingAction === 'start' ? 'Starting session…' : 'Start'}
          </button>
          {loadingAction && (
            <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem' }}>
              {loadingAction === 'start' && 'Starting session…'}
              {loadingAction === 'end' && 'Ending session…'}
              {loadingAction === 'ai' && 'Fetching AI insights…'}
            </span>
          )}
          {currentSessionId && (
            <div style={{ marginTop: '1rem' }}>
              <span style={{ marginRight: '0.5rem' }}>
                Current Session ID: <code style={{ background: '#020617', padding: '0.125rem 0.25rem', borderRadius: 4 }}>{currentSessionId}</code>
              </span>
              <button
                onClick={() => navigator.clipboard?.writeText(currentSessionId)}
                style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', borderRadius: 4 }}
              >
                Copy
              </button>
            </div>
          )}
        </div>

        <div style={{ background: "#111827", padding: "1rem", borderRadius: "0.75rem", flex: "1 1 260px" }}>
          <h2 style={{ marginBottom: "0.5rem" }}>End session</h2>
          <input
            placeholder="Session ID"
            value={sessionId}
            onChange={e => setSessionId(e.target.value)}
            style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", borderRadius: "0.5rem", border: "1px solid #374151", background: "#020617", color: "#e5e7eb" }}
          />
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={endSession}
              disabled={!sessionId.trim() || loadingAction === 'end'}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#f97316", border: "none", color: "#111827", fontWeight: 600 }}
            >
              {loadingAction === 'end' ? 'Ending…' : 'End'}
            </button>

            <button
              onClick={handleCancel}
              disabled={!currentSessionId || loadingAction === 'end' || loadingAction === 'start'}
              style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#4b5563", border: "none", color: "#fff", fontWeight: 600 }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
        {sessions.length > 0 && (
          <>
            <div style={{ background: '#0b1220', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginBottom: 8 }}>Study time per subject</h3>
              <Pie data={(() => {
                const subjectTotals = sessions.reduce((acc, s) => {
                  const subj = s.subject || 'Unknown';
                  acc[subj] = (acc[subj] || 0) + (s.durationMinutes || 0);
                  return acc;
                }, {});
                return {
                  labels: Object.keys(subjectTotals),
                  datasets: [{ data: Object.values(subjectTotals), backgroundColor: ["#60a5fa", "#34d399", "#fbbf24", "#f97373", "#a78bfa"] }]
                };
              })()} />
            </div>

            <div style={{ background: '#0b1220', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginBottom: 8 }}>Focus trend over time</h3>
              <Line data={(() => ({
                labels: sessions.map(s => new Date(s.startTime).toLocaleDateString()),
                datasets: [{ label: 'Focus score', data: sessions.map(s => s.focusLevel ?? s.focus ?? 0), borderColor: '#34d399', tension: 0.3 }]
              }))()} />
            </div>

            <div style={{ background: '#0b1220', padding: 12, borderRadius: 8 }}>
              <h3 style={{ marginBottom: 8 }}>Minutes per session</h3>
              <Bar data={(() => ({
                labels: sessions.map(s => new Date(s.startTime).toLocaleDateString()),
                datasets: [{ label: 'Minutes studied', data: sessions.map(s => s.durationMinutes || 0), backgroundColor: '#60a5fa' }]
              }))()} />
            </div>
          </>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={loadSessions}
          style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", background: "#3b82f6", border: "none", color: "#e5e7eb", fontWeight: 600 }}
        >
          Reload sessions
        </button>
        <span style={{ marginLeft: "1rem", color: "#9ca3af" }}>
          {loadingAction ? 'Working…' : message}
        </span>
        {error && (
          <div
            style={{
              marginTop: '0.75rem',
              padding: '0.5rem 0.75rem',
              backgroundColor: '#2b1b1b',
              color: '#ffb3b3',
              borderRadius: '4px',
              fontSize: '0.9rem'
            }}
          >
            {error}
          </div>
        )}
      </div>

      <h2 style={{ marginBottom: "0.5rem" }}>All sessions</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#020617", borderRadius: "0.75rem", overflow: "hidden" }}>
        <thead>
          <tr style={{ background: "#111827" }}>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>ID</th>
            <th style={{ padding: "0.5rem", borderBottom: "1px solid #1f2937" }}>Name</th>
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
              <td style={{ padding: "0.5rem" }}>{s.name || "-"}</td>
              <td style={{ padding: "0.5rem" }}>{s.subject}</td>
              <td style={{ padding: "0.5rem" }}>{s.focusLevel ?? s.focus}</td>
              <td style={{ padding: "0.5rem" }}>{formatDateTime(s.startTime)}</td>
              <td style={{ padding: "0.5rem" }}>{formatDateTime(s.endTime)}</td>
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
