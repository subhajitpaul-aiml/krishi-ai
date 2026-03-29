import React, { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import WeatherWidget    from "./WeatherWidget";
import DiseaseDetection from "./DiseaseDetection";
import YieldPrediction  from "./YieldPrediction";

const MOCK_YIELD_TREND = [
  { month: "Jan", rice: 3.1, wheat: 2.6, maize: 3.9 },
  { month: "Feb", rice: 3.3, wheat: 2.8, maize: 4.0 },
  { month: "Mar", rice: 3.5, wheat: 2.5, maize: 4.3 },
  { month: "Apr", rice: 3.8, wheat: 2.9, maize: 4.1 },
  { month: "May", rice: 4.0, wheat: 3.1, maize: 4.5 },
  { month: "Jun", rice: 3.7, wheat: 2.7, maize: 4.2 },
];

const MOCK_SOIL = [
  { nutrient: "Nitrogen",   value: 85 },
  { nutrient: "Phosphorus", value: 42 },
  { nutrient: "Potassium",  value: 58 },
  { nutrient: "pH",         value: 67 },
  { nutrient: "Humidity",   value: 72 },
];

const MOCK_DISEASE_HIST = [
  { week: "W1", cases: 3 }, { week: "W2", cases: 7 },
  { week: "W3", cases: 2 }, { week: "W4", cases: 9 },
  { week: "W5", cases: 4 }, { week: "W6", cases: 1 },
];

const STAT_CARDS = [
  { icon: "🌾", label: "Avg Yield",     value: "3.8 t/ha",  delta: "+12%"  },
  { icon: "🦠", label: "Disease Alerts",value: "2",          delta: "-33%"  },
  { icon: "💧", label: "Irrigation",    value: "Active",     delta: "2 zones" },
  { icon: "🌡️", label: "Soil Temp",    value: "28°C",       delta: "Optimal" },
];

const TABS = ["Overview", "Disease Detection", "Yield Prediction"];

export default function Dashboard() {
  const [tab,  setTab]  = useState("Overview");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="dashboard">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🌿</span>
          <span className="logo-text">SmartKrishi</span>
        </div>
        <nav className="nav">
          {TABS.map(t => (
            <button
              key={t}
              className={`nav-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "Overview"          && "📊 "}
              {t === "Disease Detection" && "🔬 "}
              {t === "Yield Prediction"  && "🌾 "}
              {t}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <WeatherWidget lat={23.55} lon={87.32} />
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">
              {tab === "Overview" ? "Farm Dashboard" : tab}
            </h1>
            <p className="page-sub">
              {time.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <div className="topbar-right">
            <span className="live-dot" /> Live
          </div>
        </header>

        {tab === "Overview" && <Overview />}
        {tab === "Disease Detection" && <DiseaseDetection />}
        {tab === "Yield Prediction"  && <YieldPrediction />}
      </main>
    </div>
  );
}

function Overview() {
  return (
    <div className="overview">
      {/* Stat row */}
      <div className="stat-row">
        {STAT_CARDS.map(s => (
          <div className="stat-card" key={s.label}>
            <span className="stat-icon">{s.icon}</span>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
              <div className="stat-delta">{s.delta}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-row">
        {/* Yield trend */}
        <div className="chart-card">
          <h3>Yield Trend (t/ha)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MOCK_YIELD_TREND}>
              <defs>
                {["rice","wheat","maize"].map((c,i) => (
                  <linearGradient key={c} id={`g${c}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={["#4ade80","#facc15","#60a5fa"][i]} stopOpacity={0.4}/>
                    <stop offset="95%" stopColor={["#4ade80","#facc15","#60a5fa"][i]} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
              <Legend />
              <Area type="monotone" dataKey="rice"  stroke="#4ade80" fill="url(#grice)"  strokeWidth={2}/>
              <Area type="monotone" dataKey="wheat" stroke="#facc15" fill="url(#gwheat)" strokeWidth={2}/>
              <Area type="monotone" dataKey="maize" stroke="#60a5fa" fill="url(#gmaize)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Soil radar */}
        <div className="chart-card">
          <h3>Soil Nutrient Profile</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={MOCK_SOIL}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="nutrient" tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <Radar name="Soil" dataKey="value" stroke="#4ade80" fill="#4ade80" fillOpacity={0.25} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Disease history */}
      <div className="chart-card full-width">
        <h3>Disease Alert History (Last 6 Weeks)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={MOCK_DISEASE_HIST}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="week" tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#1e293b", border: "none", borderRadius: 8 }} />
            <Bar dataKey="cases" fill="#f87171" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
