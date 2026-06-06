import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import { analyzePerformanceData } from '../lib/analysis';

interface FileUploadProps {
  onFileProcess: (data: {
    analysisResults: any;
    students: any[];
    subjects: any[];
    overview: {
      totalStudents: number;
      averageCGPA: number;
      passRate: number;
      totalSubjects: number;
    };
  }) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileProcess }) => {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Validate required sheets
        const requiredSheets = ['Students', 'MSE Marks', 'ESE Marks', 'CA Marks', 'IA Marks', 'Subjects'];
        const missingSheets = requiredSheets.filter(sheet => !workbook.SheetNames.includes(sheet));
        
        if (missingSheets.length > 0) {
          toast.error(`Missing required sheets: ${missingSheets.join(', ')}`);
          return;
        }

        // Convert each sheet to JSON
        const sheets = workbook.SheetNames.reduce((acc: any, sheetName) => {
          acc[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
          return acc;
        }, {});

        // Log the structure of each sheet for debugging
        console.log('Sheet structures:', Object.keys(sheets).reduce((acc: any, sheetName) => {
          if (sheets[sheetName].length > 0) {
            acc[sheetName] = Object.keys(sheets[sheetName][0]);
          }
          return acc;
        }, {}));

        // Validate data structure
        if (!validateSheetData(sheets)) {
          // Check each sheet's validation
          const validationResults = {
            students: sheets['Students']?.every((student: any) => 
              student.PRN && student.Name && student.Course && student.Semester
            ),
            mse: sheets['MSE Marks']?.every((mark: any) => 
              mark.PRN && mark['Subject Code'] && 
              typeof mark['Marks Obtained'] === 'number' && 
              typeof mark['Total Marks'] === 'number'
            ),
            ese: sheets['ESE Marks']?.every((mark: any) => 
              mark.PRN && mark['Subject Code'] && 
              typeof mark['Marks Obtained'] === 'number' && 
              typeof mark['Total Marks'] === 'number'
            ),
            ca: sheets['CA Marks']?.every((mark: any) => 
              mark.PRN && mark['Subject Code'] && 
              typeof mark['Lab Performance'] === 'number' &&
              typeof mark['Lab Records'] === 'number' &&
              typeof mark['Lab Viva'] === 'number' &&
              typeof mark['Total CA'] === 'number' && 
              typeof mark['Maximum Marks'] === 'number'
            ),
            ia: sheets['IA Marks']?.every((mark: any) => 
              mark.PRN && mark['Subject Code'] && 
              typeof mark['Assignment 1'] === 'number' &&
              typeof mark['Assignment 2'] === 'number' &&
              typeof mark['Quiz 1'] === 'number' &&
              typeof mark['Quiz 2'] === 'number' &&
              typeof mark['Total IA'] === 'number' && 
              typeof mark['Maximum Marks'] === 'number'
            ),
            subjects: sheets['Subjects']?.every((subject: any) => 
              subject['Subject Code'] && 
              subject['Subject Name'] && 
              typeof subject['Maximum Marks (MSE)'] === 'number' &&
              typeof subject['Maximum Marks (ESE)'] === 'number' &&
              typeof subject['Maximum Marks (CA)'] === 'number' &&
              typeof subject['Maximum Marks (IA)'] === 'number' &&
              typeof subject['Pass Percentage Required'] === 'number'
            )
          };

          // Show specific error message
          const failedSheets = Object.entries(validationResults)
            .filter(([_, isValid]) => !isValid)
            .map(([sheet]) => sheet);
          
          toast.error(`Invalid data in sheets: ${failedSheets.join(', ')}. Please check the column names and data types.`);
          return;
        }

        // Process and analyze the data
        const analysisResults = analyzePerformanceData(sheets);
        
        // Calculate overview metrics
        const overview = {
          totalStudents: sheets['Students'].length,
          averageCGPA: Number(calculateAverageCGPA(sheets)),
          passRate: Number(calculatePassRate(sheets)),
          totalSubjects: sheets['Subjects'].length
        };

        // Process students data
        const students = processStudentsData(sheets);

        // Process subjects data
        const subjects = processSubjectsData(sheets);

        // Send all processed data to parent component
        onFileProcess({
          analysisResults,
          students,
          subjects,
          overview
        });

        toast.success('File processed successfully');
      } catch (error) {
        console.error('Error processing file:', error);
        toast.error('Error processing file. Please check the file format and try again.');
      }
    };

    reader.readAsBinaryString(file);
  }, [onFileProcess]);

  const calculateStudentCGPA = (studentPRN: string, sheets: any) => {
    const mseMarks = sheets['MSE Marks'].filter((m: any) => m.PRN === studentPRN);
    const eseMarks = sheets['ESE Marks'].filter((m: any) => m.PRN === studentPRN);
    const caMarks = sheets['CA Marks'].filter((m: any) => m.PRN === studentPRN);
    const iaMarks = sheets['IA Marks'].filter((m: any) => m.PRN === studentPRN);

    let totalGradePoints = 0;
    let totalCredits = 0;

    // Process each subject's marks
    const subjectCodes = [...new Set([
      ...mseMarks.map((m: any) => m['Subject Code']),
      ...eseMarks.map((m: any) => m['Subject Code']),
      ...caMarks.map((m: any) => m['Subject Code']),
      ...iaMarks.map((m: any) => m['Subject Code'])
    ])];

    subjectCodes.forEach((subjectCode: string) => {
      const subject = sheets['Subjects'].find((s: any) => s['Subject Code'] === subjectCode);
      if (!subject) return;

      // Get MSE marks
      const mseMark = mseMarks.find((m: any) => m['Subject Code'] === subjectCode);
      const mse = mseMark ? (
        mseMark['Marks Obtained'] || 
        mseMark['Marks'] || 
        mseMark['Obtained Marks'] || 
        0
      ) : 0;

      // Get ESE marks
      const eseMark = eseMarks.find((m: any) => m['Subject Code'] === subjectCode);
      const ese = eseMark ? (
        eseMark['Marks Obtained'] || 
        eseMark['Marks'] || 
        eseMark['Obtained Marks'] || 
        0
      ) : 0;
      
      // Get CA marks
      const caMark = caMarks.find((m: any) => m['Subject Code'] === subjectCode);
      const caTotal = caMark ? (
        (caMark['Lab Performance'] || 0) +
        (caMark['Lab Records'] || 0) +
        (caMark['Lab Viva'] || 0)
      ) : 0;

      // Get IA marks
      const iaMark = iaMarks.find((m: any) => m['Subject Code'] === subjectCode);
      const iaTotal = iaMark ? (
        (iaMark['Assignment 1'] || 0) +
        (iaMark['Assignment 2'] || 0) +
        (iaMark['Quiz 1'] || 0) +
        (iaMark['Quiz 2'] || 0)
      ) : 0;

      const totalMarks = mse + ese + caTotal + iaTotal;
      const maxMarks = (
        (subject['Maximum Marks (MSE)'] || 0) +
        (subject['Maximum Marks (ESE)'] || 0) +
        (subject['Maximum Marks (CA)'] || 0) +
        (subject['Maximum Marks (IA)'] || 0)
      );

      const percentage = (totalMarks / maxMarks) * 100;
      
      // Check if student passed the subject
      const passPercentage = subject['Pass Percentage Required'] || 
                           subject['Pass Percentage'] || 
                           subject['Minimum Pass Percentage'] || 
                           40; // Default to 40% if not specified
      if (percentage < passPercentage) {
        return; // Skip this subject if not passed
      }
      
      // Convert percentage to grade points
      let gradePoints = 0;
      if (percentage >= 90) gradePoints = 10;
      else if (percentage >= 80) gradePoints = 9;
      else if (percentage >= 70) gradePoints = 8;
      else if (percentage >= 60) gradePoints = 7;
      else if (percentage >= 50) gradePoints = 6;
      else if (percentage >= 40) gradePoints = 5;
      else gradePoints = 0;

      // Assuming each subject has 4 credits
      const credits = 4;
      totalGradePoints += gradePoints * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? (totalGradePoints / totalCredits).toFixed(2) : '0.00';
  };

  const calculateAverageCGPA = (sheets: any) => {
    const students = sheets['Students'];
    const totalCGPA = students.reduce((sum: number, student: any) => {
      const cgpa = Number(calculateStudentCGPA(student.PRN, sheets));
      return sum + cgpa;
    }, 0);
    return (totalCGPA / students.length).toFixed(2);
  };

  const calculatePassRate = (sheets: any) => {
    const students = sheets['Students'];
    const passedStudents = students.filter((student: any) => {
      const cgpa = Number(calculateStudentCGPA(student.PRN, sheets));
      return cgpa >= 6.0; // Pass if CGPA is 6.0 or above
    }).length;
    return ((passedStudents / students.length) * 100).toFixed(2);
  };

  const processStudentsData = (sheets: any) => {
    return sheets['Students'].map((student: any) => ({
      id: student.PRN,
      name: student.Name,
      prn: student.PRN,
      course: student.Course,
      semester: student.Semester,
      cgpa: calculateStudentCGPA(student.PRN, sheets)
    }));
  };

  const processSubjectsData = (sheets: any) => {
    return sheets['Subjects'].map((subject: any) => ({
      id: subject['Subject Code'],
      code: subject['Subject Code'],
      name: subject['Subject Name'],
      faculty: subject.Faculty || 'Not Assigned',
      students: sheets['Students'].length,
      avgScore: calculateSubjectAverageScore(subject['Subject Code'], sheets)
    }));
  };

  const calculateSubjectAverageScore = (subjectCode: string, sheets: any) => {
    const mseMarks = sheets['MSE Marks'].filter((m: any) => m['Subject Code'] === subjectCode);
    const eseMarks = sheets['ESE Marks'].filter((m: any) => m['Subject Code'] === subjectCode);
    const caMarks = sheets['CA Marks'].filter((m: any) => m['Subject Code'] === subjectCode);
    const iaMarks = sheets['IA Marks'].filter((m: any) => m['Subject Code'] === subjectCode);

    let totalScore = 0;
    let totalStudents = 0;

    // Process each student's marks for this subject
    const students = [...new Set([
      ...mseMarks.map((m: any) => m.PRN),
      ...eseMarks.map((m: any) => m.PRN),
      ...caMarks.map((m: any) => m.PRN),
      ...iaMarks.map((m: any) => m.PRN)
    ])];

    students.forEach((prn: string) => {
      const mse = mseMarks.find((m: any) => m.PRN === prn)?.['Marks Obtained'] || 0;
      const ese = eseMarks.find((m: any) => m.PRN === prn)?.['Marks Obtained'] || 0;
      
      // Get CA marks
      const caMark = caMarks.find((m: any) => m.PRN === prn && m['Subject Code'] === subjectCode);
      const caTotal = caMark ? (
        (caMark['Lab Performance'] || 0) +
        (caMark['Lab Records'] || 0) +
        (caMark['Lab Viva'] || 0)
      ) : 0;

      // Get IA marks
      const iaMark = iaMarks.find((m: any) => m.PRN === prn && m['Subject Code'] === subjectCode);
      const iaTotal = iaMark ? (
        (iaMark['Assignment 1'] || 0) +
        (iaMark['Assignment 2'] || 0) +
        (iaMark['Quiz 1'] || 0) +
        (iaMark['Quiz 2'] || 0)
      ) : 0;

      const subject = sheets['Subjects'].find((s: any) => s['Subject Code'] === subjectCode);
      if (!subject) return;

      const maxMarks = subject['Maximum Marks (MSE)'] + 
                      subject['Maximum Marks (ESE)'] + 
                      subject['Maximum Marks (CA)'] + 
                      subject['Maximum Marks (IA)'];

      const studentScore = ((mse + ese + caTotal + iaTotal) / maxMarks) * 100;
      totalScore += studentScore;
      totalStudents++;
    });

    return totalStudents > 0 ? Math.round(totalScore / totalStudents) : 0;
  };

  const validateSheetData = (sheets: any) => {
    try {
      // Check if all required sheets exist
      const requiredSheets = ['Students', 'MSE Marks', 'ESE Marks', 'CA Marks', 'IA Marks', 'Subjects'];
      const missingSheets = requiredSheets.filter(sheet => !sheets[sheet]);
      if (missingSheets.length > 0) {
        console.error('Missing sheets:', missingSheets);
        return false;
      }

      // Validate Students sheet
      const hasValidStudents = sheets['Students']?.every((student: any) => {
        const isValid = student.PRN && student.Name && student.Course && student.Semester;
        if (!isValid) console.error('Invalid student record:', student);
        return isValid;
      });

      // Validate MSE Marks sheet
      const hasValidMSE = sheets['MSE Marks']?.every((mark: any) => {
        const isValid = mark.PRN && 
                       mark['Subject Code'] && 
                       typeof mark['Marks Obtained'] === 'number' && 
                       typeof mark['Maximum Marks'] === 'number';
        if (!isValid) console.error('Invalid MSE mark record:', mark);
        return isValid;
      });

      // Validate ESE Marks sheet
      const hasValidESE = sheets['ESE Marks']?.every((mark: any) => {
        const isValid = mark.PRN && 
                       mark['Subject Code'] && 
                       typeof mark['Marks Obtained'] === 'number' && 
                       typeof mark['Maximum Marks'] === 'number';
        if (!isValid) console.error('Invalid ESE mark record:', mark);
        return isValid;
      });

      // Validate CA Marks sheet
      const hasValidCA = sheets['CA Marks']?.every((mark: any) => {
        const isValid = mark.PRN && 
                       mark['Subject Code'] && 
                       typeof mark['Lab Performance'] === 'number' &&
                       typeof mark['Lab Records'] === 'number' &&
                       typeof mark['Lab Viva'] === 'number' &&
                       typeof mark['Total CA'] === 'number' && 
                       typeof mark['Maximum Marks'] === 'number';
        if (!isValid) console.error('Invalid CA mark record:', mark);
        return isValid;
      });

      // Validate IA Marks sheet
      const hasValidIA = sheets['IA Marks']?.every((mark: any) => {
        const isValid = mark.PRN && 
                       mark['Subject Code'] && 
                       typeof mark['Assignment 1'] === 'number' &&
                       typeof mark['Assignment 2'] === 'number' &&
                       typeof mark['Quiz 1'] === 'number' &&
                       typeof mark['Quiz 2'] === 'number' &&
                       typeof mark['Total IA'] === 'number' && 
                       typeof mark['Maximum Marks'] === 'number';
        if (!isValid) console.error('Invalid IA mark record:', mark);
        return isValid;
      });

      // Validate Subjects sheet
      const hasValidSubjects = sheets['Subjects']?.every((subject: any) => {
        const isValid = subject['Subject Code'] && 
                       subject['Subject Name'] && 
                       typeof subject['Maximum Marks (MSE)'] === 'number' &&
                       typeof subject['Maximum Marks (ESE)'] === 'number' &&
                       typeof subject['Maximum Marks (CA)'] === 'number' &&
                       typeof subject['Maximum Marks (IA)'] === 'number' &&
                       typeof subject['Pass Percentage Required'] === 'number';
        if (!isValid) console.error('Invalid subject record:', subject);
        return isValid;
      });

      // Log which validation failed
      if (!hasValidStudents) console.error('Students sheet validation failed');
      if (!hasValidMSE) console.error('MSE Marks sheet validation failed');
      if (!hasValidESE) console.error('ESE Marks sheet validation failed');
      if (!hasValidCA) console.error('CA Marks sheet validation failed');
      if (!hasValidIA) console.error('IA Marks sheet validation failed');
      if (!hasValidSubjects) console.error('Subjects sheet validation failed');

      return hasValidStudents && hasValidMSE && hasValidESE && hasValidCA && hasValidIA && hasValidSubjects;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  return (
    <div className="space-y-6">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className={`mx-auto h-12 w-12 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="mt-4 text-sm text-gray-600">
          {isDragActive ? (
            <span className="font-medium text-blue-600">Drop the Excel file here</span>
          ) : (
            <>
              <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-gray-500">Excel files only (*.xlsx, *.xls)</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-yellow-800 mb-2">Required Excel Structure:</h3>
        <ul className="text-xs text-yellow-700 space-y-1">
          <li>• Sheet 1: Students (PRN, Name, Course, Semester)</li>
          <li>• Sheet 2: MSE Marks (PRN, Subject Code, Marks Obtained, Total Marks)</li>
          <li>• Sheet 3: ESE Marks (PRN, Subject Code, Marks Obtained, Total Marks)</li>
          <li>• Sheet 4: CA Marks (PRN, Subject Code, Lab Performance, Lab Records, Lab Viva, Total CA, Maximum Marks)</li>
          <li>• Sheet 5: IA Marks (PRN, Subject Code, Assignment 1, Assignment 2, Quiz 1, Quiz 2, Total IA, Maximum Marks)</li>
          <li>• Sheet 6: Subjects (Subject Code, Subject Name, Maximum Marks MSE, Maximum Marks ESE, Maximum Marks CA, Maximum Marks IA, Pass Percentage Required)</li>
        </ul>
      </div>
    </div>
  );
};