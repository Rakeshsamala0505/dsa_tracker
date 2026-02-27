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
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DOW_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const toDateStr = (d) => d.toISOString().split("T")[0];
const today = () => toDateStr(new Date());

const lsGet = (key, fallback) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
};
const lsSet = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

export default function App() {
  const [tasks, setTasks] = useState(() => lsGet("dsa_tasks2", []));
  const [isDark, setIsDark] = useState(() => lsGet("dsa_theme", "dark") === "dark");
  const [animStreak, setAnimStreak] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDifficulty, setTaskDifficulty] = useState("Medium");
  const [taskCategory, setTaskCategory] = useState("DSA");
  const [taskNote, setTaskNote] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");

  useEffect(() => { lsSet("dsa_tasks2", tasks); }, [tasks]);
  useEffect(() => { lsSet("dsa_theme", isDark ? "dark" : "light"); }, [isDark]);

  const addTask = () => {
    if (!taskTitle.trim()) return;
    setTasks((prev) => [{
      id: Date.now().toString(),
      title: taskTitle.trim(),
      difficulty: taskDifficulty,
      category: taskCategory,
      note: taskNote.trim(),
      done: false,
      addedOn: today(),
      solvedOn: null, // set when marked done
    }, ...prev]);
    setTaskTitle(""); setTaskDifficulty("Medium"); setTaskCategory("DSA"); setTaskNote("");
    setShowAddTask(false);
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => {
      if (t.id !== id) return t;
      const nowDone = !t.done;
      if (nowDone) setAnimStreak(true);
      setTimeout(() => setAnimStreak(false), 600);
      return { ...t, done: nowDone, solvedOn: nowDone ? today() : null };
    }));
  };

  const deleteTask = (id) => setTasks((prev) => prev.filter((t) => t.id !== id));

  // ── STREAK: based on days that have at least 1 solved task ──
  const solvedByDate = {};
  tasks.forEach((t) => {
    if (t.done && t.solvedOn) {
      solvedByDate[t.solvedOn] = (solvedByDate[t.solvedOn] || 0) + 1;
    }
  });

  const computeStreak = () => {
    let streak = 0;
    const d = new Date();
    // if nothing solved today, start checking from yesterday
    if (!solvedByDate[today()]) d.setDate(d.getDate() - 1);
    while (true) {
      const ds = toDateStr(d);
      if (solvedByDate[ds]) { streak++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return streak;
  };

  const computeLongestStreak = () => {
    const dates = Object.keys(solvedByDate).sort();
    let max = 0, cur = 0;
    let prev = null;
    for (const ds of dates) {
      if (prev) {
        const diff = (new Date(ds) - new Date(prev)) / 86400000;
        if (diff === 1) { cur++; }
        else { cur = 1; }
      } else { cur = 1; }
      max = Math.max(max, cur);
      prev = ds;
    }
    return max;
  };

  const streak = computeStreak();
  const longestStreak = computeLongestStreak();
  const todaySolved = solvedByDate[today()] || 0;
  const totalSolved = tasks.filter((t) => t.done).length;
  const pendingCount = tasks.filter((t) => !t.done).length;
  const doneCount = tasks.filter((t) => t.done).length;

  // ── WEEKLY: solved per day this week ──
  const weekBarData = (() => {
    const res = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = toDateStr(d);
      res.push({ label: DOW_NAMES[d.getDay()], ds, count: solvedByDate[ds] || 0, isToday: ds === today() });
    }
    return res;
  })();
  const weekTotal = weekBarData.reduce((a, d) => a + d.count, 0);

  // ── MONTHLY CHART: solved problems per day → bar height ──
  const now2 = new Date();
  const monthlyData = MONTH_NAMES.map((label, mi) => {
    const yr = now2.getFullYear();
    const daysInMonth = new Date(yr, mi + 1, 0).getDate();
    let activeDays = 0, totalSolvedMonth = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${yr}-${String(mi+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
      const count = solvedByDate[ds] || 0;
      if (count > 0) activeDays++;
      totalSolvedMonth += count;
    }
    return {
      label, mi, activeDays, totalSolved: totalSolvedMonth,
      isPast: mi < now2.getMonth(),
      isCurrent: mi === now2.getMonth(),
    };
  });
  const maxSolved = Math.max(...monthlyData.map(m => m.totalSolved), 1);

  // ── Category breakdown ──
  const catBreakdown = CATEGORIES.map((cat) => ({
    ...cat,
    solved: tasks.filter((t) => t.done && t.category === cat.id.replace("sysdesign","System Design").replace("dsa","DSA").replace("cs","CS Fundamentals").replace("mock","Mock Interview")).length,
    total: tasks.filter((t) => t.category === cat.id.replace("sysdesign","System Design").replace("dsa","DSA").replace("cs","CS Fundamentals").replace("mock","Mock Interview")).length,
  }));

  const taskCategories = ["All", "DSA", "System Design", "CS Fundamentals", "Mock Interview"];
  const filteredTasks = tasks.filter((t) => {
    const catMatch = filterCat === "All" || t.category === filterCat;
    const statusMatch = filterStatus === "All" || (filterStatus === "Pending" ? !t.done : t.done);
    return catMatch && statusMatch;
  });

  const T = isDark ? {
    bg: "#0a0d14", panel: "#0f1320", border: "#1e2535", borderHover: "#2a3550",
    text: "#e2e8f0", textMuted: "#4a5568", textSub: "#2d3748",
    inputBg: "#0a0d14", statCard: "#0f1320", siteCard: "#0a0d14",
    catItem: "#0a0d14", catItemHover: "#0d1020",
    modalBg: "#0f1320", overlay: "rgba(0,0,0,0.85)", accent: "#00ff88", accent2: "#00cfff",
    diffBg: DIFFICULTY_BG_DARK, shadow: "none",
  } : {
    bg: "#dce3f0", panel: "#ffffff", border: "#c8d0e0", borderHover: "#a0aec0",
    text: "#1a202c", textMuted: "#5a6a80", textSub: "#8a9ab0",
    inputBg: "#f4f7fc", statCard: "#ffffff", siteCard: "#f4f7fc",
    catItem: "#eef2f9", catItemHover: "#e4eaf5",
    modalBg: "#ffffff", overlay: "rgba(0,0,0,0.5)", accent: "#059669", accent2: "#0284c7",
    diffBg: DIFFICULTY_BG_LIGHT, shadow: "0 2px 12px rgba(0,0,0,0.08)",
  };

  const font = "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const mono = "'Courier New',Courier,monospace";

  const css = `
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    html { font-size:16px; }
    body { background:${T.bg}; color:${T.text}; font-family:${font}; min-height:100vh; transition:background 0.3s,color 0.3s; -webkit-text-size-adjust:100%; }
    .app { max-width:1100px; margin:0 auto; padding:16px 16px 60px; }

    .header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:24px; padding-bottom:18px; border-bottom:1px solid ${T.border}; }
    .header-left { flex:1; min-width:0; overflow:hidden; }
    .header-left h1 { font-size:clamp(13px,3.5vw,22px); font-weight:800; background:linear-gradient(135deg,${T.accent},${T.accent2}); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .header-left p { font-size:clamp(9px,2vw,12px); color:${T.textMuted}; margin-top:3px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .header-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

    .streak-badge { display:flex; align-items:center; gap:6px; background:${isDark?"linear-gradient(135deg,#1a2a1a,#0d1f14)":"linear-gradient(135deg,#f0fff4,#e6fffa)"}; border:1px solid ${T.accent}30; border-radius:10px; padding:8px 12px; flex-shrink:0; }
    .streak-badge.pulse { animation:pulseBadge 0.5s ease; }
    @keyframes pulseBadge { 0%{transform:scale(1)} 50%{transform:scale(1.08)} 100%{transform:scale(1)} }
    .streak-flame { font-size:20px; }
    .streak-num { font-size:clamp(16px,3.5vw,26px); font-weight:800; color:${T.accent}; font-family:${mono}; line-height:1; }
    .streak-label { font-size:9px; color:${T.textMuted}; text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }

    .theme-toggle { width:46px; height:26px; border-radius:13px; background:${isDark?"#1e2535":"#e2e8f0"}; border:1px solid ${T.border}; cursor:pointer; flex-shrink:0; display:flex; align-items:center; padding:0 3px; transition:background 0.3s; }
    .theme-toggle-thumb { width:20px; height:20px; border-radius:50%; background:${isDark?"#4a5568":"#fff"}; display:flex; align-items:center; justify-content:center; font-size:11px; transition:transform 0.3s; transform:translateX(${isDark?"0px":"20px"}); box-shadow:0 1px 4px rgba(0,0,0,0.3); }

    .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:20px; }
    .stat-card { background:${T.statCard}; border:1px solid ${T.border}; border-radius:12px; padding:14px 12px; position:relative; overflow:hidden; transition:border-color 0.2s,transform 0.2s; box-shadow:${T.shadow}; }
    .stat-card:hover { border-color:${T.borderHover}; transform:translateY(-2px); }
    .stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:var(--accent); }
    .stat-card .s-icon { font-size:16px; margin-bottom:6px; }
    .stat-card .s-val { font-size:clamp(16px,3vw,24px); font-weight:800; font-family:${mono}; color:var(--accent); line-height:1; }
    .stat-card .s-label { font-size:10px; color:${T.textMuted}; margin-top:4px; text-transform:uppercase; letter-spacing:0.4px; }

    .main-grid { display:grid; grid-template-columns:1fr 300px; gap:16px; margin-bottom:20px; }
    .panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; box-shadow:${T.shadow}; }
    .panel-title { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:${T.textMuted}; margin-bottom:14px; display:flex; align-items:center; gap:6px; }
    .panel-title span { color:${T.accent}; }

    /* TODAY SOLVED BOX */
    .today-solved-box { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px 0 10px; }
    .today-big-num { font-size:64px; font-weight:800; font-family:${mono}; color:${T.accent}; line-height:1; filter:drop-shadow(0 0 12px ${T.accent}60); }
    .today-solved-label { font-size:12px; color:${T.textMuted}; margin-top:6px; text-align:center; }
    .today-motivation { font-size:13px; color:${T.accent}; margin-top:10px; font-weight:600; text-align:center; }

    /* CAT BREAKDOWN */
    .cat-breakdown { display:flex; flex-direction:column; gap:9px; }
    .cat-row { display:flex; align-items:center; gap:10px; }
    .cat-row-icon { font-size:14px; flex-shrink:0; }
    .cat-row-label { font-size:12px; font-weight:500; flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .cat-row-track { flex:2; height:7px; background:${T.catItem}; border-radius:4px; overflow:hidden; }
    .cat-row-fill { height:100%; border-radius:4px; transition:width 0.5s ease; }
    .cat-row-count { font-size:11px; color:${T.textSub}; font-family:${mono}; width:28px; text-align:right; flex-shrink:0; }

    /* RIGHT COL */
    .right-col { display:flex; flex-direction:column; gap:14px; }
    .sites-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
    .site-card { display:flex; align-items:center; gap:8px; padding:10px 9px; background:${T.siteCard}; border:1px solid ${T.border}; border-radius:10px; text-decoration:none; transition:all 0.2s; overflow:hidden; box-shadow:${T.shadow}; }
    .site-card:hover { border-color:var(--site-color); transform:translateY(-2px); }
    .site-icon { width:32px; height:32px; border-radius:6px; background:var(--site-bg); border:1px solid color-mix(in srgb,var(--site-color) 30%,transparent); display:flex; align-items:center; justify-content:center; font-size:8px; font-weight:800; color:var(--site-color); font-family:${mono}; flex-shrink:0; }
    .site-name { font-size:11px; font-weight:600; color:${T.text}; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
    .site-arrow { font-size:9px; color:${T.textSub}; flex-shrink:0; }

    /* TASKS */
    .tasks-panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; margin-bottom:20px; box-shadow:${T.shadow}; }
    .tasks-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; gap:8px; }
    .tasks-title-row { display:flex; align-items:center; gap:8px; flex-wrap:wrap; min-width:0; }
    .tasks-title { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:${T.textMuted}; display:flex; align-items:center; gap:5px; white-space:nowrap; }
    .tasks-title span { color:${T.accent}; }
    .task-count-badge { padding:2px 8px; border-radius:20px; font-size:10px; font-family:${mono}; font-weight:700; white-space:nowrap; }
    .add-task-btn { display:flex; align-items:center; gap:5px; padding:8px 14px; border-radius:9px; background:linear-gradient(135deg,${T.accent},${T.accent2}); border:none; color:#000; font-size:12px; font-weight:700; cursor:pointer; transition:transform 0.15s; white-space:nowrap; flex-shrink:0; }
    .add-task-btn:hover { transform:translateY(-1px); }

    .task-filters { display:flex; align-items:center; gap:5px; margin-bottom:13px; flex-wrap:wrap; }
    .filter-btn { padding:4px 10px; border-radius:20px; font-size:11px; font-weight:500; cursor:pointer; border:1px solid ${T.border}; background:${T.catItem}; color:${T.textMuted}; transition:all 0.15s; white-space:nowrap; }
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
    .diff-badge { padding:2px 6px; border-radius:4px; font-size:10px; font-weight:700; font-family:${mono}; white-space:nowrap; flex-shrink:0; }
    .cat-tag { padding:2px 6px; border-radius:4px; font-size:10px; background:${T.border}; color:${T.textMuted}; white-space:nowrap; flex-shrink:0; }
    .task-note { font-size:12px; color:${T.textMuted}; margin-top:2px; word-break:break-word; }
    .task-meta { display:flex; gap:10px; margin-top:3px; }
    .task-date { font-size:10px; color:${T.textSub}; font-family:${mono}; }
    .task-solved-date { font-size:10px; color:${T.accent}; font-family:${mono}; }
    .task-delete { padding:3px 7px; border-radius:5px; background:transparent; border:none; color:${T.textSub}; cursor:pointer; font-size:13px; transition:color 0.15s; flex-shrink:0; }
    .task-delete:hover { color:#ff6b9d; }
    .task-empty { text-align:center; padding:30px 0; color:${T.textSub}; font-size:12px; }

    /* MONTHLY CHART */
    .monthly-panel { background:${T.panel}; border:1px solid ${T.border}; border-radius:14px; padding:18px; margin-bottom:20px; box-shadow:${T.shadow}; }
    .monthly-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:16px; }
    .monthly-grid { display:grid; grid-template-columns:repeat(12,1fr); gap:8px; align-items:flex-end; height:120px; }
    .month-col { display:flex; flex-direction:column; align-items:center; justify-content:flex-end; gap:4px; height:100%; }
    .month-bar-outer { width:100%; display:flex; flex-direction:column; justify-content:flex-end; flex:1; position:relative; }
    .month-bar { width:100%; border-radius:4px 4px 0 0; min-height:2px; transition:height 0.6s cubic-bezier(0.4,0,0.2,1); cursor:default; position:relative; }
    .month-bar:hover .month-tooltip { display:block; }
    .month-tooltip { display:none; position:absolute; bottom:calc(100% + 6px); left:50%; transform:translateX(-50%); background:${isDark?"#1a2535":"#1a202c"}; color:#fff; font-size:10px; padding:5px 9px; border-radius:6px; white-space:nowrap; z-index:20; pointer-events:none; line-height:1.5; }
    .month-label { font-size:9px; color:${T.textMuted}; text-align:center; white-space:nowrap; }
    .month-col.current .month-label { color:${T.accent}; font-weight:700; }
    .month-summary { display:flex; gap:16px; margin-top:16px; padding-top:14px; border-top:1px solid ${T.border}; flex-wrap:wrap; }
    .month-summary-item { flex:1; min-width:90px; }
    .month-summary-label { font-size:10px; color:${T.textMuted}; margin-bottom:2px; text-transform:uppercase; letter-spacing:0.5px; }
    .month-summary-val { font-size:20px; font-weight:800; color:${T.accent}; font-family:${mono}; }

    /* WEEK BARS */
    .week-bars { display:flex; flex-direction:column; gap:7px; }
    .week-day-row { display:flex; align-items:center; gap:8px; }
    .week-day-name { font-size:11px; color:${T.textMuted}; font-family:${mono}; width:26px; flex-shrink:0; }
    .week-bar-track { flex:1; height:28px; background:${T.catItem}; border-radius:6px; overflow:hidden; border:1px solid ${T.border}; min-width:0; }
    .week-bar-fill { height:100%; border-radius:6px; display:flex; align-items:center; padding-left:8px; font-size:11px; font-weight:700; color:#000; font-family:${mono}; transition:width 0.6s cubic-bezier(0.4,0,0.2,1); }
    .week-day-count { font-size:11px; color:${T.textMuted}; font-family:${mono}; width:18px; text-align:right; flex-shrink:0; }

    /* MODAL */
    .modal-overlay { position:fixed; inset:0; background:${T.overlay}; z-index:999; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); padding:16px; animation:fadeIn 0.15s; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal { background:${T.modalBg}; border:1px solid ${T.border}; border-radius:18px; padding:22px; width:100%; max-width:460px; animation:slideUp 0.2s ease; box-shadow:0 20px 60px rgba(0,0,0,0.5); max-height:90vh; overflow-y:auto; }
    @keyframes slideUp { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }
    .modal-title { font-size:16px; font-weight:700; color:${T.text}; margin-bottom:18px; display:flex; align-items:center; gap:8px; }
    .modal-title span { color:${T.accent}; }
    .form-group { margin-bottom:13px; }
    .form-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:${T.textMuted}; margin-bottom:6px; display:block; }
    .form-input { width:100%; padding:10px 12px; border-radius:9px; border:1px solid ${T.border}; background:${T.inputBg}; color:${T.text}; font-size:14px; font-family:${font}; outline:none; transition:border-color 0.2s; }
    .form-input:focus { border-color:${T.accent}; box-shadow:0 0 0 3px ${T.accent}18; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .diff-select { display:flex; gap:5px; }
    .diff-opt { flex:1; padding:8px 2px; border-radius:7px; border:1px solid ${T.border}; background:${T.inputBg}; color:${T.textMuted}; font-size:11px; font-weight:700; cursor:pointer; text-align:center; transition:all 0.15s; }
    .diff-opt.sel-Easy { border-color:#00ff88; background:#00ff8818; color:#00ff88; }
    .diff-opt.sel-Medium { border-color:#ffa116; background:#ffa11618; color:#ffa116; }
    .diff-opt.sel-Hard { border-color:#ff6b9d; background:#ff6b9d18; color:#ff6b9d; }
    .modal-actions { display:flex; gap:10px; margin-top:18px; }
    .btn-primary { flex:1; padding:11px; border-radius:9px; background:linear-gradient(135deg,${T.accent},${T.accent2}); border:none; color:#000; font-size:14px; font-weight:700; cursor:pointer; transition:transform 0.15s; }
    .btn-primary:hover { transform:translateY(-1px); }
    .btn-cancel { padding:11px 16px; border-radius:9px; background:${T.catItem}; border:1px solid ${T.border}; color:${T.textMuted}; font-size:14px; cursor:pointer; }
    .btn-cancel:hover { border-color:${T.borderHover}; color:${T.text}; }

    @media(max-width:768px){
      .stats-row{grid-template-columns:repeat(2,1fr);}
      .main-grid{grid-template-columns:1fr;}
      .right-col{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
      .form-row{grid-template-columns:1fr;}
    }
    @media(max-width:520px){
      .app{padding:12px 10px 50px;}
      .right-col{grid-template-columns:1fr;}
      .monthly-grid{gap:4px;}
      .month-label{font-size:7px;}
    }
  `;

  const maxWeekCount = Math.max(...weekBarData.map(d => d.count), 1);

  return (
    <>
      <style>{css}</style>
      <div className="app">

        {/* HEADER */}
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
            <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle theme">
              <div className="theme-toggle-thumb">{isDark ? "🌙" : "☀️"}</div>
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="stats-row">
          {[
            { icon: "🔥", val: streak,        label: "Current Streak",  accent: T.accent },
            { icon: "🏆", val: longestStreak,  label: "Best Streak",     accent: "#ffa116" },
            { icon: "✅", val: todaySolved,    label: "Solved Today",    accent: T.accent2 },
            { icon: "📚", val: totalSolved,    label: "Total Solved",    accent: "#ff9f43" },
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
          {/* Left — Today + Category Breakdown */}
          <div className="panel">
            <div className="panel-title"><span>◉</span> TODAY'S ACTIVITY</div>

            <div className="today-solved-box">
              <div className="today-big-num">{todaySolved}</div>
              <div className="today-solved-label">problems solved today</div>
              <div className="today-motivation">
                {todaySolved === 0 && "Add a problem below and start solving! 💪"}
                {todaySolved === 1 && "Great start! Keep the streak alive 🔥"}
                {todaySolved >= 2 && todaySolved < 5 && "You're on fire! Keep going 🚀"}
                {todaySolved >= 5 && "Incredible grind today! 🏆"}
              </div>
            </div>

            <div style={{ borderTop:`1px solid ${T.border}`, paddingTop:"14px", marginTop:"4px" }}>
              <div className="panel-title" style={{ marginBottom:"10px" }}><span>◇</span> CATEGORY BREAKDOWN</div>
              <div className="cat-breakdown">
                {CATEGORIES.map((cat) => {
                  const catLabel = cat.id === "dsa" ? "DSA" : cat.id === "sysdesign" ? "System Design" : cat.id === "cs" ? "CS Fundamentals" : "Mock Interview";
                  const solved = tasks.filter(t => t.done && t.category === catLabel).length;
                  const total = tasks.filter(t => t.category === catLabel).length;
                  const pct = total > 0 ? (solved / total) * 100 : 0;
                  return (
                    <div key={cat.id} className="cat-row">
                      <span className="cat-row-icon">{cat.icon}</span>
                      <span className="cat-row-label">{cat.label}</span>
                      <div className="cat-row-track">
                        <div className="cat-row-fill" style={{ width:`${pct}%`, background:cat.color }} />
                      </div>
                      <span className="cat-row-count" style={{ color: solved > 0 ? cat.color : T.textSub }}>{solved}/{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right col */}
          <div className="right-col">
            {/* Week summary */}
            <div className="panel">
              <div className="panel-title"><span>◎</span> THIS WEEK</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"14px" }}>
                <span style={{ fontSize:"36px", fontWeight:"800", color:T.accent, fontFamily:mono, lineHeight:1 }}>{weekTotal}</span>
                <span style={{ fontSize:"12px", color:T.textMuted }}>problems this week</span>
              </div>
              <div className="week-bars">
                {weekBarData.map((d,i) => (
                  <div key={i} className="week-day-row">
                    <div className="week-day-name" style={{ color:d.isToday?T.accent:T.textMuted }}>{d.label}</div>
                    <div className="week-bar-track">
                      <div className="week-bar-fill" style={{
                        width: d.count > 0 ? `${Math.max((d.count/maxWeekCount)*100, 15)}%` : "0%",
                        background: d.isToday
                          ? `linear-gradient(90deg,${T.accent},${T.accent2})`
                          : isDark ? "linear-gradient(90deg,#1a4a2e,#2a6a4e)" : "linear-gradient(90deg,#bbf7d0,#6ee7b7)",
                        minWidth: d.count > 0 ? "30px" : "0"
                      }}>
                        {d.count > 0 && d.count}
                      </div>
                    </div>
                    <div className="week-day-count" style={{ color:d.isToday?T.accent:T.textMuted }}>{d.count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Practice Sites */}
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
              <div className="tasks-title"><span>◈</span> PROBLEMS LIST</div>
              <span className="task-count-badge" style={{ background:`${T.accent}18`, color:T.accent, border:`1px solid ${T.accent}30` }}>{pendingCount} pending</span>
              {doneCount > 0 && <span className="task-count-badge" style={{ background:isDark?"#1e2535":"#e2e8f0", color:T.textMuted }}>{doneCount} solved</span>}
            </div>
            <button className="add-task-btn" onClick={() => setShowAddTask(true)}>
              <span style={{ fontSize:"15px", lineHeight:1 }}>+</span> Add Problem
            </button>
          </div>

          <div className="task-filters">
            {["All","Pending","Solved"].map((s) => (
              <button key={s} className={`filter-btn ${filterStatus===(s==="Solved"?"Completed":s)?"active":""}`}
                onClick={() => setFilterStatus(s==="Solved"?"Completed":s)}>{s}</button>
            ))}
            <div className="filter-sep" />
            {taskCategories.map((c) => (
              <button key={c} className={`filter-btn ${filterCat===c?"active":""}`} onClick={() => setFilterCat(c)}>{c}</button>
            ))}
          </div>

          <div className="task-list">
            {filteredTasks.length === 0 ? (
              <div className="task-empty">{tasks.length===0 ? "// No problems yet. Click '+ Add Problem' to begin!" : "// No problems match filters."}</div>
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
                  <div className="task-meta">
                    <span className="task-date">Added {task.addedOn}</span>
                    {task.done && task.solvedOn && <span className="task-solved-date">✅ Solved {task.solvedOn}</span>}
                  </div>
                </div>
                <button className="task-delete" onClick={() => deleteTask(task.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* MONTHLY CHART */}
        <div className="monthly-panel">
          <div className="monthly-header">
            <div className="panel-title" style={{ marginBottom:0 }}><span>◈</span> MONTHLY PROGRESS — {now2.getFullYear()}</div>
            <div style={{ display:"flex", gap:"12px" }}>
              {[
                { color:T.accent, label:"Current month" },
                { color:isDark?"#2a4a3a":"#86c8a0", label:"Past months" },
                { color:T.border, label:"Future" },
              ].map((l,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"2px", background:l.color }} />
                  <span style={{ fontSize:"10px", color:T.textMuted }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="monthly-grid">
            {monthlyData.map((m) => {
              const pct = m.totalSolved / maxSolved;
              const barH = m.totalSolved > 0 ? Math.max(pct * 100, 6) : 3;
              const barColor = m.isCurrent
                ? `linear-gradient(180deg,${T.accent},${T.accent2})`
                : m.isPast
                  ? isDark
                    ? `linear-gradient(180deg,#2a4a3a,#1a3a2a)`
                    : `linear-gradient(180deg,#86c8a0,#6ab88a)`
                  : T.border;
              return (
                <div key={m.mi} className={`month-col ${m.isCurrent?"current":""}`}>
                  <div className="month-bar-outer">
                    <div
                      className="month-bar"
                      style={{
                        height:`${barH}px`,
                        background: barColor,
                        boxShadow: m.isCurrent && m.totalSolved > 0 ? `0 0 10px ${T.accent}50` : "none",
                      }}
                    >
                      <div className="month-tooltip">
                        {m.label}<br/>
                        {m.activeDays} active days<br/>
                        {m.totalSolved} problems solved
                      </div>
                    </div>
                  </div>
                  <div className="month-label">{m.label}</div>
                </div>
              );
            })}
          </div>

          <div className="month-summary">
            {[
              { label:"Solved This Year",  val: monthlyData.reduce((a,m)=>a+m.totalSolved,0) },
              { label:"Active Days",        val: monthlyData.reduce((a,m)=>a+m.activeDays,0) },
              { label:"Best Month",         val: (() => { const b = monthlyData.reduce((a,b)=>b.totalSolved>a.totalSolved?b:a,monthlyData[0]); return b.totalSolved>0?b.label:"—"; })() },
              { label:"This Month",         val: monthlyData[now2.getMonth()]?.totalSolved || 0 },
            ].map((s,i) => (
              <div key={i} className="month-summary-item">
                <div className="month-summary-label">{s.label}</div>
                <div className="month-summary-val">{s.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={(e) => e.target===e.currentTarget&&setShowAddTask(false)}>
          <div className="modal">
            <div className="modal-title"><span>+</span> Add Problem / Topic</div>
            <div className="form-group">
              <label className="form-label">Problem / Topic Name *</label>
              <input className="form-input" placeholder="e.g. Two Sum, LRU Cache Design, OSI Model..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&addTask()} autoFocus />
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
              <button className="btn-primary" onClick={addTask}>Add Problem</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}