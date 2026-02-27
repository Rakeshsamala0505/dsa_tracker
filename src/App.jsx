import { useState, useEffect, useCallback } from "react";

const CATEGORIES = [
  { id: "dsa", label: "DSA Problems", icon: "⚡", color: "#00ff88" },
  { id: "sysdesign", label: "System Design", icon: "🏗️", color: "#00cfff" },
  { id: "cs", label: "CS Fundamentals", icon: "🧠", color: "#ff9f43" },
  { id: "mock", label: "Mock Interviews", icon: "🎯", color: "#ff6b9d" },
];

const SITES = [
  { name: "LeetCode", url: "https://leetcode.com", icon: "LC", color: "#ffa116", bg: "#1a1a2e" },
  { name: "Codeforces", url: "https://codeforces.com", icon: "CF", color: "#1890ff", bg: "#0d1b2a" },
  { name: "HackerRank", url: "https://hackerrank.com", icon: "HR", color: "#00ea64", bg: "#0d1f1a" },
  { name: "GeeksForGeeks", url: "https://geeksforgeeks.org", icon: "GFG", color: "#2f8d46", bg: "#0d1a0f" },
];

const DIFFICULTY_COLORS = { Easy: "#00ff88", Medium: "#ffa116", Hard: "#ff6b9d" };
const DIFFICULTY_BG_DARK = { Easy: "#0d2e1a", Medium: "#2e1a00", Hard: "#2e0d1a" };
const DIFFICULTY_BG_LIGHT = { Easy: "#dcfce7", Medium: "#fef3c7", Hard: "#ffe4e6" };

const toDateStr = (d) => d.toISOString().split("T")[0];
const today = () => toDateStr(new Date());

const getLast365Days = () => {
  const days = [];
  for (let i = 364; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    days.push(toDateStr(d));
  }
  return days;
};

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export default function App() {
  const [records, setRecords] = useState(() => lsGet("dsa_records", {}));
  const [tasks, setTasks] = useState(() => lsGet("dsa_tasks", []));
  const [isDark, setIsDark] = useState(() => lsGet("dsa_theme", "dark") === "dark");
  const [animStreak, setAnimStreak] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDifficulty, setTaskDifficulty] = useState("Medium");
  const [taskCategory, setTaskCategory] = useState("DSA");
  const [taskNote, setTaskNote] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => { lsSet("dsa_records", records); }, [records]);
  useEffect(() => { lsSet("dsa_tasks", tasks); }, [tasks]);
  useEffect(() => { lsSet("dsa_theme", isDark ? "dark" : "light"); }, [isDark]);

  const toggleCategory = useCallback((catId) => {
    const t = today();
    setRecords((prev) => {
      const dayRec = prev[t] || {};
      return { ...prev, [t]: { ...dayRec, [catId]: !dayRec[catId] } };
    });
    setAnimStreak(true);
    setTimeout(() => setAnimStreak(false), 600);
  }, []);

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setTasks((prev) => [{
      id: Date.now().toString(),
      title: taskTitle.trim(),
      difficulty: taskDifficulty,
      category: taskCategory,
      note: taskNote.trim(),
      done: false,
      createdAt: today(),
    }, ...prev]);
    setTaskTitle(""); setTaskDifficulty("Medium"); setTaskCategory("DSA"); setTaskNote("");
    setShowAddTask(false);
  };

  const toggleTask = (id) => setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const computeStreak = () => {
    let streak = 0;
    const d = new Date();
    if (!Object.values(records[today()] || {}).some(Boolean)) d.setDate(d.getDate() - 1);
    while (true) {
      const ds = toDateStr(d);
      if (Object.values(records[ds] || {}).some(Boolean)) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  const computeLongestStreak = () => {
    let max = 0, cur = 0;
    for (const d of getLast365Days()) {
      if (Object.values(records[d] || {}).some(Boolean)) { cur++; max = Math.max(max, cur); } else cur = 0;
    }
    return max;
  };

  const streak = computeStreak();
  const longestStreak = computeLongestStreak();
  const todayRec = records[today()] || {};
  const todayCompleted = CATEGORIES.filter((c) => todayRec[c.id]).length;

  const now2 = new Date();
  const monthKey = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, "0")}`;
  const all365 = getLast365Days();
  const weekDays = (() => {
    const days = []; const n = new Date(); const dow = n.getDay();
    for (let i = dow; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(toDateStr(d)); }
    return days;
  })();
  const weekTotal = weekDays.reduce((a, d) => a + Object.values(records[d] || {}).filter(Boolean).length, 0);
  const monthTotal = all365.filter((d) => d.startsWith(monthKey))
    .reduce((a, d) => a + Object.values(records[d] || {}).filter(Boolean).length, 0);
  const catTotals = {};
  CATEGORIES.forEach((c) => { catTotals[c.id] = 0; });
  Object.values(records).forEach((rec) => CATEGORIES.forEach((c) => { if (rec[c.id]) catTotals[c.id]++; }));

  const heatmapWeeks = [];
  let week = [];
  const firstDay = new Date(all365[0]);
  for (let i = 0; i < firstDay.getDay(); i++) week.push(null);
  for (const d of all365) {
    week.push(d);
    if (week.length === 7) { heatmapWeeks.push(week); week = []; }
  }
  if (week.length > 0) { while (week.length < 7) week.push(null); heatmapWeeks.push(week); }

  const monthLabels = [];
  let lastMonth = -1;
  heatmapWeeks.forEach((w, wi) => {
    const f = w.find(Boolean);
    if (f) { const m = new Date(f).getMonth(); if (m !== lastMonth) { monthLabels.push({ wi, label: MONTH_NAMES[m] }); lastMonth = m; } }
  });

  const getDayIntensity = (ds) => {
    const c = Object.values(records[ds] || {}).filter(Boolean).length;
    return c === 0 ? 0 : c === 1 ? 1 : c === 2 ? 2 : c === 3 ? 3 : 4;
  };

  const weekBarData = (() => {
    const res = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      res.push({ label: DOW_NAMES[d.getDay()], ds, count: Object.values(records[ds] || {}).filter(Boolean).length, isToday: ds === today() });
    }
    return res;
  })();

  const ringR = 54, ringCirc = 2 * Math.PI * ringR;
  const ringDash = ringCirc * (todayCompleted / CATEGORIES.length);

  const taskCategories = ["All", "DSA", "System Design", "CS Fundamentals", "Mock Interview"];
  const filteredTasks = tasks.filter((t) => {
    const catMatch = filterCat === "All" || t.category === filterCat;
    const statusMatch = filterStatus === "All" || (filterStatus === "Pending" ? !t.done : t.done);
    return catMatch && statusMatch;
  });

  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  const T = isDark ? {
    bg: "#0a0d14", panel: "#0f1320", border: "#1e2535", borderHover: "#2a3550",
    text: "#e2e8f0", textMuted: "#4a5568", textSub: "#2d3748",
    inputBg: "#0a0d14", statCard: "#0f1320", siteCard: "#0a0d14",
    catItem: "#0a0d14", catItemHover: "#0d1020",
    intensityColors: ["#1a1f2e","#0d3326","#0f5c3a","#10854f","#00ff88"],
    modalBg: "#0f1320", overlay: "rgba(0,0,0,0.85)", accent: "#00ff88", accent2: "#00cfff",
    diffBg: DIFFICULTY_BG_DARK,
  } : {
    bg: "#dce3f0", panel: "#ffffff", border: "#c8d0e0", borderHover: "#a0aec0",
    text: "#1a202c", textMuted: "#5a6a80", textSub: "#8a9ab0",
    inputBg: "#f4f7fc", statCard: "#ffffff", siteCard: "#f4f7fc",
    catItem: "#eef2f9", catItemHover: "#e4eaf5",
    intensityColors: ["#d0d8e8","#c6f6d5","#9ae6b4","#48bb78","#00c853"],
    modalBg: "#ffffff", overlay: "rgba(0,0,0,0.5)", accent: "#059669", accent2: "#0284c7",
    diffBg: DIFFICULTY_BG_LIGHT,
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Outfit:wght@300;400;500;600;700;800&display=swap');
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { font-size:16px; }
    body { background:${T.bg}; color:${T.text}; font-family:'Outfit',sans-serif; min-height:100vh; transition:background 0.3s,color 0.3s; -webkit-text-size-adjust:100%; }
    .app { max-width:1100px; margin:0 auto; padding:16px 16px 60px; }

    /* HEADER */
    .header {
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:10px;
      margin-bottom:24px;
      padding-bottom:18px;
      border-bottom:1px solid ${T.border};
    }
    .header-left { flex:1; min-width:0; overflow:hidden; }
    .header-left h1 {
      font-size:clamp(13px,3.5vw,22px);
      font-weight:800;
      background:linear-gradient(135deg,${T.accent},${T.accent2});
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
      font-family:'Space Mono',monospace;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .header-left p {
      font-size:clamp(9px,2vw,12px);
      color:${T.textMuted};
      margin-top:3px;
      font-family:'Space Mono',monospace;
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
    }
    .header-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

    .streak-badge {
      display:flex; align-items:center; gap:6px;
      background:${isDark?"linear-gradient(135deg,#1a2a1a,#0d1f14)":"linear-gradient(135deg,#f0fff4,#e6fffa)"};
      border:1px solid ${T.accent}30; border-radius:10px; padding:8px 12px; flex-shrink:0;
    }
    .streak-badge.pulse { animation:pulseBadge 0.5s ease; }
    @keyframes pulseBadge { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
    .streak-flame { font-size:20px; }
    .streak-num { font-size:clamp(16px,3.5vw,26px); font-weight:800; color:${T.accent}; font-family:'Space Mono',monospace; line-height:1; }
    .streak-label { font-size:9px; color:${T.textMuted}; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }

    /* theme toggle — always the LAST element on the right */
    .theme-toggle {
      width:46px; height:26px; border-radius:13px;
      background:${isDark?"#1e2535":"#e2e8f0"};
      border:1px solid ${T.border};
      cursor:pointer; flex-shrink:0;
      display:flex; align-items:center; padding:0 3px;
      transition:background 0.3s;
    }
    .theme-toggle-thumb {
      width:20px; height:20px; border-radius:50%;
      background:${isDark?"#4a5568":"#fff"};
      display:flex; align-items:center; justify-content:center;
      font-size:11px;
      transition:transform 0.3s;
      transform:translateX(${isDark?"0px":"20px"});
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    }

    /* STATS */
    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
    .stat-card { background:${T.statCard}; border:1px solid ${T.border}; border-radius:12px; padding:14px 12px; position:relative; overflow:hidden; transition:border-color 0.2s,transform 0.2s; }
    .stat-card:hover { border-color:${T.borderHover}; transform:translateY(-2px); }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--accent); }
    .stat-card .s-icon { font-size:16px; margin-bottom:6px; }
    .stat-card .s-val { font-size:clamp(16px,3vw,24px); font-weight:800; font-family:'Space Mono',monospace; color:var(--accent); line-height:1; }
    .stat-card .s-label { font-size:10px; color:${T.textMuted}; margin-top:4px; text-transform:uppercase; letter-spacing:0.4px; }

    /* MAIN GRID */
    .main-grid { display:grid; grid-template-columns:1fr 300px; gap:16px; margin-bottom:20px; }
    .panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; box-shadow:${isDark?"none":"0 2px 12px rgba(0,0,0,0.08)"}; }
    .panel-title { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:${T.textMuted}; font-family:'Space Mono',monospace; margin-bottom:14px; display:flex; align-items:center; gap:6px; }
    .panel-title span { color:${T.accent}; }
    .today-date { font-size:11px; color:${T.textSub}; font-family:'Space Mono',monospace; margin-bottom:12px; }

    .cat-list { display:flex; flex-direction:column; gap:8px; }
    .cat-item { display:flex; align-items:center; gap:10px; padding:11px 13px; background:${T.catItem}; border:1px solid ${T.border}; border-radius:10px; cursor:pointer; transition:all 0.2s; user-select:none; }
    .cat-item:hover { border-color:${T.borderHover}; background:${T.catItemHover}; }
    .cat-item.done { border-color:var(--cat-color); background:color-mix(in srgb,var(--cat-color) 8%,${T.catItem}); }
    .cat-checkbox { width:20px; height:20px; border-radius:5px; border:2px solid ${T.borderHover}; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:all 0.2s; font-size:11px; }
    .cat-item.done .cat-checkbox { background:var(--cat-color); border-color:var(--cat-color); color:#000; }
    .cat-icon { font-size:16px; flex-shrink:0; }
    .cat-name { font-size:13px; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cat-total { font-size:11px; color:${T.textSub}; font-family:'Space Mono',monospace; flex-shrink:0; }
    .cat-item.done .cat-total { color:var(--cat-color); opacity:0.7; }

    .right-col { display:flex; flex-direction:column; gap:14px; }

    .progress-ring-wrap { display:flex; flex-direction:column; align-items:center; padding:6px 0 12px; }
    .ring-container { position:relative; width:120px; height:120px; margin-bottom:10px; }
    .ring-center { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; }
    .ring-num { font-size:28px; font-weight:800; font-family:'Space Mono',monospace; color:${T.accent}; line-height:1; }
    .ring-sub { font-size:10px; color:${T.textMuted}; text-transform:uppercase; letter-spacing:1px; }
    .ring-label { font-size:12px; color:${T.textMuted}; text-align:center; }

    .sites-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
    .site-card { display:flex; align-items:center; gap:8px; padding:10px 9px; background:${T.siteCard}; border:1px solid ${T.border}; border-radius:10px; text-decoration:none; transition:all 0.2s; overflow:hidden; }
    .site-card:hover { border-color:var(--site-color); transform:translateY(-2px); }
    .site-icon { width:32px; height:32px; border-radius:6px; background:var(--site-bg); border:1px solid color-mix(in srgb,var(--site-color) 30%,transparent); display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; color:var(--site-color); font-family:'Space Mono',monospace; flex-shrink:0; }
    .site-name { font-size:11px; font-weight:600; color:${T.text}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
    .site-arrow { font-size:9px; color:${T.textSub}; flex-shrink:0; }

    /* TASKS */
    .tasks-panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; margin-bottom:20px; box-shadow:${isDark?"none":"0 2px 12px rgba(0,0,0,0.08)"}; }
    .tasks-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:8px; }
    .tasks-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
    .tasks-title { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:${T.textMuted}; font-family:'Space Mono',monospace; display:flex; align-items:center; gap:5px; white-space:nowrap; }
    .tasks-title span { color:${T.accent}; }
    .task-count-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-family:'Space Mono',monospace; font-weight:700; white-space:nowrap; }
    .add-task-btn { display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:9px; background:linear-gradient(135deg,${T.accent},${T.accent2}); border:none; color:#000; font-size:12px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:transform 0.15s; white-space:nowrap; flex-shrink:0; }
    .add-task-btn:hover { transform:translateY(-1px); }

    .task-filters { display:flex; align-items:center; gap:5px; margin-bottom:13px; flex-wrap:wrap; }
    .filter-btn { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid ${T.border}; background:${T.catItem}; color:${T.textMuted}; font-family:'Outfit',sans-serif; transition:all 0.15s; white-space:nowrap; }
    .filter-btn.active { background:${T.accent}18; border-color:${T.accent}; color:${T.accent}; }
    .filter-sep { width:1px; height:14px; background:${T.border}; flex-shrink:0; }

    .task-list { display:flex; flex-direction:column; gap:7px; }
    .task-item { display:flex; align-items:flex-start; gap:10px; padding:11px 13px; background:${T.catItem}; border:1px solid ${T.border}; border-radius:10px; transition:all 0.2s; }
    .task-item:hover { border-color:${T.borderHover}; }
    .task-item.task-done { opacity:0.5; }
    .task-checkbox { width:20px; height:20px; border-radius:5px; border:2px solid ${T.borderHover}; display:flex; align-items:center; justify-content:center; flex-shrink:0; cursor:pointer; transition:all 0.2s; margin-top:2px; }
    .task-checkbox.checked { background:${T.accent}; border-color:${T.accent}; color:#000; font-size:11px; }
    .task-body { flex:1; min-width:0; }
    .task-title-row { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-bottom:3px; }
    .task-title { font-size:13px; font-weight:600; color:${T.text}; word-break:break-word; }
    .task-item.task-done .task-title { text-decoration:line-through; color:${T.textMuted}; }
    .diff-badge { padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; font-family:'Space Mono',monospace; white-space:nowrap; flex-shrink:0; }
    .cat-tag { padding:2px 6px; border-radius:4px; font-size:10px; background:${T.border}; color:${T.textMuted}; white-space:nowrap; flex-shrink:0; }
    .task-note { font-size:12px; color:${T.textMuted}; margin-top:2px; word-break:break-word; }
    .task-date { font-size:10px; color:${T.textSub}; font-family:'Space Mono',monospace; margin-top:2px; }
    .task-delete { padding:3px 7px; border-radius:5px; background:transparent; border:none; color:${T.textSub}; cursor:pointer; font-size:13px; transition:color 0.15s,background 0.15s; flex-shrink:0; }
    .task-delete:hover { color:#ff6b9d; background:#ff6b9d18; }
    .task-empty { text-align:center; padding:30px 0; color:${T.textSub}; font-family:'Space Mono',monospace; font-size:12px; }

    /* HEATMAP */
    .heatmap-panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; margin-bottom:20px; box-shadow:${isDark?"none":"0 2px 12px rgba(0,0,0,0.08)"}; }
    .heatmap-scroll { overflow-x:auto; padding-bottom:6px; }
    .heatmap-body { display:flex; gap:3px; }
    .heatmap-week { display:flex; flex-direction:column; gap:3px; }
    .heatmap-cell { width:11px; height:11px; border-radius:2px; transition:transform 0.1s; }
    .heatmap-cell:hover { transform:scale(1.5); z-index:10; }
    .heatmap-legend { display:flex; align-items:center; gap:5px; margin-top:10px; justify-content:flex-end; }
    .legend-label { font-size:10px; color:${T.textMuted}; font-family:'Space Mono',monospace; }
    .legend-cell { width:11px; height:11px; border-radius:2px; }

    /* WEEK BARS */
    .week-bars { display:flex; flex-direction:column; gap:7px; }
    .week-day-row { display:flex; align-items:center; gap:8px; }
    .week-day-name { font-size:11px; color:${T.textMuted}; font-family:'Space Mono',monospace; width:26px; flex-shrink:0; }
    .week-bar-track { flex:1; height:24px; background:${T.catItem}; border-radius:6px; overflow:hidden; border:1px solid ${T.border}; min-width:0; }
    .week-bar-fill { height:100%; border-radius:6px; display:flex; align-items:center; padding-left:8px; font-size:11px; font-weight:600; color:#000; font-family:'Space Mono',monospace; transition:width 0.6s cubic-bezier(0.4,0,0.2,1); }
    .week-day-count { font-size:11px; color:${T.textMuted}; font-family:'Space Mono',monospace; width:14px; text-align:right; flex-shrink:0; }

    /* MODAL */
    .modal-overlay { position:fixed; inset:0; background:${T.overlay}; z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:16px; animation:fadeIn 0.15s; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal { background:${T.modalBg}; border:1px solid ${T.border}; border-radius:18px; padding:22px; width:100%; max-width:460px; animation:slideUp 0.2s ease; box-shadow:0 20px 60px rgba(0,0,0,0.5); max-height:90vh; overflow-y:auto; }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .modal-title { font-size:16px; font-weight:700; color:${T.text}; margin-bottom:18px; display:flex; align-items:center; gap:8px; }
    .modal-title span { color:${T.accent}; }
    .form-group { margin-bottom:13px; }
    .form-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${T.textMuted}; font-family:'Space Mono',monospace; margin-bottom:5px; display:block; }
    .form-input { width:100%; padding:10px 12px; border-radius:9px; border:1px solid ${T.border}; background:${T.inputBg}; color:${T.text}; font-size:14px; font-family:'Outfit',sans-serif; outline:none; transition:border-color 0.2s; }
    .form-input:focus { border-color:${T.accent}; box-shadow:0 0 0 3px ${T.accent}18; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .diff-select { display:flex; gap:5px; }
    .diff-opt { flex:1; padding:8px 2px; border-radius:7px; border:1px solid ${T.border}; background:${T.inputBg}; color:${T.textMuted}; font-size:11px; font-weight:700; font-family:'Space Mono',monospace; cursor:pointer; text-align:center; transition:all 0.15s; }
    .diff-opt.sel-Easy { border-color:#00ff88; background:#00ff8818; color:#00ff88; }
    .diff-opt.sel-Medium { border-color:#ffa116; background:#ffa11618; color:#ffa116; }
    .diff-opt.sel-Hard { border-color:#ff6b9d; background:#ff6b9d18; color:#ff6b9d; }
    .modal-actions { display:flex; gap:10px; margin-top:18px; }
    .btn-primary { flex:1; padding:11px; border-radius:9px; background:linear-gradient(135deg,${T.accent},${T.accent2}); border:none; color:#000; font-size:14px; font-weight:700; cursor:pointer; font-family:'Outfit',sans-serif; transition:transform 0.15s; }
    .btn-primary:hover { transform:translateY(-1px); }
    .btn-cancel { padding:11px 16px; border-radius:9px; background:${T.catItem}; border:1px solid ${T.border}; color:${T.textMuted}; font-size:14px; cursor:pointer; font-family:'Outfit',sans-serif; }
    .btn-cancel:hover { border-color:${T.borderHover}; color:${T.text}; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .main-grid { grid-template-columns: 1fr; }
      .right-col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    }
    @media (max-width: 520px) {
      .app { padding: 12px 10px 50px; }
      .stats-row { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .right-col { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .task-filters { gap: 4px; }
      .filter-btn { font-size: 10px; padding: 3px 8px; }
      .heatmap-cell, .legend-cell { width: 9px; height: 9px; }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* HEADER: Title | Streak | Toggle (toggle is LAST = far right) */}
        <div className="header">
          <div className="header-left">
            <h1>{"<DSA_TRACKER />"}</h1>
            <p>// crack product companies. one day at a time.</p>
          </div>
          <div className="header-right">
            <div className={`streak-badge ${animStreak ? "pulse" : ""}`}>
              <span className="streak-flame">🔥</span>
              <div>
                <div className="streak-num">{streak}</div>
                <div className="streak-label">Day Streak</div>
              </div>
            </div>
            {/* Toggle is LAST child = always far right */}
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle theme">
              <div className="theme-toggle-thumb">{isDark ? "🌙" : "☀️"}</div>
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-row">
          {[
            { icon: "🔥", val: streak, label: "Current Streak", accent: T.accent },
            { icon: "🏆", val: longestStreak, label: "Best Streak", accent: "#ffa116" },
            { icon: "📅", val: weekTotal, label: "This Week", accent: T.accent2 },
            { icon: "📆", val: monthTotal, label: "This Month", accent: "#ff9f43" },
          ].map((s, i) => (
            <div key={i} className="stat-card" style={{ "--accent": s.accent }}>
              <div className="s-icon">{s.icon}</div>
              <div className="s-val">{s.val}</div>
              <div className="s-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="main-grid">
          <div className="panel">
            <div className="panel-title"><span>◉</span> TODAY'S PRACTICE</div>
            <div className="today-date">// {new Date().toDateString()}</div>
            <div className="cat-list">
              {CATEGORIES.map((cat) => {
                const done = !!todayRec[cat.id];
                return (
                  <div key={cat.id} className={`cat-item ${done ? "done" : ""}`} style={{ "--cat-color": cat.color }} onClick={() => toggleCategory(cat.id)}>
                    <div className="cat-checkbox">{done && "✓"}</div>
                    <span className="cat-icon">{cat.icon}</span>
                    <span className="cat-name">{cat.label}</span>
                    <span className="cat-total">{catTotals[cat.id]}d</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="right-col">
            <div className="panel">
              <div className="panel-title"><span>◎</span> TODAY'S PROGRESS</div>
              <div className="progress-ring-wrap">
                <div className="ring-container">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r={ringR} fill="none" stroke={isDark ? "#1a1f2e" : "#e2e8f0"} strokeWidth="9" />
                    <circle cx="60" cy="60" r={ringR} fill="none" stroke={T.accent} strokeWidth="9" strokeLinecap="round"
                      strokeDasharray={`${ringDash} ${ringCirc}`} transform="rotate(-90 60 60)"
                      style={{ transition: "stroke-dasharray 0.5s ease", filter: `drop-shadow(0 0 5px ${T.accent}80)` }} />
                  </svg>
                  <div className="ring-center">
                    <div className="ring-num">{todayCompleted}</div>
                    <div className="ring-sub">of {CATEGORIES.length}</div>
                  </div>
                </div>
                <div className="ring-label">
                  {["Let's start! 💪","Good start! 🚀","Halfway! 🔥","Almost! 💥","Full day! 🏆"][todayCompleted]}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title"><span>⇗</span> PRACTICE SITES</div>
              <div className="sites-grid">
                {SITES.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noreferrer" className="site-card" style={{ "--site-color": s.color, "--site-bg": s.bg }}>
                    <div className="site-icon">{s.icon}</div>
                    <div className="site-name">{s.name}</div>
                    <div className="site-arrow">↗</div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* TASKS */}
        <div className="tasks-panel">
          <div className="tasks-header">
            <div className="tasks-title-row">
              <div className="tasks-title"><span>◈</span> DAILY TASKS</div>
              <span className="task-count-badge" style={{ background:`${T.accent}18`, color:T.accent, border:`1px solid ${T.accent}30` }}>{pendingCount} pending</span>
              {doneCount > 0 && <span className="task-count-badge" style={{ background:isDark?"#1e2535":"#e2e8f0", color:T.textMuted }}>{doneCount} done</span>}
            </div>
            <button className="add-task-btn" onClick={() => setShowAddTask(true)}>
              <span style={{ fontSize:"15px", lineHeight:1 }}>+</span> Add Task
            </button>
          </div>

          <div className="task-filters">
            {["All","Pending","Completed"].map((s) => (
              <button key={s} className={`filter-btn ${filterStatus===s?"active":""}`} onClick={() => setFilterStatus(s)}>{s}</button>
            ))}
            <div className="filter-sep" />
            {taskCategories.map((c) => (
              <button key={c} className={`filter-btn ${filterCat===c?"active":""}`} onClick={() => setFilterCat(c)}>{c}</button>
            ))}
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="task-empty">{tasks.length===0 ? "// No tasks yet. Click '+ Add Task' to begin!" : "// No tasks match filters."}</div>
            ) : filteredTasks.map((task) => (
              <div key={task.id} className={`task-item ${task.done?"task-done":""}`}>
                <div className={`task-checkbox ${task.done?"checked":""}`} onClick={() => toggleTask(task.id)}>{task.done&&"✓"}</div>
                <div className="task-body">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className="diff-badge" style={{ background:T.diffBg[task.difficulty]||T.border, color:DIFFICULTY_COLORS[task.difficulty]||T.textMuted }}>{task.difficulty}</span>
                    <span className="cat-tag">{task.category}</span>
                  </div>
                  {task.note && <div className="task-note">📝 {task.note}</div>}
                  <div className="task-date">Added {task.createdAt}</div>
                </div>
                <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* HEATMAP */}
        <div className="heatmap-panel">
          <div className="panel-title"><span>◈</span> YEARLY ACTIVITY — {new Date().getFullYear()}</div>
          <div className="heatmap-scroll">
            <div>
              {/* Month labels row — fixed 18px height so labels never overlap cells */}
              <div style={{ display:"flex", gap:"3px", height:"18px", marginBottom:"4px" }}>
                {heatmapWeeks.map((w, wi) => {
                  const ml = monthLabels.find((m) => m.wi === wi);
                  return (
                    <div key={wi} style={{ width:"11px", flexShrink:0, position:"relative" }}>
                      {ml && (
                        <span style={{
                          position:"absolute", left:0, top:0,
                          fontSize:"9px", lineHeight:"18px",
                          color:T.textMuted,
                          fontFamily:"'Space Mono',monospace",
                          whiteSpace:"nowrap",
                          pointerEvents:"none",
                        }}>{ml.label}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ display:"flex", gap:"5px", alignItems:"flex-start" }}>
                <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
                  {["S","M","T","W","T","F","S"].map((d,i) => (
                    <div key={i} style={{ height:"11px", fontSize:"9px", color:T.textSub, fontFamily:"'Space Mono',monospace", lineHeight:"11px" }}>{i%2===1?d:""}</div>
                  ))}
                </div>
                <div className="heatmap-body">
                  {heatmapWeeks.map((w,wi) => (
                    <div key={wi} className="heatmap-week">
                      {w.map((d,di) => (
                        <div key={di} className="heatmap-cell"
                          title={d?`${d}: ${Object.values(records[d]||{}).filter(Boolean).length} categories`:""}
                          style={{ background:d?T.intensityColors[getDayIntensity(d)]:"transparent", border:d===today()?`1px solid ${T.accent}`:"none" }} />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="heatmap-legend">
              <span className="legend-label">Less</span>
              {T.intensityColors.map((c,i) => <div key={i} className="legend-cell" style={{ background:c, border:`1px solid ${T.border}` }} />)}
              <span className="legend-label">More</span>
            </div>
          </div>
        </div>

        {/* WEEK BARS */}
        <div className="panel">
          <div className="panel-title"><span>◇</span> THIS WEEK'S BREAKDOWN</div>
          <div className="week-bars">
            {weekBarData.map((d,i) => (
              <div key={i} className="week-day-row">
                <div className="week-day-name" style={{ color:d.isToday?T.accent:T.textMuted }}>{d.label}</div>
                <div className="week-bar-track">
                  <div className="week-bar-fill" style={{ width:d.count>0?`${(d.count/CATEGORIES.length)*100}%`:"0%", background:d.isToday?`linear-gradient(90deg,${T.accent},${T.accent2})`:(isDark?"linear-gradient(90deg,#1a4a2e,#2a6a4e)":"linear-gradient(90deg,#bbf7d0,#6ee7b7)"), minWidth:d.count>0?"26px":"0" }}>
                    {d.count>0&&d.count}
                  </div>
                </div>
                <div className="week-day-count" style={{ color:d.isToday?T.accent:T.textMuted }}>{d.count}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget&&setShowAddTask(false)}>
          <div className="modal">
            <div className="modal-title"><span>+</span> Add New Task</div>
            <div className="form-group">
              <label className="form-label">Task Title *</label>
              <input className="form-input" placeholder="e.g. Two Sum, LRU Cache, Binary Search..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&addTask()} autoFocus />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <div className="diff-select">
                  {["Easy","Medium","Hard"].map((d) => (
                    <div key={d} className={`diff-opt ${taskDifficulty===d?`sel-${d}`:""}`} onClick={() => setTaskDifficulty(d)}>{d}</div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={taskCategory} onChange={(e) => setTaskCategory(e.target.value)}>
                  <option>DSA</option>
                  <option>System Design</option>
                  <option>CS Fundamentals</option>
                  <option>Mock Interview</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" placeholder="e.g. Try sliding window, revisit tomorrow..." value={taskNote} onChange={(e) => setTaskNote(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowAddTask(false)}>Cancel</button>
              <button className="btn-primary" onClick={addTask}>Save Task</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}