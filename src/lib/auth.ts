import { supabase } from './supabase';
import { AuthState, User } from '../types';
import toast from 'react-hot-toast';

export const signUp = async (email: string, password: string, name: string, role: 'teacher' | 'admin') => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    });
    
    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // Create the user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role,
        }
      ])
      .select()
      .single();
    
    if (profileError) throw profileError;
    return { ...authData, profile };
  } catch (error: any) {
    console.error('Signup error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;

    // Fetch the user profile after successful sign in
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('User profile not found');

    return { ...data, profile };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any local storage or state
    localStorage.removeItem('supabase.auth.token');
    window.location.href = '/';
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getCurrentUser = async (): Promise<AuthState> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return { user: null, session: null };
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) throw profileError;
    if (!profile) throw new Error('User profile not found');

    return { user: profile, session };
  } catch (error: any) {
    console.error('Get current user error:', error);
    return { user: null, session: null };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;
    toast.success('User deleted successfully');
  } catch (error: any) {
    console.error('Delete user error:', error);
    throw new Error(error.message || 'Failed to delete user');
  }
};