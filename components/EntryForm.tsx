import React, { useState, useEffect, useMemo } from 'react';
import { MonthlyRecord, FinancialItem, CategoryType, SubItem } from '../types';
import { recalculateItem, sumValues, formatCurrency } from '../utils/calculations';
import { SUPPORTED_CURRENCIES } from '../constants';
import { Plus, Trash2, Save, ChevronDown, ChevronRight, Calculator, Coins, Check, X, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

interface EntryFormProps {
  initialData: MonthlyRecord;
  existingRecords: MonthlyRecord[];
  onSave: (data: MonthlyRecord) => void;
  onCancel: () => void;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Single Row Component for cleaner code
const FinancialItemCard = ({ 
  item, 
  onUpdate, 
  onDelete, 
  category 
}: { 
  item: FinancialItem, 
  onUpdate: (updated: FinancialItem) => void, 
  onDelete: (id: string) => void,
  category: CategoryType
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Ensure defaults exist for legacy data compatibility
  const currency = item.currency || 'INR';
  const exchangeRate = item.exchangeRate || 1;
  const subItems = item.subItems || [];
  const hasSubItems = subItems.length > 0;

  const handleFieldChange = (field: keyof FinancialItem, val: any) => {
    const newItem = { ...item, [field]: val };
    onUpdate(recalculateItem(newItem));
  };

  const handleSubItemAdd = () => {
    const newSub: SubItem = {
      id: `sub-${Date.now()}`,
      name: 'New Item',
      value: 0
    };
    const newSubs = [...subItems, newSub];
    handleFieldChange('subItems', newSubs);
  };

  const handleSubItemUpdate = (subId: string, field: keyof SubItem, val: any) => {
    const newSubs = subItems.map(s => s.id === subId ? { ...s, [field]: val } : s);
    handleFieldChange('subItems', newSubs);
  };

  const handleSubItemDelete = (subId: string) => {
    const newSubs = subItems.filter(s => s.id !== subId);
    handleFieldChange('subItems', newSubs);
  };

  const currentSymbol = SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || '';

  // Auto-reset confirmation if item changes or collapses
  useEffect(() => {
    if (!expanded) setShowDeleteConfirm(false);
  }, [expanded]);

  return (
    <div className={`bg-card border ${expanded ? 'border-primary ring-1 ring-primary/20' : 'border-border'} rounded-lg transition-all duration-200 shadow-sm overflow-hidden`}>
      {/* Header Summary Row */}
      <div className="flex items-center justify-between bg-card hover:bg-muted/30 transition-colors min-h-[60px]">
        
        {/* Clickable Area for Expansion */}
        <div 
          className="flex-1 p-4 flex items-center gap-3 cursor-pointer select-none" 
          onClick={(e) => {
             // Only toggle if we are not interacting with inputs/buttons
             if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
                e.preventDefault();
                setExpanded(!expanded);
             }
          }}
        >
           <button type="button" className="text-muted-foreground hover:text-foreground">
             {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
           </button>
           <div className="flex flex-col">
             <span className="font-medium text-sm">{item.name}</span>
             {currency !== 'INR' && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                   <Coins className="w-3 h-3" /> 
                   {formatCurrency(item.originalValue, currency)} ({exchangeRate}x)
                </span>
             )}
           </div>
        </div>
        
        {/* Actions Area */}
        <div className="flex items-center gap-3 pr-4 shrink-0 z-10 pointer-events-auto">
          <div className="text-right hidden sm:block">
             <div className="font-bold text-sm">{formatCurrency(item.value, 'INR')}</div>
          </div>
          
          {showDeleteConfirm ? (
             <div className="flex items-center bg-destructive/10 rounded-full p-1 animate-in fade-in duration-200">
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                  }}
                  className="p-1.5 rounded-full bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity mr-1"
                  title="Confirm Delete"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(false);
                  }}
                  className="p-1.5 rounded-full hover:bg-black/10 text-muted-foreground transition-colors"
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </button>
             </div>
          ) : (
             <button 
              type="button" 
              onClick={(e) => {
                 e.stopPropagation();
                 setShowDeleteConfirm(true);
              }}
              className="text-muted-foreground hover:text-destructive p-2 hover:bg-destructive/10 rounded-full transition-colors"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="p-4 pt-0 border-t border-dashed border-border mt-0 bg-muted/10 animate-in slide-in-from-top-2 duration-200">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
             {/* Name Input */}
             <div className="space-y-1">
               <label className="text-xs font-medium text-muted-foreground">Entry Name</label>
               <input 
                 type="text" 
                 value={item.name} 
                 onChange={(e) => handleFieldChange('name', e.target.value)}
                 className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
               />
             </div>

             {/* Currency & Rate */}
             <div className="flex gap-2">
                <div className="w-1/2 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Currency</label>
                  <select 
                    value={currency} 
                    onChange={(e) => handleFieldChange('currency', e.target.value)}
                    className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                  </select>
                </div>
                {currency !== 'INR' && (
                  <div className="w-1/2 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Rate (to INR)</label>
                    <input 
                      type="number" 
                      value={exchangeRate} 
                      onChange={(e) => handleFieldChange('exchangeRate', parseFloat(e.target.value) || 1)}
                      className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                    />
                  </div>
                )}
             </div>

             {/* Values */}
             <div className="space-y-1">
               <label className="text-xs font-medium text-muted-foreground">
                 Current Value ({currency})
                 {hasSubItems && <span className="text-[10px] ml-2 text-primary">(Auto-calculated from sub-items)</span>}
               </label>
               <input 
                 type="number" 
                 value={item.originalValue} 
                 disabled={hasSubItems} // Disable if driven by sub-items
                 onChange={(e) => handleFieldChange('originalValue', parseFloat(e.target.value) || 0)}
                 className={`w-full border border-input rounded px-2 py-1.5 text-sm outline-none ${hasSubItems ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-background focus:border-primary'}`}
               />
             </div>

             {category === 'investments' && (
               <div className="space-y-1">
                 <label className="text-xs font-medium text-muted-foreground">Invested Amount ({currency})</label>
                 <input 
                   type="number" 
                   value={item.originalInvestedValue || 0} 
                   onChange={(e) => handleFieldChange('originalInvestedValue', parseFloat(e.target.value) || 0)}
                   className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                 />
               </div>
             )}

             {/* Comment */}
             <div className="md:col-span-2 space-y-1">
               <label className="text-xs font-medium text-muted-foreground">Comments / Notes</label>
               <input 
                  type="text" 
                  value={item.comment || ''} 
                  onChange={(e) => handleFieldChange('comment', e.target.value)}
                  placeholder="Details about this asset..."
                  className="w-full bg-background border border-input rounded px-2 py-1.5 text-sm focus:border-primary outline-none"
                />
             </div>
          </div>

          {/* Sub Items Section */}
          <div className="mt-2 bg-background border border-border rounded-md p-3">
             <div className="flex justify-between items-center mb-2">
               <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sub-Entries</h4>
               <button onClick={handleSubItemAdd} className="text-xs flex items-center text-primary hover:underline" type="button">
                 <Plus className="w-3 h-3 mr-1" /> Add
               </button>
             </div>
             
             {subItems.length === 0 && <div className="text-xs text-muted-foreground italic py-1">No sub-entries. Main value is used directly.</div>}
             
             <div className="space-y-2">
               {subItems.map(sub => (
                 <div key={sub.id} className="flex gap-2 items-center">
                    <input 
                      className="flex-1 bg-muted/30 border border-input rounded px-2 py-1 text-xs focus:border-primary outline-none"
                      value={sub.name}
                      onChange={(e) => handleSubItemUpdate(sub.id, 'name', e.target.value)}
                      placeholder="Item Name"
                    />
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1 text-xs text-muted-foreground">{currentSymbol}</span>
                      <input 
                        className="w-full bg-muted/30 border border-input rounded pl-6 pr-2 py-1 text-xs text-right focus:border-primary outline-none"
                        type="number"
                        value={sub.value}
                        onChange={(e) => handleSubItemUpdate(sub.id, 'value', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button type="button" onClick={() => handleSubItemDelete(sub.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                 </div>
               ))}
             </div>
          </div>

        </div>
      )}
    </div>
  );
};

const EntryForm: React.FC<EntryFormProps> = ({ initialData, existingRecords, onSave, onCancel }) => {
  const [formData, setFormData] = useState<MonthlyRecord>(initialData);
  const [activeTab, setActiveTab] = useState<CategoryType>('banks');
  
  // Date State
  const [selectedMonth, setSelectedMonth] = useState(initialData.monthLabel.split(' ')[0] || "Jan");
  const [selectedYear, setSelectedYear] = useState(initialData.year);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialData);
    const parts = initialData.monthLabel.split(' ');
    setSelectedMonth(parts[0] || "Jan");
    setSelectedYear(initialData.year);
  }, [initialData]);

  // Handle Date Change Logic
  useEffect(() => {
    // Reconstruct label: "Jan" + "24" (from 2024)
    const shortYear = selectedYear.toString().slice(-2);
    const newMonthLabel = `${selectedMonth} ${shortYear}`;
    
    // Check for duplicates
    const isDuplicate = existingRecords.some(r => r.id !== formData.id && r.monthLabel === newMonthLabel);
    
    if (isDuplicate) {
       setDateError(`"${newMonthLabel}" already exists.`);
    } else {
       setDateError(null);
       const monthIndex = MONTHS.indexOf(selectedMonth);
       // Set timestamp to 1st of the month
       const newTimestamp = new Date(selectedYear, monthIndex, 1).getTime();
       
       setFormData(prev => ({
         ...prev,
         monthLabel: newMonthLabel,
         year: selectedYear,
         timestamp: newTimestamp
       }));
    }
  }, [selectedMonth, selectedYear, existingRecords, formData.id]);

  const updateItem = (category: CategoryType, updatedItem: FinancialItem) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].map(item => item.id === updatedItem.id ? updatedItem : item)
    }));
  };

  const addItem = (category: CategoryType) => {
    const newItem: FinancialItem = {
      id: `${category}-custom-${Date.now()}`,
      name: 'New Entry',
      value: 0,
      currency: 'INR',
      exchangeRate: 1,
      originalValue: 0,
      subItems: [],
      isCustom: true
    };
    setFormData(prev => ({
      ...prev,
      [category]: [...prev[category], newItem]
    }));
  };

  const deleteItem = (category: CategoryType, id: string) => {
    setFormData(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const categoryTotal = useMemo(() => {
    return sumValues(formData[activeTab]);
  }, [formData, activeTab]);

  const tabs: { id: CategoryType; label: string }[] = [
    { id: 'banks', label: 'Bank Accounts' },
    { id: 'investments', label: 'Investments' },
    { id: 'deductions', label: 'Deductions' },
    { id: 'others', label: 'Other Assets' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl shadow-lg overflow-hidden flex flex-col h-full animate-in fade-in zoom-in-95 duration-300">
      {/* Header */}
      <div className="p-4 border-b border-border bg-muted/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
             <div className="bg-primary/10 p-2 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
             </div>
             <div>
                <h2 className="text-lg font-bold">Edit Record</h2>
                
                {/* Editable Date Fields */}
                <div className="flex items-center gap-2 mt-1">
                   <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-background border border-border rounded px-2 py-0.5 text-xs font-medium focus:border-primary outline-none cursor-pointer"
                   >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                   </select>
                   <input 
                      type="number" 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="bg-background border border-border rounded px-2 py-0.5 text-xs font-medium w-16 focus:border-primary outline-none"
                   />
                   {dateError && (
                      <span className="text-xs text-destructive flex items-center animate-in fade-in">
                         <AlertCircle className="w-3 h-3 mr-1" />
                         {dateError}
                      </span>
                   )}
                </div>
             </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
             <button onClick={onCancel} className="flex-1 md:flex-none px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              Cancel
            </button>
            <button 
               onClick={() => !dateError && onSave(formData)} 
               disabled={!!dateError}
               className="flex-1 md:flex-none flex items-center justify-center px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border bg-muted/40 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[120px] py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.id 
                ? 'border-primary text-primary bg-background' 
                : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="p-4 overflow-y-auto flex-1 bg-muted/5">
        <div className="space-y-3 pb-20">
          {formData[activeTab].length === 0 && (
             <div className="text-center py-10 text-muted-foreground">
               <div className="mb-2">No entries in this section.</div>
               <button onClick={() => addItem(activeTab)} className="text-primary hover:underline text-sm">Add your first entry</button>
             </div>
          )}

          {formData[activeTab].map((item) => (
            <FinancialItemCard 
              key={item.id} 
              item={item} 
              category={activeTab}
              onUpdate={(updated) => updateItem(activeTab, updated)}
              onDelete={(id) => deleteItem(activeTab, id)}
            />
          ))}

          <button 
            onClick={() => addItem(activeTab)} 
            className="w-full py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center group"
          >
            <Plus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            Add New {tabs.find(t => t.id === activeTab)?.label} Entry
          </button>
        </div>
      </div>

      {/* Sticky Footer Total */}
      <div className="p-4 bg-card border-t border-border flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section Total</span>
          <span className="text-xs text-muted-foreground">in Indian Rupees (₹)</span>
        </div>
        <div className="text-2xl font-bold font-mono tracking-tight text-primary">
          {formatCurrency(categoryTotal)}
        </div>
      </div>
    </div>
  );
};

export default EntryForm;