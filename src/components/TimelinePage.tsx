import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Invoice, Timeline } from "../types";
import TimelineComponent from "./Timeline";
import { ChevronLeft, Info, Globe, Lock, Share2 } from "lucide-react";
import { api } from "../lib/api";

export default function TimelinePage({ isPublicView = false }: { isPublicView?: boolean }) {
  const { id, slug } = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPublicView && slug) {
      // Try by slug first
      api.getTimelineBySlug(slug)
        .then(tData => {
          if (tData) {
            setTimeline(tData);
            setIsPublic(tData.isPublic);
          } else {
            // Check if it's actually a UUID
            return api.getTimeline(slug).then(tData => {
              setTimeline(tData);
              setIsPublic(tData.isPublic);
            });
          }
        })
        .catch(err => {
          setError("Timeline not found or access denied.");
          console.error("Public Timeline Fetch Error:", err);
        });
    } else if (id) {
      api.getInvoice(id)
        .then(data => {
          setInvoice(data);
          return api.getTimeline(data.timelineId);
        })
        .then(tData => {
          setTimeline(tData);
          setIsPublic(tData.isPublic);
        })
        .catch(err => console.error("Timeline Page Fetch Error:", err));
    }
  }, [id, slug, isPublicView]);

  const toggleVisibility = async () => {
    if (isPublicView || !timeline) return;
    const newStatus = !isPublic;
    try {
      await api.updateTimelineVisibility(timeline.id, newStatus);
      setIsPublic(newStatus);
    } catch (err) {
      console.error("Error updating visibility:", err);
    }
  };

  const getSlug = (t: Timeline) => {
    return `${t.agencyName}-${t.projectName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  const copyPublicLink = () => {
    const slugVal = timeline ? getSlug(timeline) : timeline?.id;
    const url = `${window.location.origin}/t/${slugVal}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (error) return (
    <div className="p-12 text-center text-red-600 font-bold bg-white rounded-2xl border border-red-100">
      {error}
      <div className="mt-4">
        <Link to="/" className="text-sm font-medium text-blue-600 hover:underline">Back to Home</Link>
      </div>
    </div>
  );

  if (!timeline) return <div className="p-12 text-center text-gray-500">Loading Timeline...</div>;

  const content = (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isPublicView && invoice && (
            <Link to={`/invoices/${invoice.id}`} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </Link>
          )}
          {timeline.agencyLogoUrl && (
            <img 
              src={timeline.agencyLogoUrl} 
              alt={timeline.agencyName || "Agency Logo"} 
              className="w-10 h-10 rounded-lg object-contain bg-white border border-[#F0F0F0] p-1"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {timeline.projectName || "Project Timeline"}
            </h1>
            <p className="text-sm text-[#666]">
              By <span className="font-medium text-[#1A1A1A]">{timeline.agencyName || "Agency Name"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isPublicView && (
            <button 
              onClick={toggleVisibility}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isPublic 
                  ? "bg-green-50 text-green-700 border border-green-100" 
                  : "bg-gray-50 text-gray-600 border border-gray-200"
              }`}
            >
              {isPublic ? <Globe size={16} /> : <Lock size={16} />}
              {isPublic ? "Public" : "Private"}
            </button>
          )}
          
          {!isPublicView && isPublic && (
            <button 
              onClick={copyPublicLink}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
                copied ? "text-green-600 bg-green-50" : "text-[#999] hover:text-blue-600 hover:bg-blue-50"
              }`}
            >
              <Share2 size={18} />
              {copied ? "Copied!" : "Copy Public Link"}
            </button>
          )}
        </div>
      </header>

      {!isPublicView && (
        isPublic ? (
          <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-green-100 rounded-lg text-green-600">
              <Globe size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">This timeline is PUBLIC</p>
              <p className="text-sm text-green-700/80 leading-relaxed mt-0.5">
                Clients can view this timeline via the secure link without accessing your billing or invoice details.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
              <Lock size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-800">This timeline is PRIVATE</p>
              <p className="text-sm text-blue-700/80 leading-relaxed mt-0.5">
                Only you can see this timeline. Turn it Public to share progress with your client.
              </p>
            </div>
          </div>
        )
      )}

      {isPublicView && !isPublic && (
        <div className="bg-red-50 border border-red-100 p-8 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-bold text-red-900">Access Restricted</h2>
          <p className="text-sm text-red-700 max-w-sm mx-auto">
            This project timeline has been set to private by the agency. Please contact the agency if you think this is a mistake.
          </p>
          <Link to="/" className="inline-block text-sm font-bold text-red-600 hover:underline">
            Back to Home
          </Link>
        </div>
      )}

      {(isPublicView ? isPublic : true) && (
        <TimelineComponent 
          timelineId={timeline.id} 
          isPublicView={isPublicView}
        />
      )}
    </div>
  );

  if (isPublicView) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] py-12 px-6">
        <div className="max-w-5xl mx-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
