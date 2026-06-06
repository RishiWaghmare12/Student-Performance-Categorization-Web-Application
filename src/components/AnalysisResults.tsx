import React, { useState } from 'react';
import {
  BarChart2,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface PerformanceData {
  subjectCode: string;
  subjectName: string;
  totalStudents: number;
  passRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  distribution: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

interface COData {
  subjectCode: string;
  coNumber: string;
  attainmentLevel: number;
  achievementPercentage: number;
  targetAchieved: boolean;
}

interface POData {
  programOutcome: string;
  attainmentLevel: number;
  contributingCOs: string[];
  strengthLevel: 'Strong' | 'Moderate' | 'Weak';
}

interface StudentData {
  prn: string;
  name: string;
  overallPerformance: number;
  strengthSubjects: string[];
  improvementAreas: string[];
  attendance: number;
}

interface AnalysisResultsProps {
  results: {
    performance: PerformanceData[];
    coAnalysis: COData[];
    poAnalysis: POData[];
    studentWiseAnalysis: StudentData[];
  };
}

const strengthColors: Record<string, string> = {
  Strong: 'bg-green-100 text-green-800',
  Moderate: 'bg-yellow-100 text-yellow-800',
  Weak: 'bg-red-100 text-red-800',
};

const AttainmentBar: React.FC<{ value: number; max?: number }> = ({ value, max = 3 }) => {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-700 w-10 text-right">
        {value.toFixed(2)}
      </span>
    </div>
  );
};

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results }) => {
  const [activeSection, setActiveSection] = useState<string>('performance');

  const sections = [
    { id: 'performance', label: 'Subject Performance', icon: BarChart2 },
    { id: 'co', label: 'CO Attainment', icon: Target },
    { id: 'po', label: 'PO Attainment', icon: TrendingUp },
    { id: 'students', label: 'Student-wise', icon: Users },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Section Tabs */}
      <div className="flex space-x-2 border-b border-gray-200">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeSection === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Subject Performance */}
      {activeSection === 'performance' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Subject-wise Performance</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {results.performance.map((sub) => (
              <div
                key={sub.subjectCode}
                className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{sub.subjectCode}</p>
                    <p className="text-sm text-gray-500">{sub.subjectName}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      sub.passRate >= 75
                        ? 'bg-green-100 text-green-800'
                        : sub.passRate >= 50
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {sub.passRate.toFixed(1)}% Pass
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Avg</p>
                    <p className="font-bold text-gray-900">{sub.averageScore.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">High</p>
                    <p className="font-bold text-green-700">{sub.highestScore.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-gray-500">Low</p>
                    <p className="font-bold text-red-700">{sub.lowestScore.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {[
                    { label: 'Excellent (≥90%)', value: sub.distribution.excellent, color: 'bg-green-500' },
                    { label: 'Good (75–90%)', value: sub.distribution.good, color: 'bg-blue-500' },
                    { label: 'Average (60–75%)', value: sub.distribution.average, color: 'bg-yellow-500' },
                    { label: 'Poor (<60%)', value: sub.distribution.poor, color: 'bg-red-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-28 text-gray-500">{label}</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color}`}
                          style={{
                            width: sub.totalStudents
                              ? `${(value / sub.totalStudents) * 100}%`
                              : '0%',
                          }}
                        />
                      </div>
                      <span className="w-5 text-right font-medium text-gray-700">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CO Attainment */}
      {activeSection === 'co' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Course Outcome (CO) Attainment</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  {['Subject', 'CO', 'Attainment Level', 'Achievement %', 'Target'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.coAnalysis.map((co, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{co.subjectCode}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{co.coNumber}</td>
                    <td className="px-4 py-3 w-48">
                      <AttainmentBar value={co.attainmentLevel} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {co.achievementPercentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3">
                      {co.targetAchieved ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PO Attainment */}
      {activeSection === 'po' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Program Outcome (PO) Attainment</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.poAnalysis.map((po) => (
              <div
                key={po.programOutcome}
                className="bg-white rounded-xl border border-blue-100 shadow-sm p-5 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900 text-lg">{po.programOutcome}</p>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${strengthColors[po.strengthLevel]}`}>
                    {po.strengthLevel}
                  </span>
                </div>
                <AttainmentBar value={po.attainmentLevel} />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Contributing COs</p>
                  <div className="flex flex-wrap gap-1">
                    {po.contributingCOs.map((co) => (
                      <span
                        key={co}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium"
                      >
                        {co}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Student-wise Analysis */}
      {activeSection === 'students' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Student-wise Analysis</h3>
          <div className="space-y-3">
            {results.studentWiseAnalysis.map((student) => (
              <StudentRow key={student.prn} student={student} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentRow: React.FC<{ student: StudentData }> = ({ student }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
            {student.name.charAt(0)}
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500">{student.prn}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-xs text-gray-500">Overall</p>
            <p
              className={`font-bold text-sm ${
                student.overallPerformance >= 75
                  ? 'text-green-600'
                  : student.overallPerformance >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}
            >
              {student.overallPerformance.toFixed(1)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Attendance</p>
            <p className="font-bold text-sm text-gray-700">{student.attendance.toFixed(1)}%</p>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4 pt-3">
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1">Strength Subjects</p>
            {student.strengthSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {student.strengthSubjects.map((s) => (
                  <span key={s} className="text-xs bg-green-50 text-green-800 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">None</p>
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1">Needs Improvement</p>
            {student.improvementAreas.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {student.improvementAreas.map((s) => (
                  <span key={s} className="text-xs bg-red-50 text-red-800 px-2 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">None</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
