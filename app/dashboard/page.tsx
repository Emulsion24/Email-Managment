'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, Mail, LogOut, ChevronLeft, ChevronRight, 
  Loader2, Plus, X, Users, ShieldCheck, AlertCircle 
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface UserRecord {
  id: number;
  name?: string;
  email?: string;
  recipient_name?: string;
  recipient_email?: string;
  template_name?: string;
  sent_at?: string;
  role?: string;
  is_bulk?: boolean;
}

type TabType = 'user' | 'installer' | 'history';

export default function Dashboard() {
  const router = useRouter();
  
  // Auth & UI States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [profiles, setProfiles] = useState<UserRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Form States
  const templates = ["User Welcome Email", "Installer Welcome Email"];
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    template: 'User Welcome Email', 
    role: 'user' 
  });
  
  // Bulk States
  const [bulkEmails, setBulkEmails] = useState<string[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [bulkTemplate, setBulkTemplate] = useState('User Welcome Email');
  const [bulkRole, setBulkRole] = useState('user');
  const [isBulkSending, setIsBulkSending] = useState(false);
  const [loading, setLoading] = useState(false); 

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'user' | 'installer' | 'bulk'>('all');

  // --- 1. AUTHENTICATION & LOGOUT ---
const logout = async () => {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    toast.success("Logged out successfully");
    window.location.href = '/';
  } catch (err) {
    console.error("Logout failed", err);
  }
};

  // --- 2. DATA SYNC (WITH AUTH CHECK) ---
  const fetchData = async () => {
    setIsFetching(true);
    try {
      const params = new URLSearchParams({
        type: activeTab,
        search: searchTerm,
        page: currentPage.toString(),
        roleFilter: historyFilter
      });
      
      const res = await fetch(`/api/get-data?${params.toString()}`);

      if (res.status === 401 || res.status === 403) {
        toast.error("Session expired. Please log in again.");
        logout();
        return;
      }

      const result = await res.json();
      setProfiles(result.items || []);
      setTotalPages(result.meta?.totalPages || 1);
      setIsAuthorized(true);
    } catch (err) {
      toast.error("Connection error. Check your internet.");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchTerm, currentPage, historyFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, historyFilter]);

  // --- 3. EMAIL ACTIONS ---
  const handleSend = async () => {
    if (!formData.email) return toast.error("Please select a recipient first");
    
    const loadingToast = toast.loading("Dispatching email...");
    setLoading(true);
    
    try {
      const res = await fetch('/api/send-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          name: formData.name, 
          templateName: formData.template,
          role: formData.role,
          isBulk: false
        }),
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        return;
      }

      if (res.ok) {
        toast.success(`Email sent successfully`, { id: loadingToast });
        if (activeTab === 'history') fetchData();
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Failed to send email.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const addBulkEmail = (email: string) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) return;
    if (bulkEmails.includes(trimmedEmail)) return toast.error("Already in list");
    setBulkEmails([...bulkEmails, trimmedEmail]);
    setManualEmail('');
  };

  const removeBulkEmail = (email: string) => {
    setBulkEmails(bulkEmails.filter(e => e !== email));
  };

  const handleBulkSend = async () => {
    if (bulkEmails.length === 0) return toast.error("Add at least one email");
    setIsBulkSending(true);
    const bulkToast = toast.loading(`Sending ${bulkEmails.length} emails...`);

    try {
      for (const email of bulkEmails) {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: email, 
            name: "Bulk Recipient", 
            templateName: bulkTemplate,
            role: bulkRole,
            isBulk: true 
          }),
        });
        if (res.status === 401 || res.status === 403) { logout(); return; }
      }
      toast.success("Bulk dispatch completed", { id: bulkToast });
      setBulkEmails([]);
      if (activeTab === 'history') fetchData();
    } catch (error) {
      toast.error("Error during bulk send", { id: bulkToast });
    } finally {
      setIsBulkSending(false);
    }
  };

  // --- 4. RENDER LOGIC ---
  const SkeletonItem = () => (
    <div className="p-4 bg-white border border-slate-100 rounded-xl animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2 w-full">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-3 bg-slate-100 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );

  if (!isAuthorized && isFetching && currentPage === 1) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Verifying Admin Permissions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Toaster position="top-right" />
      
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
              <Mail className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 leading-none">Rezillion</h1>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Secure Dashboard
              </span>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="inline-flex p-1 bg-slate-200/50 rounded-xl backdrop-blur-sm border border-slate-200">
            {(['user', 'installer', 'history'] as TabType[]).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)} 
                className={`py-2 px-8 rounded-lg capitalize text-sm font-bold transition-all ${
                  activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${isFetching ? 'text-blue-500' : 'text-slate-400'}`} />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-white w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[580px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Sync</span>
                   {isFetching && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
                </div>
                {activeTab === 'history' && (
                  <select 
                    className="text-xs font-bold text-blue-600 outline-none bg-transparent"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value as any)}
                  >
                    <option value="all">All Logs</option>
                    <option value="user">Users</option>
                    <option value="installer">Installers</option>
                    <option value="bulk">Bulk</option>
                  </select>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isFetching && currentPage === 1 ? [...Array(5)].map((_, i) => <SkeletonItem key={i} />) : 
                profiles.length > 0 ? profiles.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      const email = item.email || item.recipient_email || '';
                      const role = item.role || (activeTab === 'installer' ? 'installer' : 'user');
                      setFormData({ 
                        ...formData, 
                        name: item.name || item.recipient_name || '', 
                        email, 
                        role,
                        template: role === 'installer' ? 'Installer Welcome Email' : 'User Welcome Email'
                      });
                      if(activeTab !== 'history') addBulkEmail(email); 
                      toast.success("Added to context", { duration: 800 });
                    }}
                    className="p-4 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name || item.recipient_name}</p>
                        <p className="text-xs text-slate-500">{item.email || item.recipient_email}</p>
                      </div>
                      {/* Added Role Tag for User/Installer Tabs */}
                      {activeTab !== 'history' && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                          {item.role}
                        </span>
                      )}
                    </div>
                    {/* Role is already here for history, maintained consistent style */}
                    {activeTab === 'history' && (
                      <div className="mt-2 flex items-center justify-between border-t border-slate-50 pt-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase italic">{item.template_name}</span>
                        <span className="text-[9px] text-slate-400 uppercase font-medium">{item.role} {item.is_bulk && '• BULK'}</span>
                      </div>
                    )}
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <AlertCircle className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No records found</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-xs font-medium text-slate-500">
                  Page <span className="text-slate-900 font-bold">{currentPage}</span> of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button 
                    disabled={currentPage === 1 || isFetching}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={currentPage >= totalPages || isFetching}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-2 rounded-lg border bg-white disabled:opacity-30 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" /> Direct Messaging
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Full Name</label>
                    <input className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email</label>
                    <input className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                    <option value="user">Assign Role: User</option>
                    <option value="installer">Assign Role: Installer</option>
                  </select>
                  <select className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none" value={formData.template} onChange={e => setFormData({...formData, template: e.target.value})}>
                    {templates.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button onClick={handleSend} disabled={loading || !formData.email} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:bg-slate-200 shadow-lg shadow-blue-100">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send Individual Email"}
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-900" /> Bulk Dispatch
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none" value={bulkRole} onChange={e => setBulkRole(e.target.value)}>
                    <option value="user">Targeting: Users</option>
                    <option value="installer">Targeting: Installers</option>
                  </select>
                  <select className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none" value={bulkTemplate} onChange={e => setBulkTemplate(e.target.value)}>
                    {templates.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                
                <div className="relative">
                  <input placeholder="Add email manually..." className="w-full pl-4 pr-12 py-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500/20" value={manualEmail} onChange={e => setManualEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && addBulkEmail(manualEmail)} />
                  <button onClick={() => addBulkEmail(manualEmail)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Plus /></button>
                </div>

                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-xl min-h-[100px] border border-dashed border-slate-200 max-h-40 overflow-y-auto">
                  {bulkEmails.length === 0 && <span className="text-sm text-slate-400 italic">No recipients. Select records on the left or type manually above.</span>}
                  {bulkEmails.map((email) => (
                    <span key={email} className="flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-bold shadow-sm">
                      {email}
                      <button onClick={() => removeBulkEmail(email)} className="hover:text-red-500 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>

                <button onClick={handleBulkSend} disabled={isBulkSending || bulkEmails.length === 0} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all disabled:bg-slate-200">
                  {isBulkSending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Dispatch to ${bulkEmails.length} recipients`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}