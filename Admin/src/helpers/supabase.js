import { createClient } from '@supabase/supabase-js';

// Supabase projenizden alacağınız bilgiler
// Settings -> API -> Project URL ve anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth helper fonksiyonları
export const authHelpers = {
  // Kayıt olma
  signUp: async (email, password, fullName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });
    return { data, error };
  },

  // Giriş yapma
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Çıkış yapma
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Mevcut kullanıcıyı al
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Şifre sıfırlama
  resetPassword: async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    return { data, error };
  },

  // Şifre güncelleme
  updatePassword: async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },

  // Auth state değişikliklerini dinle
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
