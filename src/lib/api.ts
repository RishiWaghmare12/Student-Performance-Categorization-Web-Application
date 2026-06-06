import { supabase } from './supabase';
import { Student, Subject, Mark } from '../types';

// Students API
export const getStudents = async () => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Get students error:', error);
    throw new Error(error.message || 'Failed to fetch students');
  }
};

export const addStudent = async (student: Omit<Student, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Add student error:', error);
    throw new Error(error.message || 'Failed to add student');
  }
};

export const updateStudent = async (id: string, updates: Partial<Student>) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Update student error:', error);
    throw new Error(error.message || 'Failed to update student');
  }
};

export const deleteStudent = async (id: string) => {
  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error: any) {
    console.error('Delete student error:', error);
    throw new Error(error.message || 'Failed to delete student');
  }
};

// Subjects API
export const getSubjects = async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Get subjects error:', error);
    throw new Error(error.message || 'Failed to fetch subjects');
  }
};

export const addSubject = async (subject: Omit<Subject, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .insert([subject])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Add subject error:', error);
    throw new Error(error.message || 'Failed to add subject');
  }
};

export const updateSubject = async (id: string, updates: Partial<Subject>) => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Update subject error:', error);
    throw new Error(error.message || 'Failed to update subject');
  }
};

export const deleteSubject = async (id: string) => {
  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (error: any) {
    console.error('Delete subject error:', error);
    throw new Error(error.message || 'Failed to delete subject');
  }
};

// Marks API
export const getStudentMarks = async (studentId: string) => {
  try {
    const { data, error } = await supabase
      .from('marks')
      .select(`
        *,
        subjects (
          name,
          code
        )
      `)
      .eq('studentId', studentId);
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Get student marks error:', error);
    throw new Error(error.message || 'Failed to fetch student marks');
  }
};

export const addMark = async (mark: Omit<Mark, 'id'>) => {
  try {
    const { data, error } = await supabase
      .from('marks')
      .insert([mark])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Add mark error:', error);
    throw new Error(error.message || 'Failed to add mark');
  }
};

export const updateMark = async (id: string, updates: Partial<Mark>) => {
  try {
    const { data, error } = await supabase
      .from('marks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Update mark error:', error);
    throw new Error(error.message || 'Failed to update mark');
  }
};

// Analytics
export const getPerformanceAnalytics = async (subjectCode: string) => {
  try {
    const { data, error } = await supabase
      .from('marks')
      .select(`
        *,
        students (
          name,
          prn
        )
      `)
      .eq('subjectCode', subjectCode);
    
    if (error) throw error;
    
    // Calculate analytics
    const totalStudents = data.length;
    const passedStudents = data.filter(mark => mark.status === 'pass').length;
    const averageScore = data.reduce((acc, mark) => acc + mark.total, 0) / totalStudents;
    
    return {
      totalStudents,
      passRate: (passedStudents / totalStudents) * 100,
      averageScore,
      distribution: {
        excellent: data.filter(mark => mark.total >= 90).length,
        good: data.filter(mark => mark.total >= 75 && mark.total < 90).length,
        average: data.filter(mark => mark.total >= 60 && mark.total < 75).length,
        poor: data.filter(mark => mark.total < 60).length,
      },
      detailedMarks: data,
    };
  } catch (error: any) {
    console.error('Get analytics error:', error);
    throw new Error(error.message || 'Failed to fetch analytics');
  }
};