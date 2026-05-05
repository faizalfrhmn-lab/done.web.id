import React, { useEffect, useState } from "react";
import { Timeline, TimelineEntry, TimelineEntryType, TimelineFeedback } from "../types";
import { Clock, Send, Sparkles, User, Calendar, Trash2, CheckCircle2, Circle, MessageSquare, Plus, Settings, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { generateTimelineEntries } from "../lib/gemini";
import { TimelineEntryStatus } from "../types";
import { api } from "../lib/api";

export default function TimelineView({ timelineId, isPublicView = false }: { timelineId: string, isPublicView?: boolean }) {
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [feedbacks, setFeedbacks] = useState<TimelineFeedback[]>([]);
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackName, setFeedbackName] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedbackPassword, setFeedbackPassword] = useState("");
  const [isTimelineAuthed, setIsTimelineAuthed] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showTimelinePassword, setShowTimelinePassword] = useState(false);
  const [agencyName, setAgencyName] = useState("");
  const [projectName, setProjectName] = useState("");
  const [agencyLogoUrl, setAgencyLogoUrl] = useState("");
  const [timelinePassword, setTimelinePassword] = useState("");
  const [authorizedClients, setAuthorizedClients] = useState<string[]>([]);
  const [newClientName, setNewClientName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [manualDescription, setManualDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [dayOffs, setDayOffs] = useState<string[]>(["Saturday", "Sunday"]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "ai">("manual");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [viewMode, setViewMode] = useState<"timeline" | "sheet">("timeline");
  const [manualCategory, setManualCategory] = useState("General");
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [isSyncingDates, setIsSyncingDates] = useState(false);
  const [isDeletingFeedback, setIsDeletingFeedback] = useState<string | null>(null);
  const [isUpdatingEntry, setIsUpdatingEntry] = useState<string | null>(null);

  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  const toggleDayOff = (day: string) => {
    setDayOffs(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  useEffect(() => {
    setError(null);
    api.getTimeline(timelineId)
      .then(data => {
        setTimeline(data);
        setAgencyName(data.agencyName || "");
        setProjectName(data.projectName || "");
        setAgencyLogoUrl(data.agencyLogoUrl || "");
        setTimelinePassword(data.password || "");
        setAuthorizedClients(data.authorizedClients || []);
      })
      .catch(err => {
        setError(err.message);
      });
    
    api.getFeedback(timelineId)
      .then(setFeedbacks)
      .catch(err => console.error("Feedback fetch error:", err));
  }, [timelineId]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim() || !feedbackName.trim()) return;
    
    setIsSubmittingFeedback(true);
    try {
      const newFeedback = await api.addFeedback(timelineId, feedbackName, feedbackContent);
      setFeedbacks(prev => [newFeedback, ...prev]);
      setFeedbackContent("");
      // Keep Name for convenience
    } catch (err) {
      console.error("Error submitting feedback:", err);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm("Are you sure you want to delete this feedback?")) return;
    setIsDeletingFeedback(id);
    try {
      await api.deleteFeedback(id);
      setFeedbacks(prev => prev.filter(fb => fb.id !== id));
    } catch (err) {
      console.error("Error deleting feedback:", err);
    } finally {
      setIsDeletingFeedback(null);
    }
  };

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
    setIsSavingSettings(true);
    setSaveError(null);
    try {
      const updated = await api.updateTimelineInfo(timelineId, { 
        agencyName, 
        projectName, 
        agencyLogoUrl,
        password: timelinePassword,
        authorizedClients
      });
      if (timeline) {
        setTimeline({ ...timeline, ...updated });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      console.error("Error updating timeline info:", err);
      setSaveError(err?.message || "Failed to save settings. Please check your connection.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTimelineLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackName.trim()) {
      setError("Please enter your name");
      return;
    }
    
    // Check if name is authorized (if list is present)
    if (authorizedClients.length > 0 && !authorizedClients.includes(feedbackName.trim())) {
      setError("Your name is not on the authorized list for this project.");
      return;
    }

    if (timeline?.password && feedbackPassword === timeline.password) {
      setIsTimelineAuthed(true);
      setError(null);
    } else {
      setError("Invalid project password");
    }
  };

  const addAuthorizedClient = () => {
    if (!newClientName.trim()) return;
    if (authorizedClients.includes(newClientName.trim())) return;
    setAuthorizedClients(prev => [...prev, newClientName.trim()]);
    setNewClientName("");
  };

  const removeAuthorizedClient = (client: string) => {
    setAuthorizedClients(prev => prev.filter(c => c !== client));
  };

  const toggleEntryStatus = async (entryId: string, currentStatus: TimelineEntryStatus) => {
    const newStatus = currentStatus === TimelineEntryStatus.DONE 
      ? TimelineEntryStatus.ON_PROGRESS 
      : TimelineEntryStatus.DONE;

    try {
      await api.updateEntryStatus(entryId, newStatus);
      if (timeline) {
        setTimeline({
          ...timeline,
          entries: timeline.entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e)
        });
      }
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const cycleStatus = async (entryId: string, currentStatus: TimelineEntryStatus) => {
    if (currentStatus === TimelineEntryStatus.DONE) return;
    
    const newStatus = currentStatus === TimelineEntryStatus.ON_PROGRESS 
      ? TimelineEntryStatus.WAIT_FEEDBACK 
      : TimelineEntryStatus.ON_PROGRESS;

    try {
      await api.updateEntryStatus(entryId, newStatus);
      if (timeline) {
        setTimeline({
          ...timeline,
          entries: timeline.entries.map(e => e.id === entryId ? { ...e, status: newStatus } : e)
        });
      }
    } catch (err) {
      console.error("Error cycling status:", err);
    }
  };

  const addEntry = async (entry: Partial<TimelineEntry>) => {
    try {
      const newEntry = await api.addSingleTimelineEntry(timelineId, entry);
      if (timeline) {
        setTimeline({
          ...timeline,
          entries: [...timeline.entries, newEntry],
        });
      }
    } catch (err) {
      console.error("Error adding entry:", err);
    }
  };

  const startEditing = (entry: TimelineEntry) => {
    setEditingEntryId(entry.id);
    setEditDescription(entry.description);
    setEditDate(new Date(entry.date).toISOString().split("T")[0]);
    setIsSyncingDates(false);
  };

  const cancelEditing = () => {
    setEditingEntryId(null);
    setEditDescription("");
    setEditDate("");
  };

  const saveEntryUpdate = async () => {
    if (!editingEntryId || !timeline) return;
    
    const entry = timeline.entries.find(e => e.id === editingEntryId);
    if (!entry) return;

    setIsUpdatingEntry(editingEntryId);
    try {
      const newDate = new Date(editDate).toISOString();
      const oldDate = new Date(entry.date).toISOString();
      
      const timeDiff = new Date(newDate).getTime() - new Date(oldDate).getTime();
      
      let updatedEntries = timeline.entries.map(e => {
        if (e.id === editingEntryId) {
          return { ...e, description: editDescription, date: newDate };
        }
        
        // Cascading update
        if (isSyncingDates && new Date(e.date).getTime() > new Date(oldDate).getTime()) {
          const currentEntryDate = new Date(e.date).getTime();
          const shiftedDate = new Date(currentEntryDate + timeDiff).toISOString();
          return { ...e, date: shiftedDate };
        }
        
        return e;
      });

      // Update in DB (sequentially if syncing, or just the one)
      if (isSyncingDates) {
        // Find entries that shifted
        const shifted = updatedEntries.filter((e, idx) => e.date !== timeline.entries[idx].date || e.id === editingEntryId);
        
        // This is a bit expensive but thorough
        await Promise.all(shifted.map(e => api.updateTimelineEntry(e.id, { 
          description: e.id === editingEntryId ? editDescription : e.description, 
          date: e.date 
        })));
      } else {
        await api.updateTimelineEntry(editingEntryId, { description: editDescription, date: newDate });
      }

      setTimeline({ ...timeline, entries: updatedEntries });
      setEditingEntryId(null);
    } catch (err) {
      console.error("Error updating entry:", err);
      alert("Failed to update entry");
    } finally {
      setIsUpdatingEntry(null);
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

      try {
        const newEntries = await api.addTimelineEntries(timelineId, formattedEntries);
        if (timeline) {
          setTimeline({
            ...timeline,
            entries: [...timeline.entries, ...newEntries],
          });
        }
      } catch (err) {
        console.error("Error adding bulk entries:", err);
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
            {!isPublicView && (
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all ${showSettings ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-[#999] hover:text-blue-600"}`}
                title="Timeline Settings"
              >
                <Settings size={18} />
              </button>
            )}
            <button 
              onClick={() => setShowFeedback(!showFeedback)}
              className={`p-2 rounded-lg transition-all relative ${showFeedback ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-[#999] hover:text-amber-600"}`}
              title="Project Feedback"
            >
              <MessageSquare size={18} />
              {feedbacks.length > 0 && !showFeedback && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {feedbacks.length}
                </span>
              )}
            </button>
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

        <AnimatePresence>
          {showSettings && !isPublicView && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Agency Name</label>
                  <input 
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Your Agency Name"
                    className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Project Name</label>
                  <input 
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g. Website Development"
                    className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Agency Logo URL</label>
                  <input 
                    type="text"
                    value={agencyLogoUrl}
                    onChange={(e) => setAgencyLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Project Password (for access)</label>
                  <div className="relative">
                    <input 
                      type={showTimelinePassword ? "text" : "password"}
                      value={timelinePassword}
                      onChange={(e) => setTimelinePassword(e.target.value)}
                      placeholder="Set password for public access"
                      className="w-full p-2 pr-10 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTimelinePassword(!showTimelinePassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#999] hover:text-blue-600 transition-colors"
                    >
                      {showTimelinePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3 border-t border-[#F0F0F0] pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-[#999] uppercase tracking-widest">Authorized Names (Optional)</label>
                    <span className="text-[9px] text-[#999]">If empty, anyone with password can access.</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addAuthorizedClient()}
                      placeholder="Enter full name as you want them to type it"
                      className="flex-1 p-2 bg-gray-50 border border-[#E5E5E5] rounded-lg text-xs font-medium text-[#1A1A1A] focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button 
                      onClick={addAuthorizedClient}
                      className="px-4 py-2 bg-gray-100 text-[#666] border border-[#E5E5E5] rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                    >
                      Add
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {authorizedClients.map(client => (
                      <span key={client} className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold border border-blue-100 animate-in fade-in zoom-in duration-200">
                        {client}
                        <button onClick={() => removeAuthorizedClient(client)} className="hover:text-red-500 transition-colors">
                          <Plus size={12} className="rotate-45" />
                        </button>
                      </span>
                    ))}
                    {authorizedClients.length === 0 && (
                      <span className="text-[10px] text-[#999] italic">Public access enabled (anyone with the password can feedback).</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-3 flex items-center justify-between border-t border-[#F0F0F0] pt-6">
                  <div className="flex flex-col gap-1">
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[10px] font-bold text-green-600 flex items-center gap-1"
                        >
                          <CheckCircle2 size={12} />
                          Settings Saved Successfully!
                        </motion.span>
                      )}
                      {saveError && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[10px] font-bold text-red-500 flex items-center gap-1"
                        >
                          <Plus size={12} className="rotate-45" />
                          {saveError}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <button 
                    onClick={updateTimelineInfo}
                    disabled={isSavingSettings}
                    className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/10 disabled:opacity-50"
                  >
                    {isSavingSettings ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {showFeedback && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-white p-6 rounded-2xl border border-[#E5E5E5] shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <MessageSquare size={16} className="text-amber-500" />
                    Project Feedbacks
                  </h3>
                </div>

                {!isTimelineAuthed && isPublicView && timeline?.password ? (
                  <form onSubmit={handleTimelineLogin} className="p-6 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                        <Eye size={16} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-900">Sign in to Comment</h4>
                        <p className="text-[10px] text-amber-700">Enter your name and project password to leave feedback.</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <input 
                          type="text"
                          required
                          value={feedbackName}
                          onChange={(e) => setFeedbackName(e.target.value)}
                          placeholder="Your Name"
                          className="w-full p-3 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div className="space-y-1 relative">
                        <input 
                          type={showTimelinePassword ? "text" : "password"}
                          required
                          value={feedbackPassword}
                          onChange={(e) => setFeedbackPassword(e.target.value)}
                          placeholder="Project Password"
                          className="w-full p-3 pr-10 bg-white border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTimelinePassword(!showTimelinePassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400"
                        >
                          {showTimelinePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    
                    {error && <p className="text-[10px] text-red-500 font-bold bg-white p-2 rounded-lg border border-red-100">{error}</p>}
                    
                    <button 
                      type="submit"
                      className="w-full bg-amber-500 text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20"
                    >
                      Unlock Feedback Access
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input 
                        type="text"
                        required
                        readOnly={isTimelineAuthed}
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        placeholder="Your Name"
                        className={`p-3 bg-gray-50 border border-[#E5E5E5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 ${isTimelineAuthed ? "opacity-75 cursor-not-allowed" : ""}`}
                      />
                      <button 
                        type="submit"
                        disabled={isSubmittingFeedback}
                        className="bg-amber-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {isSubmittingFeedback ? "Sending..." : "Submit Feedback"}
                      </button>
                    </div>
                    <textarea 
                      required
                      value={feedbackContent}
                      onChange={(e) => setFeedbackContent(e.target.value)}
                      placeholder="Leave a comment or question about the project progress..."
                      className="w-full h-24 p-3 bg-gray-50 border border-[#E5E5E5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
                    />
                  </form>
                )}

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {feedbacks.length === 0 ? (
                    <p className="text-center text-[#999] text-xs italic py-4">No feedback yet. Be the first to shout!</p>
                  ) : (
                    feedbacks.map((fb) => (
                      <div key={fb.id} className="p-3 bg-gray-50 rounded-xl border border-[#F0F0F0] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-amber-600">{fb.authorName}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#999]">
                              {new Date(fb.createdAt).toLocaleDateString()} {new Date(fb.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!isPublicView && (
                              <button 
                                onClick={() => deleteFeedback(fb.id)}
                                disabled={isDeletingFeedback === fb.id}
                                className="text-[#999] hover:text-red-500 transition-colors disabled:opacity-50"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-[#444] leading-relaxed">{fb.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                        
                        <div className="flex-1 min-w-0">
                          {editingEntryId === entry.id ? (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input 
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="p-2 border border-[#E5E5E5] rounded-xl text-xs bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <label className="flex items-center gap-2 text-[10px] font-bold text-[#666] cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={isSyncingDates}
                                    onChange={(e) => setIsSyncingDates(e.target.checked)}
                                    className="rounded text-blue-500"
                                  />
                                  Sync future dates
                                </label>
                              </div>
                              <textarea 
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full p-3 border border-[#E5E5E5] rounded-xl text-xs bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                              />
                              <div className="flex justify-end gap-2 text-xs">
                                <button 
                                  onClick={cancelEditing}
                                  className="px-4 py-2 font-bold text-[#999] hover:text-[#666]"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={saveEntryUpdate}
                                  disabled={isUpdatingEntry === entry.id}
                                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {isUpdatingEntry === entry.id ? "Saving..." : "Save Changes"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#999] flex items-center gap-1.5">
                                    <Clock size={12} />
                                    {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                  </span>
                                  {entry.type === TimelineEntryType.MANUAL && (
                                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wider">
                                      {entry.category || "General"}
                                    </span>
                                  )}
                                  {!isPublicView && (
                                    <button 
                                      onClick={() => startEditing(entry)}
                                      className="opacity-0 group-hover/item:opacity-100 transition-opacity text-[#999] hover:text-blue-600"
                                    >
                                      <Settings size={12} />
                                    </button>
                                  )}
                                </div>
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
                            </>
                          )}
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
                            {editingEntryId === entry.id ? (
                              <div className="space-y-2">
                                <input 
                                  type="date"
                                  value={editDate}
                                  onChange={(e) => setEditDate(e.target.value)}
                                  className="p-1 border border-[#E5E5E5] rounded text-[10px] bg-gray-50 w-full"
                                />
                                <label className="flex items-center gap-1 text-[8px] font-bold text-[#999] cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={isSyncingDates}
                                    onChange={(e) => setIsSyncingDates(e.target.checked)}
                                    className="rounded text-blue-500 scale-75"
                                  />
                                  Sync
                                </label>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-[#1A1A1A]">
                                  {new Date(entry.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-[10px] text-[#999] uppercase font-medium">
                                  {new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {entry.type === TimelineEntryType.MANUAL && (
                              <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-tight">
                                {entry.category || "General"}
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {editingEntryId === entry.id ? (
                              <div className="space-y-2">
                                <textarea 
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full p-2 border border-[#E5E5E5] rounded text-[10px] bg-gray-50 focus:outline-none min-h-[60px]"
                                />
                                <div className="flex gap-2">
                                  <button 
                                    onClick={saveEntryUpdate}
                                    disabled={isUpdatingEntry === entry.id}
                                    className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-bold"
                                  >
                                    {isUpdatingEntry === entry.id ? "..." : "Save"}
                                  </button>
                                  <button 
                                    onClick={cancelEditing}
                                    className="text-[#999] text-[10px] font-bold"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between gap-3">
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
                                {!isPublicView && (
                                  <button 
                                    onClick={() => startEditing(entry)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-[#999] hover:text-blue-600"
                                  >
                                    <Settings size={12} />
                                  </button>
                                )}
                              </div>
                            )}
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
            <div className="mb-6">
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-[#E5E5E5]">
                    <Settings size={14} className="text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-[#1A1A1A]">Project Info</span>
                </div>
                <Plus size={14} className={`text-[#999] transition-transform ${showSettings ? "rotate-45" : ""}`} />
              </button>
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

      {/* Footer */}
      <footer className="mt-16 pt-12 border-t border-[#F0F0F0] lg:col-span-3 col-span-1 pb-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 bg-[#1A1A1A] rounded flex items-center justify-center">
                <span className="text-[8px] font-black text-white italic">DT</span>
              </div>
              <span className="text-xs font-black tracking-tight uppercase">Done Task</span>
            </div>
            <p className="text-[10px] text-[#999] font-medium italic">Crafting digital progress, one task at a time.</p>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="text-[9px] font-bold text-[#666] uppercase tracking-[0.3em] flex items-center gap-3">
              <span>Bandung</span>
              <span className="w-1 h-1 bg-[#E5E5E5] rounded-full" />
              <span>Indonesia</span>
            </div>
            <p className="text-[9px] font-bold text-[#999] opacity-50 uppercase tracking-widest">
              © 2026 Done Task Management System
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
