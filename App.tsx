import React, { useState, useEffect, useRef } from 'react';
import { MonthlyRecord, User, CloudConfig } from './types';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import AuthPage from './components/AuthPage';
import SettingsModal from './components/SettingsModal';
import { parseExcel, exportExcel } from './utils/excelHelper';
import { getCurrentUser, logout as performLogout } from './utils/auth';
import { saveToCloud, loadFromCloud } from './utils/cloud';
import { 
  LayoutDashboard, FileSpreadsheet, PlusCircle, Upload, Download, 
  Menu, X, Calendar, ChevronRight, Moon, Sun, Wallet, LogOut, Trash2, Check, AlertTriangle, Settings, CloudLightning
} from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<MonthlyRecord[]>([]);
  const [view, setView] = useState<'dashboard' | 'entry'>('dashboard');
  const [editingMonthId, setEditingMonthId] = useState<string | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<MonthlyRecord[] | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>({ 
    enabled: false, 
    supabaseUrl: '', 
    supabaseKey: '' 
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Auth & Settings
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      
      // Load cloud config from local storage for this user
      const savedConfig = localStorage.getItem(`financial_tracker_cloud_${currentUser.id}`);
      if (savedConfig) {
        setCloudConfig(JSON.parse(savedConfig));
      }
    }
  }, []);

  // Load Data: Local -> Then Cloud (if enabled)
  useEffect(() => {
    if (user) {
      // 1. Load Local
      const storageKey = `financial_tracker_data_${user.id}`;
      const localData = localStorage.getItem(storageKey);
      
      if (localData) {
        try {
          setData(JSON.parse(localData));
        } catch (e) {
          console.error("Failed to load local data", e);
        }
      }

      // 2. Load Cloud (if config exists)
      if (cloudConfig.enabled && cloudConfig.supabaseUrl && cloudConfig.supabaseKey) {
        setIsSyncing(true);
        loadFromCloud(cloudConfig, user.username).then(result => {
          if (result.success && result.data && result.data.length > 0) {
            // Check if cloud data is different/newer? 
            // For simplicity in this v1, we assume Cloud is source of truth if enabled,
            // OR we merge. Here we overwrite local if cloud exists, 
            // but in a real app you'd compare timestamps.
            // Let's only overwrite if local is empty OR user explicitly enabled cloud
            setData(result.data);
            console.log("Synced from cloud");
          }
          setIsSyncing(false);
        });
      }
    }
  }, [user, cloudConfig.enabled]); // Re-run if user logs in or enables cloud

  // Save Data: Local (Instant) -> Cloud (Debounced)
  useEffect(() => {
    if (user) {
      // Local Save
      const storageKey = `financial_tracker_data_${user.id}`;
      localStorage.setItem(storageKey, JSON.stringify(data));

      // Cloud Save (Debounced 2s)
      if (cloudConfig.enabled && cloudConfig.supabaseUrl && data.length > 0) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        setIsSyncing(true);
        saveTimeoutRef.current = setTimeout(async () => {
          await saveToCloud(cloudConfig, user.username, data);
          setIsSyncing(false);
        }, 2000);
      }
    }
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [data, user, cloudConfig]);

  // Handle Cloud Config Save
  const handleSaveSettings = (newConfig: CloudConfig) => {
    setCloudConfig(newConfig);
    setShowSettings(false);
    if (user) {
      localStorage.setItem(`financial_tracker_cloud_${user.id}`, JSON.stringify(newConfig));
    }
  };

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleLogout = () => {
    performLogout();
    setUser(null);
    setData([]);
    setView('dashboard');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const records = await parseExcel(e.target.files[0]);
        // Instead of window.confirm, set state to show custom modal
        setPendingImport(records);
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure it matches the template and contains data in the correct rows.");
        console.error(err);
      }
    }
    // Clear input to allow re-uploading same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmImport = () => {
    if (pendingImport) {
      setData(pendingImport);
      setPendingImport(null);
      setView('dashboard');
      setIsSidebarOpen(false);
    }
  };

  const handleCreateMonth = () => {
    let targetDate = new Date();
    targetDate.setDate(1); // Set to 1st to avoid month overflow issues (e.g. Jan 31 -> Feb 28)

    // If data exists, find the latest month chronologically and add 1 month
    if (data.length > 0) {
      let maxDate = new Date(0);
      let found = false;

      data.forEach(record => {
        // Attempt to parse standard "MMM YY" format (e.g. "Dec 25")
        const parts = record.monthLabel.split(' ');
        if (parts.length === 2) {
          const d = new Date(`${parts[0]} 1, 20${parts[1]}`);
          if (!isNaN(d.getTime())) {
            if (d > maxDate) maxDate = d;
            found = true;
          }
        }
      });

      if (found) {
        targetDate = new Date(maxDate);
        targetDate.setMonth(targetDate.getMonth() + 1);
      }
    }
    
    // Use en-US to ensure "MMM YY" format (e.g. "Jan 25") consistent with parsing logic
    const monthLabel = targetDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const year = targetDate.getFullYear();
    
    // Initial duplication check (can be fixed in Edit mode, but good for UX to warn)
    if (data.find(d => d.monthLabel === monthLabel)) {
      alert(`The month ${monthLabel} already exists! Please edit the existing record or delete it.`);
      return;
    }

    // Initialize with empty arrays for a blank slate experience
    const newRecord: MonthlyRecord = {
      id: `manual-${Date.now()}`,
      monthLabel,
      year: year,
      banks: [],
      investments: [],
      deductions: [],
      others: [],
      timestamp: targetDate.getTime()
    };
    
    setData(prev => [...prev, newRecord]);
    setEditingMonthId(newRecord.id);
    setView('entry');
    setDeleteConfirmationId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmationId(id);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setData(prev => prev.filter(r => r.id !== id));
    if (editingMonthId === id) {
      setView('dashboard');
      setEditingMonthId(null);
    }
    setDeleteConfirmationId(null);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmationId(null);
  };

  const handleSaveEntry = (updatedRecord: MonthlyRecord) => {
    setData(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
    setView('dashboard');
    setEditingMonthId(null);
  };

  const handleEditMonth = (id: string) => {
    setDeleteConfirmationId(null);
    setEditingMonthId(id);
    setView('entry');
    setIsSidebarOpen(false); // Mobile UX
  };

  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans relative">
      
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        config={cloudConfig}
        onSave={handleSaveSettings}
      />

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Import Confirmation Modal */}
      {pendingImport && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-amber-500/10 p-2 rounded-full text-amber-500 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Confirm Import</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You are about to import <span className="font-semibold text-foreground">{pendingImport.length} records</span>.
                </p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6 pl-12">
              <span className="text-destructive font-semibold">Warning:</span> This action will <span className="underline">completely replace</span> your existing data with the data from the uploaded file. This cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPendingImport(null)}
                className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors border border-border"
              >
                Cancel
              </button>
              <button 
                onClick={confirmImport}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-sm"
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-2 mb-8">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinCompass</h1>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            <button 
              onClick={() => { setView('dashboard'); setIsSidebarOpen(false); }}
              className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                view === 'dashboard' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </button>

            <div className="pt-4 pb-2">
              <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">History</p>
              {sortedData.length === 0 && (
                <div className="px-4 text-sm text-muted-foreground italic">No entries yet.</div>
              )}
              {sortedData.map(record => (
                <div key={record.id} className="group relative">
                  <button
                    onClick={() => handleEditMonth(record.id)}
                    className="w-full flex items-center justify-between px-4 py-2 rounded-lg text-sm transition-colors text-muted-foreground hover:bg-muted hover:text-foreground pr-8"
                  >
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-3 opacity-70" />
                      {record.monthLabel}
                    </div>
                  </button>
                  
                  {deleteConfirmationId === record.id ? (
                     <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 animate-in fade-in zoom-in-95 duration-200">
                        <button 
                           onClick={(e) => handleConfirmDelete(e, record.id)}
                           className="p-1 rounded bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shadow-sm"
                           title="Confirm Delete"
                        >
                           <Check className="w-3 h-3" />
                        </button>
                        <button 
                           onClick={handleCancelDelete}
                           className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted-foreground/80 transition-colors shadow-sm"
                           title="Cancel"
                        >
                           <X className="w-3 h-3" />
                        </button>
                     </div>
                  ) : (
                     <button 
                        onClick={(e) => handleDeleteClick(e, record.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                  )}
                </div>
              ))}
            </div>
          </nav>

          <div className="pt-4 border-t border-border space-y-2">
             <button 
              onClick={handleCreateMonth}
              className="w-full flex items-center px-4 py-2 text-sm font-medium text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-3" />
              New Month
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <Upload className="w-3 h-3 mr-2" />
                Import
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx" className="hidden" />

              <button 
                onClick={() => exportExcel(sortedData)}
                disabled={sortedData.length === 0}
                className="flex items-center justify-center px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              >
                <Download className="w-3 h-3 mr-2" />
                Export
              </button>
            </div>
             
             {/* Settings Button */}
             <button 
               onClick={() => setShowSettings(true)}
               className="w-full flex items-center justify-center px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-muted transition-colors mt-2"
             >
               <Settings className="w-3 h-3 mr-2" />
               Cloud Settings
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex-1 lg:flex-none flex items-center">
             {isSyncing && (
                <div className="flex items-center text-xs text-primary animate-pulse">
                   <CloudLightning className="w-4 h-4 mr-1" />
                   Syncing...
                </div>
             )}
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-3 border-l border-border pl-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-medium">{user.username}</span>
                <span className="text-[10px] text-muted-foreground">Free Plan</span>
              </div>
              <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-xs text-white font-bold uppercase">
                {user.username.substring(0, 2)}
              </div>
              <button 
                onClick={handleLogout}
                className="ml-2 p-2 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-4 lg:p-8">
          {view === 'dashboard' && (
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold tracking-tight">Financial Overview</h2>
                <p className="text-muted-foreground mt-1">Track your