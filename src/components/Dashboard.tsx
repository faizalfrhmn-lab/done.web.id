import React from "react";
import { motion } from "motion/react";

const Dashboard = () => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
    <header className="flex justify-between items-end">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter text-[#0F172A] leading-none">
          Console <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1E40AF] to-[#2DD4BF]">Overview</span>
        </h1>
        <p className="text-[#64748B] mt-4 font-bold uppercase text-[9px] tracking-[0.2em]">Real-time project tracking & sync console</p>
      </div>
    </header>
    
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Milestones Reached</p>
        <p className="text-3xl font-black font-mono tracking-tighter text-gray-900">24</p>
      </div>
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Active Trackers</p>
        <p className="text-3xl font-black font-mono tracking-tighter text-[#1E40AF]">12</p>
      </div>
      <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-xl shadow-gray-200/50">
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Sync Reliability</p>
        <p className="text-3xl font-black tracking-tighter text-[#2DD4BF]">99%</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-900 flex items-center gap-3">
          <div className="w-1.5 h-1.5 bg-[#1E40AF] rounded-full" />
          Direct Controls
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <button className="p-6 bg-white border border-gray-100 rounded-[28px] text-left hover:border-gray-900 transition-all group shadow-sm hover:shadow-xl hover:shadow-gray-200">
            <p className="font-bold uppercase text-xs tracking-widest group-hover:text-gray-900 transition-colors">Start New Tracker</p>
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tight">Deploy a new project sync channel.</p>
          </button>
          <button className="p-6 bg-white border border-gray-100 rounded-[28px] text-left hover:border-gray-900 transition-all group shadow-sm hover:shadow-xl hover:shadow-gray-200">
            <p className="font-bold uppercase text-xs tracking-widest group-hover:text-gray-900 transition-colors">AI Sync Core</p>
            <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-tight">Sync project progress from log bursts.</p>
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default Dashboard;
