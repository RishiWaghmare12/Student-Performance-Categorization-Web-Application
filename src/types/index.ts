export interface Student {
  id: string;
  name: string;
  prn: string;
  course: string;
  semester: number;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  enrollmentDate: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: number;
  department: string;
  teacherId: string;
  maxMarks: {
    ia: number;
    ca: number;
    mse: number;
    ese: number;
  };
}

export interface Mark {
  id: string;
  studentId: string;
  subjectCode: string;
  academicYear: string;
  semester: number;
  ia: number;
  ca: number;
  mse: number;
  ese: number;
  total: number;
  grade: string;
  status: 'pass' | 'fail';
  remarks?: string;
  updatedAt: string;
  updatedBy: string;
}

export interface User {
  id: string;
  email: string;
  role: 'teacher' | 'admin';
  name: string;
  department?: string;
  designation?: string;
  phone?: string;
  profileImage?: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  session: any;
}

export interface AnalyticsResult {
  totalStudents: number;
  passRate: number;
  averageScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
  detailedMarks: (Mark & {
    students: {
      name: string;
      prn: string;
    };
  })[];
}

export interface TeacherSubject {
  teacherId: string;
  subjectCode: string;
  academicYear: string;
  semester: number;
  assignedDate: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  description?: string;
}