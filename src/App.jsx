// ==================================================================================
// SAFE DASHBOARD - FRONTEND CONTROLLER
// Developed by: Pavithra Lokesh
// Tech Stack: React, Tailwind CSS, Framer Motion, jsPDF
// ==================================================================================

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf'; // Library for generating PDF reports
import {
  Flame, Wind, Thermometer, ShieldCheck, Download,
  Activity, Sun, Moon, Zap, FileText, Wifi
} from 'lucide-react'; // Icon library

const SafeDashboard = () => {
  // --- STATE MANAGEMENT (Variables that change over time) ---
  const [emergencyMode, setEmergencyMode] = useState(false); // True = Fire Detected
  const [timer, setTimer] = useState(0); // Counts seconds since emergency started
  const [sessionLog, setSessionLog] = useState([]); // Stores the list of history events
  const [devMode, setDevMode] = useState(false); // Toggles the "Simulation" panel visibility
  const [darkMode, setDarkMode] = useState(true); // Toggles Dark/Light theme
  const timerRef = useRef(null); // Reference to the timer interval so we can stop it

  // --- MOCK DATA: ROOMS ---
  // In the future, this data will come from the Backend/Hardware team.
  // We use this state to update the UI instantly.
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Room 1', status: 'Safe for Now', type: 'safe', temp: 22, smoke: 0 },
    { id: 2, name: 'Room 2', status: 'Safe for Now', type: 'safe', temp: 23, smoke: 0 },
    { id: 3, name: 'Room 3', status: 'Safe for Now', type: 'safe', temp: 21, smoke: 0 },
    { id: 4, name: 'Room 4', status: 'Safe for Now', type: 'safe', temp: 24, smoke: 0 },
  ]);

  // --- HELPER FUNCTION: FORMAT TIME ---
  // Converts raw seconds (e.g., 65) into "00:01:05" format
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- HELPER FUNCTION: ADD LOG ---
  // Adds a new event to the "Activity Logs" panel
  const addLogEntry = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    // We keep only the last 50 logs to prevent the list from getting too long
    setSessionLog(prev => [{ time: timestamp, message, id: Date.now() }, ...prev].slice(0, 50));
  };

  // --- EFFECT: TIMER LOGIC ---
  // This runs whenever 'emergencyMode' changes.
  useEffect(() => {
    if (emergencyMode) {
      // Start counting up every 1 second
      timerRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
    } else {
      // Stop counting and reset to 0
      clearInterval(timerRef.current);
      setTimer(0);
    }
    // Cleanup function: stops timer if user leaves the page
    return () => clearInterval(timerRef.current);
  }, [emergencyMode]);

  // --- FUNCTION: TOGGLE SIMULATION ---
  // This simulates what happens when the Hardware sends a "FIRE" signal.
  const toggleEmergency = () => {
    const newMode = !emergencyMode;
    setEmergencyMode(newMode);

    if (newMode) {
      // SCENARIO: FIRE DETECTED
      addLogEntry('🚨 CRITICAL ALERT: Sensors triggered in Sector 2');
      setRooms([
        { id: 1, name: 'Room 1', status: 'Dense Smoke', type: 'smoke', temp: 28, smoke: 75 },
        { id: 2, name: 'Room 2', status: 'Fire Detected', type: 'fire', temp: 85, smoke: 90 }, // The danger room
        { id: 3, name: 'Room 3', status: 'High Temperature', type: 'temp', temp: 45, smoke: 15 },
        { id: 4, name: 'Room 4', status: 'Safe for Now', type: 'safe', temp: 26, smoke: 5 },
      ]);
    } else {
      // SCENARIO: SYSTEM RESET
      addLogEntry('✅ SYSTEM RESET: All sensors normalized');
      setRooms([
        { id: 1, name: 'Room 1', status: 'Safe for Now', type: 'safe', temp: 22, smoke: 0 },
        { id: 2, name: 'Room 2', status: 'Safe for Now', type: 'safe', temp: 23, smoke: 0 },
        { id: 3, name: 'Room 3', status: 'Safe for Now', type: 'safe', temp: 21, smoke: 0 },
        { id: 4, name: 'Room 4', status: 'Safe for Now', type: 'safe', temp: 24, smoke: 0 },
      ]);
    }
  };

  // --- FUNCTION: GENERATE PDF REPORT ---
  // Creates a professional incident report using 'jspdf'
  const exportPDF = () => {
    const doc = new jsPDF();

    // 1. Red Header Background
    doc.setFillColor(220, 38, 38); // RGB Code for Red
    doc.rect(0, 0, 210, 25, 'F');  // Filled Rectangle

    // 2. Header Text
    doc.setTextColor(255, 255, 255); // White text
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("SAFE - INCIDENT REPORT", 14, 16);
    doc.setFontSize(10);
    doc.text("Smart Adaptive Fire Evacuation System", 14, 21);

    // 3. Metadata (Date & Status)
    doc.setTextColor(0, 0, 0); // Black text
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 40);
    doc.text(`System Status: ${emergencyMode ? 'EMERGENCY ALERT' : 'NORMAL MONITORING'}`, 14, 46);
    doc.text(`Incident Duration: ${formatTime(timer)}`, 14, 52);

    // 4. Table Header (Gray Bar)
    doc.setFillColor(240, 240, 240); // Light Gray
    doc.rect(14, 60, 182, 10, 'F');

    doc.setFont("helvetica", "bold");
    doc.text("Location", 16, 66);
    doc.text("Current Status", 60, 66);
    doc.text("Temp (°C)", 130, 66);
    doc.text("Smoke (%)", 170, 66);

    // 5. Table Rows (Looping through data)
    let y = 80; // Starting Y position for the list
    rooms.forEach(room => {
      doc.setFont("helvetica", "normal");

      // Color coding logic for PDF text
      if (room.type === 'fire') doc.setTextColor(220, 0, 0); // Red for Fire
      else if (room.type === 'safe') doc.setTextColor(0, 128, 0); // Green for Safe
      else doc.setTextColor(0, 0, 0); // Black for others

      doc.text(room.name, 16, y);
      doc.text(room.status, 60, y);
      doc.text(room.temp.toString(), 130, y);
      doc.text(room.smoke.toString(), 170, y);

      // Draw a thin line under each row
      doc.setDrawColor(230, 230, 230);
      doc.line(14, y + 3, 196, y + 3);

      y += 12; // Move down for next row
    });

    // 6. Footer / Recommendation
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("System Recommendation:", 14, y + 20);
    doc.setFont("helvetica", "normal");
    const recommendation = emergencyMode
      ? "CRITICAL: Immediate evacuation of Sector 2 required. Automated sprinklers activated."
      : "Routine check complete. No anomalies detected. Maintain standard monitoring.";
    doc.text(recommendation, 14, y + 26);

    // 7. Save File
    doc.save("SAFE_Incident_Log.pdf");
    addLogEntry('📄 PDF Report downloaded successfully');
  };

  // --- HELPER: GET ICONS ---
  // Returns the correct SVG icon based on status
  const getStatusIcon = (type) => {
    switch (type) {
      case 'fire': return <Flame className="w-6 h-6 text-red-500 animate-pulse" />;
      case 'smoke': return <Wind className="w-6 h-6 text-gray-400 animate-bounce" />;
      case 'temp': return <Thermometer className="w-6 h-6 text-orange-500" />;
      case 'safe': return <ShieldCheck className="w-6 h-6 text-emerald-400" />;
      default: return null;
    }
  };

  // --- STYLING CONSTANTS (Dynamic Classes) ---
  const bgClass = darkMode ? 'bg-[#0B1120]' : 'bg-gray-100'; // Very dark blue for premium look
  const textMain = darkMode ? 'text-white' : 'text-slate-800';
  const textSub = darkMode ? 'text-slate-400' : 'text-slate-500';

  // "Glassmorphism" effect for cards (frosted glass look)
  const cardStyle = darkMode
    ? 'bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-xl'
    : 'bg-white border border-gray-200 shadow-lg';

  // ==================================================================================
  // UI RENDER START
  // ==================================================================================
  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8 font-sans transition-colors duration-500 overflow-x-hidden selection:bg-blue-500 selection:text-white`}>

      {/* 1. LOAD FONTS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* 2. EMERGENCY OVERLAY (Red Flash Background) */}
      <AnimatePresence>
        {emergencyMode && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'radial-gradient(circle at center, transparent 0%, rgba(220, 38, 38, 0.15) 100%)' }}
          >
            <div className="absolute inset-0 bg-red-500/10 animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto relative z-10">

        {/* 3. HEADER SECTION */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h1 className={`text-4xl font-extrabold tracking-tight ${textMain} flex items-center gap-3`}>
              SAFE <span className="text-sm font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">DASHBOARD</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {/* Live Connection Indicator */}
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <p className={`${textSub} text-sm`}>System Online • Connected to Master Node</p>
            </div>
          </div>

          <div className="flex gap-3 items-center">
            {/* The Simulation Button (Hidden in production later, visible for now) */}
            <button
              onClick={() => setDevMode(!devMode)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold transition-all border ${devMode
                ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.5)]'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <Zap size={18} className={devMode ? 'fill-current' : ''} />
              {devMode ? 'DEV MODE: ON' : 'SIMULATION'}
            </button>

            {/* Export Button */}
            <button onClick={exportPDF} className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-lg hover:shadow-blue-500/25 group relative">
              <Download size={20} />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Save Report</span>
            </button>

            {/* Theme Toggle */}
            <button onClick={() => setDarkMode(!darkMode)} className={`p-3 rounded-lg transition-all ${cardStyle}`}>
              {darkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>
        </header>

        {/* 4. DEVELOPER CONTROLS (Only visible when DevMode is TRUE) */}
        <AnimatePresence>
          {devMode && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="p-6 rounded-2xl bg-slate-900 border border-purple-500/30 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-purple-600/5 group-hover:bg-purple-600/10 transition-colors" />
                <div className="relative flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                      <Zap className="text-purple-400" /> Manual Override Panel
                    </h3>
                    <p className="text-slate-400 text-sm">Use this to test the emergency UI response without hardware triggers.</p>
                  </div>
                  <button
                    onClick={toggleEmergency}
                    className={`px-8 py-3 rounded-xl font-black tracking-wider uppercase shadow-xl transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3 ${emergencyMode
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-white ring-4 ring-emerald-500/20'
                      : 'bg-red-500 hover:bg-red-400 text-white ring-4 ring-red-500/20 animate-pulse'
                      }`}
                  >
                    {emergencyMode ? <ShieldCheck /> : <Flame />}
                    {emergencyMode ? 'RESTORE NORMAL' : 'TRIGGER FIRE EVENT'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. MAIN DASHBOARD GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN: ROOM SENSORS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex justify-between items-end mb-2">
              <h2 className={`text-sm font-bold uppercase tracking-widest ${textSub}`}>Live Sensors</h2>
              <span className="text-xs text-emerald-500 font-mono animate-pulse">● Receiving Data</span>
            </div>

            {rooms.map((room) => (
              <motion.div
                key={room.id}
                layout
                className={`p-5 rounded-xl border-l-4 transition-all ${cardStyle} ${room.type === 'fire' ? 'border-l-red-500 bg-red-500/5' :
                  room.type === 'smoke' ? 'border-l-gray-400' :
                    'border-l-emerald-500'
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className={`font-bold text-lg ${textMain}`}>{room.name}</h3>
                    <p className={`text-xs font-mono mt-1 font-bold ${room.type === 'fire' ? 'text-red-500' :
                      room.type === 'safe' ? 'text-emerald-500' :
                        'text-orange-500'
                      }`}>{room.status.toUpperCase()}</p>
                  </div>
                  {getStatusIcon(room.type)}
                </div>

                {/* Mini Graph Visualization (Sparklines) */}
                <div className="mt-4 pt-4 border-t border-gray-500/10 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Temp</span>
                    <div className="flex items-end gap-1 h-6 mt-1">
                      {/* Fake history bars for visual effect */}
                      <div className="w-1 bg-slate-500/20 h-[40%] rounded-t"></div>
                      <div className="w-1 bg-slate-500/20 h-[60%] rounded-t"></div>
                      <div className="w-1 bg-slate-500/20 h-[30%] rounded-t"></div>
                      <div className={`w-1 h-full rounded-t ${room.type === 'fire' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      <span className={`ml-2 text-lg font-mono leading-none ${textMain}`}>{room.temp}°</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Smoke Density</span>
                    <div className={`text-lg font-mono mt-1 ${room.smoke > 50 ? 'text-red-500' : textMain}`}>
                      {room.smoke}%
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT COLUMN: MAP & LOGS */}
          <div className="lg:col-span-8 flex flex-col gap-6">

            {/* A. MAP AREA */}
            <div className={`relative h-[420px] rounded-3xl overflow-hidden border ${darkMode ? 'border-slate-800 bg-[#0F1623]' : 'border-gray-200 bg-white'}`}>
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

              {/* Scanner Animation (Horizontal Line) */}
              <motion.div
                animate={{ top: ['0%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-[1px] bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)] opacity-50 pointer-events-none"
              />

              {/* Central Placeholder Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className={`p-8 rounded-2xl border text-center backdrop-blur-sm ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-gray-200'}`}>
                  <ShieldCheck size={56} className="text-slate-500 mx-auto mb-4" />
                  <h3 className="text-slate-300 font-bold tracking-widest text-lg">PHYSICAL LAYOUT VIEW</h3>
                  <p className="text-slate-500 text-sm mt-2">Waiting for Model Integration...</p>

                </div>

                {/* Emergency Overlay on Map */}
                {emergencyMode && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="absolute top-10 right-10 bg-red-600/90 text-white px-6 py-3 rounded-lg font-bold shadow-lg animate-pulse border border-red-400"
                  >
                    ⚠️ SECTOR 2: FIRE CONFIRMED
                  </motion.div>
                )}
              </div>
            </div>

            {/* B. BOTTOM INFO GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Timer Card */}
              <div className={`rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center items-center shadow-lg transition-colors duration-500 ${emergencyMode
                ? 'bg-gradient-to-br from-red-700 to-red-900 text-white'
                : 'bg-gradient-to-br from-emerald-600 to-teal-800 text-white'
                }`}>
                {/* Background Icon */}
                <Activity className="absolute top-4 right-4 opacity-10" size={100} />

                <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Event Timer</p>
                <div className="text-6xl font-mono font-bold tracking-wider z-10 drop-shadow-2xl">
                  {formatTime(timer)}
                </div>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-black/20 text-sm font-bold backdrop-blur-sm border border-white/10">
                  {emergencyMode ? 'STATUS: CRITICAL ALERT' : 'STATUS: ACTIVE MONITORING'}
                </div>
              </div>

              {/* Logs Card */}
              <div className={`${cardStyle} rounded-2xl p-6 h-56 flex flex-col`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-sm font-bold uppercase tracking-widest ${textSub} flex items-center gap-2`}>
                    <FileText size={16} /> System Logs
                  </h3>
                  <Wifi size={14} className="text-emerald-500" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {sessionLog.map((log) => (
                    <div key={log.id} className="text-xs border-b border-gray-500/10 pb-2 last:border-0">
                      <span className="text-blue-500 font-mono mr-2">[{log.time}]</span>
                      <span className={textMain}>{log.message}</span>
                    </div>
                  ))}
                  {sessionLog.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                      <Activity size={24} className="mb-2" />
                      <span className="text-xs">System initialized. Waiting for events...</span>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeDashboard;