import React, { useState } from 'react';
import { CloudConfig } from '../types';
import { X, Cloud, Save, AlertTriangle, CheckCircle, Database } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudConfig;
  onSave: (config: CloudConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [formData, setFormData] = useState<CloudConfig>(config);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof CloudConfig, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSave = () => {
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Cloud className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Cloud Synchronization</h2>
              <p className="text-sm text-muted-foreground">Sync your data across devices using Supabase (Free Database).</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
            <div className="space-y-0.5">
              <label className="text-base font-medium">Enable Cloud Sync</label>
              <p className="text-xs text-muted-foreground">Automatically backup your data to your database.</p>
            </div>
            <div className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={formData.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </div>
          </div>

          <div className={`space-y-4 transition-opacity ${!formData.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
             <div className="space-y-2">
                <label className="text-sm font-medium">Supabase Project URL</label>
                <input 
                  type="text" 
                  value={formData.supabaseUrl}
                  onChange={(e) => handleChange('supabaseUrl', e.target.value)}
                  placeholder="https://xyz.supabase.co"
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
             </div>
             
             <div className="space-y-2">
                <label className="text-sm font-medium">Supabase API Key (public/anon)</label>
                <input 
                  type="password" 
                  value={formData.supabaseKey}
                  onChange={(e) => handleChange('supabaseKey', e.target.value)}
                  placeholder="eyJh..."
                  className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:border-primary outline-none"
                />
             </div>
          </div>

          {/* Setup Guide */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-3">
             <div className="flex items-center gap-2 text-blue-500 font-semibold text-sm">
                <Database className="w-4 h-4" />
                <span>Database Setup Required</span>
             </div>
             <p className="text-xs text-muted-foreground leading-relaxed">
               To use this feature, create a free project at <a href="https://supabase.com" target="_blank" className="underline text-primary">supabase.com</a>.
               Go to the <strong>SQL Editor</strong> in your Supabase dashboard and run this command to create the required table:
             </p>
             <div className="bg-black/80 text-gray-300 p-3 rounded-md text-xs font-mono overflow-x-auto border border-white/10">
               <code>
                 create table financial_records (<br/>
                 &nbsp;&nbsp;user_id text primary key,<br/>
                 &nbsp;&nbsp;data jsonb,<br/>
                 &nbsp;&nbsp;updated_at timestamp with time zone default timezone('utc'::text, now())<br/>
                 );
               </code>
             </div>
             <p className="text-xs text-muted-foreground">
               This table maps your Username to your Data. Ensure your username in the app is unique!
             </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-muted/20 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground">
             Close
           </button>
           <button 
             onClick={handleSave}
             disabled={isSaved}
             className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 shadow-sm flex items-center"
           >
             {isSaved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
             {isSaved ? 'Saved!' : 'Save Settings'}
           </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;