/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LandingPage from "./components/LandingPage";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import InvoiceList from "./components/InvoiceList";
import InvoiceDetail from "./components/InvoiceDetail";
import InvoiceForm from "./components/InvoiceForm";
import TimelinePage from "./components/TimelinePage";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { User } from "@supabase/supabase-js";

const TimelinePageWithView = () => <TimelinePage isPublicView={true} />;

export default function App() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        // ALWAYS check local storage first for bypass/demo mode
        const localUser = localStorage.getItem("ais_demo_user");
        if (localUser) {
          setSession(JSON.parse(localUser));
          setLoading(false);
          return; // Skip Supabase check if we have a local bypass user
        }

        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          setSession(session?.user ?? null);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    let subscription: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // Only update if we don't have a local demo user active
        if (!localStorage.getItem("ais_demo_user")) {
          setSession(session?.user ?? null);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <motion.img 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          src="https://twuzynjcjourdhgscopt.supabase.co/storage/v1/object/public/asset/logo%20done.png" 
          alt="Logo" 
          className="h-10 w-auto mb-8 opacity-20" 
        />
        <div className="w-5 h-5 border-2 border-gray-100 border-t-[#1E40AF] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
          <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <Register />} />
          <Route path="/t/:timelineId" element={<TimelinePage isPublicView={true} />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={session ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/invoices" element={session ? <InvoiceList /> : <Navigate to="/login" />} />
          <Route path="/invoices/:id" element={session ? <InvoiceDetail /> : <Navigate to="/login" />} />
          <Route path="/invoices/:id/timeline" element={session ? <TimelinePage /> : <Navigate to="/login" />} />
          <Route path="/create" element={session ? <InvoiceForm /> : <Navigate to="/login" />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
