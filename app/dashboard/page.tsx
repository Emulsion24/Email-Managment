'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
// Removed unused useRouter
import { 
  Search, Mail, LogOut, ChevronLeft, ChevronRight, 
  Loader2, Plus, X, Users, ShieldCheck, AlertCircle, 
  UserPlus, UploadCloud, FileSpreadsheet
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import Papa from 'papaparse'; 
import * as XLSX from 'xlsx'; 

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

interface BulkRecipient {
  email: string;
  name: string;
}

type TabType = 'user' | 'installer' | 'history';
type RoleType = 'user' | 'installer';

const TEMPLATE_OPTIONS: Record<RoleType, string[]> = {
  user: ["User Welcome Email", "User Project Reminder"],
  installer: ["Installer Welcome Email", "New Projects Coming"]
};

export default function Dashboard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Auth & UI States
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('user');
  const [profiles, setProfiles] = useState<UserRecord[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  
  // Bulk Form States
  const [bulkRole, setBulkRole] = useState<RoleType>('user');
  const [bulkTemplate, setBulkTemplate] = useState(TEMPLATE_OPTIONS['user'][0]);
  
  // Recipient Management States
  const [recipients, setRecipients] = useState<BulkRecipient[]>([]);
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  
  const [isBulkSending, setIsBulkSending] = useState(false);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'user' | 'installer' | 'bulk'>('all');

  useEffect(() => {
    setBulkTemplate(TEMPLATE_OPTIONS[bulkRole][0]);
  }, [bulkRole]);

  // --- 1. AUTHENTICATION & LOGOUT ---
  // Wrapped in useCallback to satisfy linter dependencies
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      toast.success("Logged out successfully");
      window.location.href = '/';
    } catch (err) {
      console.error("Logout failed", err);
    }
  }, []);

  // --- 2. DATA SYNC ---
  // Wrapped in useCallback so it can be added to useEffect dependency array
  const fetchData = useCallback(async () => {
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
      console.error(err); // Log error to fix unused var warning
      toast.error("Connection error. Check your internet.");
    } finally {
      setIsFetching(false);
    }
  }, [activeTab, searchTerm, currentPage, historyFilter, logout]);

  // Added fetchData to dependency array
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, historyFilter]);

  // --- 3. RECIPIENT MANAGEMENT ---
  const addRecipient = (email: string, name: string) => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim() || "Valued User";

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
        return toast.error("Invalid email address");
    }

    if (recipients.some(r => r.email === trimmedEmail)) {
        return toast.error("User already in list");
    }

    setRecipients(prev => [...prev, { email: trimmedEmail, name: trimmedName }]);
    
    if (manualEmail === email) {
        setManualEmail('');
        setManualName('');
    }
  };

  // --- 4. CSV/EXCEL PROCESSING ---
  // Changed type from any[] to unknown[] and cast properly
  const processImportedData = (data: unknown[]) => {
    const newRecipients: BulkRecipient[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    data.forEach((row) => {
      // Type Guard: Ensure row is an object
      if (typeof row !== 'object' || row === null) return;
      const record = row as Record<string, unknown>;

      // Normalize keys to lower case
      const keys = Object.keys(record).reduce((acc, key) => {
        acc[key.toLowerCase().trim()] = record[key];
        return acc;
      }, {} as Record<string, unknown>);

      // Extract values safely
      const email = keys['email'] || keys['e-mail'] || keys['email address'] || keys['mail'];
      const name = keys['name'] || keys['full name'] || keys['firstname'] || keys['user'] || 'Valued User';

      // Validate
      if (typeof email === 'string' && email.includes('@')) {
         const exists = recipients.some(r => r.email === email) || newRecipients.some(r => r.email === email);
         if (!exists) {
           newRecipients.push({ email: email.trim(), name: String(name).trim() });
         } else {
           duplicateCount++;
         }
      } else {
        invalidCount++;
      }
    });

    if (newRecipients.length > 0) {
      setRecipients(prev => [...prev, ...newRecipients]);
      toast.success(`Imported ${newRecipients.length} users!`);
    } else if (invalidCount > 0) {
      toast.error("No valid emails found in file.");
    }
    
    if (duplicateCount > 0) toast(`Skipped ${duplicateCount} duplicates`, { icon: 'ℹ️' });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();

    // Handle Excel
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0]; 
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          processImportedData(jsonData);
        } catch (error) {
          console.error(error); // Log error
          toast.error("Failed to parse Excel file");
        }
      };
      reader.readAsArrayBuffer(file);
    } 
    // Handle CSV
    else if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processImportedData(results.data),
        error: (error) => {
            console.error(error); // Log error
            toast.error("Failed to parse CSV file");
        }
      });
    } 
    else {
      toast.error("Unsupported file format. Use .csv or .xlsx");
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter(r => r.email !== email));
  };

  const clearAll = () => {
      setRecipients([]);
      toast.success("List cleared");
  }

  // --- 5. BULK SEND ACTION ---
  const handleBulkSend = async () => {
    if (recipients.length === 0) return toast.error("Add at least one recipient");
    
    setIsBulkSending(true);
    const bulkToast = toast.loading(`Dispatching to ${recipients.length} recipients...`);

    try {
      for (const recipient of recipients) {
        const res = await fetch('/api/send-mail', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: recipient.email, 
            name: recipient.name,
            templateName: bulkTemplate,
            role: bulkRole,
            isBulk: true 
          }),
        });
        if (res.status === 401 || res.status === 403) { logout(); return; }
      }
      
      toast.success("All emails dispatched successfully", { id: bulkToast });
      setRecipients([]); 
      if (activeTab === 'history') fetchData();
    } catch (error) {
      console.error(error); // Log error
      toast.error("Error during bulk dispatch", { id: bulkToast });
    } finally {
      setIsBulkSending(false);
    }
  };

  // --- UI RENDER ---
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
          {/* LEFT COLUMN: DATA LIST */}
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
                    onChange={(e) => setHistoryFilter(e.target.value as 'all' | 'user' | 'installer' | 'bulk')}
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
                      if(activeTab === 'history') return;
                      const email = item.email || item.recipient_email || '';
                      const name = item.name || item.recipient_name || '';
                      addRecipient(email, name);
                      toast.success("Added to recipients");
                    }}
                    className={`p-4 bg-white border border-slate-100 rounded-xl transition-all group ${activeTab !== 'history' ? 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/30' : ''}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name || item.recipient_name}</p>
                        <p className="text-xs text-slate-500">{item.email || item.recipient_email}</p>
                      </div>
                      {activeTab !== 'history' && (
                        <div className="flex flex-col items-end gap-1">
                             <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{item.role}</span>
                             <Plus className="w-4 h-4 text-blue-300 group-hover:text-blue-600" />
                        </div>
                      )}
                    </div>
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

          {/* RIGHT COLUMN: BULK DISPATCH ONLY */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Users className="w-6 h-6 text-blue-600" /> Bulk Dispatcher
                </h2>
                <div className="flex items-center gap-2">
                     <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                        {recipients.length} Selected
                     </span>
                     {recipients.length > 0 && (
                         <button onClick={clearAll} className="text-xs text-red-500 hover:underline font-medium">Clear All</button>
                     )}
                </div>
              </div>

              <div className="space-y-6 flex-1">
                {/* 1. Configuration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Assign Role</label>
                      <select 
                        className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        value={bulkRole} 
                        onChange={e => setBulkRole(e.target.value as RoleType)}
                      >
                        <option value="user">User</option>
                        <option value="installer">Installer</option>
                      </select>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Email Template</label>
                      <select 
                        className="w-full px-4 py-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        value={bulkTemplate} 
                        onChange={e => setBulkTemplate(e.target.value)}
                      >
                        {TEMPLATE_OPTIONS[bulkRole].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                  </div>
                </div>
                
                {/* 2. Manual Add */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Add Recipients
                      </label>
                      
                      {/* --- EXCEL/CSV INPUT BUTTON --- */}
                      <div>
                        <input 
                          type="file" 
                          accept=".csv, .xlsx, .xls"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <FileSpreadsheet className="w-3 h-3" /> Upload Excel/CSV
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                        <input 
                            placeholder="Recipient Name" 
                            className="flex-1 px-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" 
                            value={manualName} 
                            onChange={e => setManualName(e.target.value)} 
                        />
                        <input 
                            placeholder="recipient@email.com" 
                            className="flex-1 px-4 py-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500/20 text-sm" 
                            value={manualEmail} 
                            onChange={e => setManualEmail(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && addRecipient(manualEmail, manualName)} 
                        />
                        <button 
                            onClick={() => addRecipient(manualEmail, manualName)} 
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* 3. Recipient List */}
                <div className="flex-1 min-h-[200px] p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-300">
                  {recipients.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-10">
                        <UploadCloud className="w-12 h-12 opacity-20" />
                        <span className="text-sm italic">Recipients list is empty.</span>
                        <div className="text-xs opacity-60 flex flex-col items-center">
                          <span>Select from the left, add manually, or</span>
                          <span onClick={() => fileInputRef.current?.click()} className="text-blue-500 font-bold cursor-pointer hover:underline">upload a file</span>
                        </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                        {recipients.map((r) => (
                            <div key={r.email} className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-blue-300 transition-all">
                                <div className="flex flex-col leading-none">
                                    <span className="text-xs font-bold text-slate-700 max-w-[100px] truncate">{r.name}</span>
                                    <span className="text-[10px] text-slate-400 max-w-[120px] truncate">{r.email}</span>
                                </div>
                                <button onClick={() => removeRecipient(r.email)} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* 4. Action Button */}
                <button 
                    onClick={handleBulkSend} 
                    disabled={isBulkSending || recipients.length === 0} 
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition-all disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-slate-200"
                >
                  {isBulkSending ? (
                      <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Sending...
                      </div>
                  ) : (
                      `Dispatch Emails to ${recipients.length} Recipients`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}