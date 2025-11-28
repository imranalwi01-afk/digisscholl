
export enum AssessmentType {
  PH = 'Penilaian Harian',
  PTS = 'Penilaian Tengah Semester',
  PAS = 'Penilaian Akhir Semester',
  TUGAS = 'Tugas/Proyek',
  SIKAP = 'Sikap',
  KETERAMPILAN = 'Keterampilan'
}

export enum Gender {
  L = 'Laki-laki',
  P = 'Perempuan'
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  gender: Gender;
  classId: string;
  photoUrl?: string;
  // New Fields
  birthDate?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  email?: string;
  notes?: string;
}

export interface ClassGroup {
  id: string;
  name: string; // e.g. "X IPA 1"
  gradeLevel: number; // 10
  year: string; // "2023/2024"
}

export interface Assessment {
  id: string;
  title: string;
  type: AssessmentType;
  classId: string;
  date: string;
  maxScore: number;
  weight: number; // Percentage 0-100
}

export interface Grade {
  assessmentId: string;
  studentId: string;
  score: number;
  feedback?: string;
}

// --- ATTENDANCE & JOURNAL TYPES ---

export type AttendanceStatus = 'H' | 'S' | 'I' | 'A' | 'T'; // Added 'T' for Terlambat

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  note?: string; // Reason for absence or lateness
}

export interface TeachingJournal {
  id: string;
  classId: string;
  date: string;
  timeStart: string; // e.g., "07:00"
  timeEnd: string;   // e.g., "08:30"
  subject: string;   // Mata Pelajaran
  topic: string;     // Materi Pokok / KD
  activity: string;  // Kegiatan Pembelajaran / Metode
  notes: string;     // Catatan Kejadian / Refleksi
  attendance: AttendanceRecord[];
}

export interface DailyAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  classId: string;
  records: AttendanceRecord[];
}

// --- QUESTIONNAIRE TYPES ---

export interface Question {
  id: string;
  text: string;
  category: string; // e.g., "Visual", "Auditory", "Kinesthetic"
}

export interface Questionnaire {
  id: string;
  title: string;
  description: string;
  questions: Question[];
}

export interface QuestionnaireResponse {
  id: string;
  questionnaireId: string;
  studentId: string;
  date: string;
  answers: Record<string, number>; // questionId -> score (1-4)
  aiAnalysis?: string;
}

// --- EXAM / QUESTION BANK TYPES ---

export type ExamQuestionType = 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE';

export interface ExamOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ExamQuestion {
  id: string;
  type: ExamQuestionType;
  text: string;
  options?: ExamOption[]; // For PG
  correctAnswer?: boolean; // For True/False
  answerKey?: string; // For Essay
  points: number;
}

export interface ExamPackage {
  id: string;
  title: string;
  subject: string;
  gradeLevel: number;
  questions: ExamQuestion[];
  createdDate: string;
}

// --- FORUM TYPES ---

export interface ForumComment {
  id: string;
  author: string;
  role: 'TEACHER' | 'STUDENT';
  content: string;
  date: string;
}

export interface ForumPost {
  id: string;
  author: string;
  role: 'TEACHER' | 'STUDENT';
  content: string;
  date: string;
  likes: number;
  comments: ForumComment[];
}

export interface AppState {
  classes: ClassGroup[];
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
  journals: TeachingJournal[];
  dailyAttendance: DailyAttendance[];
  questionnaires: Questionnaire[];
  questionnaireResponses: QuestionnaireResponse[];
  examPackages: ExamPackage[];
  forumPosts: ForumPost[]; // Add this
  settings: {
    kkm: number;
    schoolName: string;
    teacherName: string;
  };
}

export interface ChartData {
  name: string;
  value: number;
}