import { createClient } from '@supabase/supabase-js';
import { CloudConfig, MonthlyRecord } from '../types';

let supabaseInstance: any = null;

const getSupabase = (url: string, key: string) => {
  if (!supabaseInstance) {
    supabaseInstance = createClient(url, key);
  }
  // If credentials changed, recreate
  if (supabaseInstance.supabaseUrl !== url || supabaseInstance.supabaseKey !== key) {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
};

export const saveToCloud = async (config: CloudConfig, userId: string, data: MonthlyRecord[]) => {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseKey) return { success: false, error: 'Cloud not configured' };

  try {
    const supabase = getSupabase(config.supabaseUrl, config.supabaseKey);
    
    // Upsert data. We use the 'financial_records' table.
    // We store the whole array as a JSON blob for the specific user.
    const { error } = await supabase
      .from('financial_records')
      .upsert({ 
        user_id: userId, 
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    console.error("Cloud Save Error:", err);
    return { success: false, error: err.message };
  }
};

export const loadFromCloud = async (config: CloudConfig, userId: string) => {
  if (!config.enabled || !config.supabaseUrl || !config.supabaseKey) return { success: false, error: 'Cloud not configured' };

  try {
    const supabase = getSupabase(config.supabaseUrl, config.supabaseKey);

    const { data, error } = await supabase
      .from('financial_records')
      .select('data')
      .eq('user_id', userId)
      .single();

    if (error) {
      // PGRST116 is code for "The result contains 0 rows" (no data found for user), which is fine
      if (error.code === 'PGRST116') return { success: true, data: [] };
      throw error;
    }

    return { success: true, data: data?.data || [] };
  } catch (err: any) {
    console.error("Cloud Load Error:", err);
    return { success: false, error: err.message };
  }
};