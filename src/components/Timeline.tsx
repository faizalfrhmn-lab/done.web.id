import React, { useEffect, useState } from "react";
import { Timeline, TimelineEntry, TimelineEntryType } from "../types";
import { Clock, Send, Sparkles, User, Calendar, Trash2, CheckCircle2, Circle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateTimelineEntries } from "../lib/gemini";
import { TimelineEntryStatus } from "../types";

export default function TimelineView({ timelineId, isPublicView = false }: { timelineId: string, isPublicView?: boolean }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dayOffs, setDayOffs] = useState<string[]>(["Saturday", "Sunday"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"timeline" | "sheet">("timeline");
  const [manualCategory, setManualCategory] = useState("General");

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDayOff = (day: string) => {
    setDayOffs(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  useEffect(() => {
    setError(null);
    fetch(`/api/timelines/${timelineId}`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Timeline not found");
        return data;
      })
      .then(data => {
        setTimeline(data);
        setAgencyName(data.agencyName || "");
        setProjectName(data.projectName || "");
        setAgencyLogoUrl(data.agencyLogoUrl || "");
      })
      .catch(err => {
        setError(err.message);
      });
  }, [timelineId]);

  const sortedEntries = timeline?.entries ? [...timeline.entries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
  }) : [];

  // Helper to get date range for Sheet view
  const getDateRange = () => {
    if (!timeline?.entries.length) return [];
    const dates = timeline.entries.map(e => new Date(e.date).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    
    // Add some padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 7);

    const range = [];
    let current = new Date(minDate);
    while (current <= maxDate) {
      range.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return range;
  };

  const dateRange = getDateRange();

  // Group entries by category
  const groupedEntries: Record<string, TimelineEntry[]> = {};
  timeline?.entries.forEach(entry => {
    const cat = entry.category || "General";
    if (!groupedEntries[cat]) groupedEntries[cat] = [];
    groupedEntries[cat].push(entry);
  });

  const updateTimelineInfo = async () => {
    const res = await fetch(`/api/timelines/${timelineId}/info`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agencyName, projectName, agencyLogoUrl }),
    });
    if (res.ok && timeline) {
      setTimeline({ ...timeline, agencyName, projectName, agencyLogoUrl });
    }
  };

  const toggleEntryStatus = async (entryId: string, currentStatus: TimelineEntryStatus) => {
    const newStatus = currentStatus === TimelineEntryStatus.DONE 
      ? TimelineEntryStatus.ON_PROGRESS 
      : TimelineEntryStatus.DONE;

    const res = await fetch(`/api/timelines/${timelineId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok && timeline) {
      setTimeline({
        ...timeline,
        entries: timeline.entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e)
      });
    }
  };

  const cycleStatus = async (entryId: string, currentStatus: TimelineEntryStatus) => {
    if (currentStatus === TimelineEntryStatus.DONE) return;
    
    const newStatus = currentStatus === TimelineEntryStatus.ON_PROGRESS 
      ? TimelineEntryStatus.WAIT_FEEDBACK 
      : TimelineEntryStatus.ON_PROGRESS;

    const res = await fetch(`/api/timelines/${timelineId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok && timeline) {
      setTimeline({
        ...timeline,
        entries: timeline.entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e)
      });
    }
  };

  const addEntry = async (entry: Partial<TimelineEntry>) => {
    const res = await fetch(`/api/timelines/${timelineId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    const newEntry = await res.json();
    if (timeline) {
      setTimeline({
        ...timeline,
        entries: [...timeline.entries, newEntry],
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescription.trim()) return;
    addEntry({ description: manualDescription, type: TimelineEntryType.MANUAL, category: manualCategory });
    setManualDescription("");
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    const results = await generateTimelineEntries(aiPrompt, startDate, dayOffs);
    
    if (results && results.length > 0) {
      const formattedEntries = results.map((item: any) => ({
        description: item.description,
        date: new Date(item.date).toISOString(),
        type: TimelineEntryType.AI
      }));

      const res = await fetch(`/api/timelines/${timelineId}/entries/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: formattedEntries }),
      });

      if (res.ok) {
        const newEntries = await res.json();
        if (timeline) {
          setTimeline({
            ...timeline,
            entries: [...timeline.entries, ...newEntries],
          });
        }
      }
    }
    
    setAiPrompt("");
    setIsGenerating(false);
  };

  if (error) return (
    <div className="p-8 bg-red-50 border border-red-100 rounded-2xl text-center space-y-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-red-900">Timeline Error</h2>
      <p className="text-sm text-red-700">{error}</p>
      <button 
        onClick={() => window.location.reload()}
        className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );

  if (!timeline) return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-[#666]">Loading timeline...</p>
    </div>
  );

  return (
    <div className={`grid grid-cols-1 ${isPublicView ? "" : "lg:grid-cols-3"} gap-8`}>
      {/* Entries List */}
      <div className={`${isPublicView ? "" : "lg:col-span-2"} space-y-6`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[10px] font-bold text-[#999] uppercase tracking-widest flex items-center gap-2">
            <Calendar size={12} className="text-blue-600" />
            Project Progress
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode("timeline")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === "timeline" ? "bg-white shadow-sm text-blue-600" : "text-[#999]"}`}
              >
                Timeline
              </button>
              <button 
                onClick={() => setViewMode("sheet")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode === "sheet" ? "bg-white shadow-sm text-blue-600" : "text-[#999]"}`}
              >
                Sheet
              </button>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setSortOrder("asc")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${sortOrder === "asc" ? "bg-white shadow-sm text-blue-600" : "text-[#999]"}`}
              >
                Oldest
              </button>
              <button 
                onClick={() => setSortOrder("desc")}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${sortOrder === "desc" ? "bg-white shadow-sm text-blue-600" : "text-[#999]"}`}
              >
                Latest
              </button>
            </div>
          </div>
        </div>

        <div className={`relative ${viewMode === "timeline" ? "pl-8" : ""}`}>
          {viewMode === "timeline" && (
            <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-[#E5E5E5]" />
          )}
          
          <AnimatePresence mode="wait">
            {viewMode === "timeline" ? (
              <motion.div 
                key="timeline"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {timeline.entries.length === 0 && (
                  <p className="text-[#999] italic">No events recorded yet.</p>
                )}
                {sortedEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="relative mb-10 last:mb-0"
                  >
                    <div className={`absolute -left-[25px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
                      entry.status === TimelineEntryStatus.DONE ? "border-green-500" : 
                      entry.status === TimelineEntryStatus.WAIT_FEEDBACK ? "border-amber-500" : "border-blue-500"
                    }`}>
                      {entry.status === TimelineEntryStatus.DONE && <CheckCircle2 size={8} className="text-green-500" />}
                    </div>

                    <div className={`bg-white p-5 rounded-2xl border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow group/item flex gap-4 ${
                      entry.status === TimelineEntryStatus.DONE ? "opacity-60" : ""
                    }`}>
                      <button 
                        onClick={() => !isPublicView && toggleEntryStatus(entry.id, entry.status)}
                        className={`mt-1 flex-shrink-0 transition-colors ${
                          entry.status === TimelineEntryStatus.DONE ? "text-green-500" : "text-[#E5E5E5] hover:text-blue-400"
                        } ${isPublicView ? "cursor-default" : ""}`}
                      >
                        {entry.status === TimelineEntryStatus.DONE ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#999] flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                          <span 
                            onClick={() => !isPublicView && cycleStatus(entry.id, entry.status)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                              entry.status === TimelineEntryStatus.DONE ? "bg-green-100 text-green-700" : 
                              entry.status === TimelineEntryStatus.WAIT_FEEDBACK ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                            } ${isPublicView ? "cursor-default" : "cursor-pointer hover:scale-105 active:scale-95"}`}
                          >
                            {entry.status}
                          </span>
                        </div>
                        <p className={`text-[#1A1A1A] leading-relaxed ${
                          entry.status === TimelineEntryStatus.DONE ? "line-through text-[#999]" : ""
                        }`}>
                          {entry.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="sheet"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-[#E5E5E5]">
                        <th className="p-4 text-[10px] font-bold text-[#999] uppercase tracking-widest w-32">Date</th>
                        <th className="p-4 text-[10px] font-bold text-[#999] uppercase tracking-widest w-40">Category</th>
                        <th className="p-4 text-[10px] font-bold text-[#999] uppercase tracking-widest">Task / Update</th>
                        <th className="p-4 text-[10px] font-bold text-[#999] uppercase tracking-widest w-32 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F0]">
                      {sortedEntries.map((entry) => (
                        <tr 
                          key={entry.id} 
                          className={`group hover:bg-gray-50/50 transition-colors ${
                            entry.status === TimelineEntryStatus.DONE ? "bg-gray-50/30" : ""
                          }`}
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1A1A1A]">
                                {new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                              </span>
                              <span className="text-[10px] text-[#999] uppercase font-medium">
                                {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tight">
                              {entry.category || "General"}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                entry.status === TimelineEntryStatus.DONE ? "bg-green-500" : 
                                entry.status === TimelineEntryStatus.WAIT_FEEDBACK ? "bg-amber-400" : "bg-blue-500"
                              }`} />
                              <p className={`text-xs leading-relaxed ${
                                entry.status === TimelineEntryStatus.DONE ? "text-[#999] line-through italic" : "text-[#1A1A1A] font-medium"
                              }`}>
                                {entry.description}
                              </p>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              <button 
                                onClick={() => !isPublicView && cycleStatus(entry.id, entry.status)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${
                                  entry.status === TimelineEntryStatus.DONE ? "bg-green-100 text-green-700 hover:bg-green-200" : 
                                  entry.status === TimelineEntryStatus.WAIT_FEEDBACK ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : 
                                  "bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-sm"
                                } ${isPublicView ? "cursor-default" : "active:scale-95"}`}
                              >
                                {entry.status}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {timeline.entries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-[#999] text-xs italic">
                            No entries found for this project yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Input Column */}
      {!isPublicView && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm sticky top-8">
            <div className="mb-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Agency Name</label>
                <input 
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  onBlur={updateTimelineInfo}
                  placeholder="Your Agency Name"
                  className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Project Name</label>
                <input 
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={updateTimelineInfo}
                  placeholder="Standard Project Name"
                  className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Agency Logo URL</label>
                <input 
                  type="text"
                  value={agencyLogoUrl}
                  onChange={(e) => setAgencyLogoUrl(e.target.value)}
                  onBlur={updateTimelineInfo}
                  placeholder="https://..."
                  className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab("manual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "manual" ? "bg-white shadow text-blue-600" : "text-[#666]"
                }`}
              >
                <User size={14} />
                Manual
              </button>
              <button 
                onClick={() => setActiveTab("ai")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === "ai" ? "bg-white shadow text-purple-600" : "text-[#666]"
                }`}
              >
                <Sparkles size={14} />
                AI Prompt
              </button>
            </div>

            {activeTab === "manual" ? (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Category / Section</label>
                    <input 
                      type="text"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      placeholder="e.g. Pre-Production, Design"
                      className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#999] uppercase tracking-wider">Update Description</label>
                    <textarea
                      value={manualDescription}
                      onChange={(e) => setManualDescription(e.target.value)}
                      placeholder="What happened today?"
                      className="w-full h-32 p-4 bg-gray-50 border border-[#E5E5E5] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
                >
                  <Send size={16} />
                  Post Update
                </button>
              </form>
            ) : (
              <form onSubmit={handleAiSubmit} className="space-y-6">
                <div className="space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">1. Project Setup</label>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#999]">Start Date</span>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-100 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-[#999]">Days Off</span>
                    <div className="flex flex-wrap gap-1">
                      {DAYS.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDayOff(day)}
                          className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
                            dayOffs.includes(day) 
                              ? "bg-purple-600 text-white shadow-sm" 
                              : "bg-white text-purple-600 border border-purple-100"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">2. Input Schedule</label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Paste your schedule here... e.g. 'Minggu 1: Senin setup, Selasa slicing...'"
                    className="w-full h-48 p-4 bg-white border border-purple-100 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none font-mono text-xs"
                  />
                  <p className="text-[10px] text-[#999]">AI will convert your natural language schedule into specific dated entries.</p>
                </div>

                <button 
                  type="submit"
                  disabled={isGenerating}
                  className="w-full py-3 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-lg shadow-purple-100"
                >
                  {isGenerating ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Sparkles size={16} />
                    </motion.div>
                  ) : <Sparkles size={16} />}
                  {isGenerating ? "Processing Schedule..." : "Generate Timeline"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
