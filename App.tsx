
import React, { useState, useEffect } from 'react';
import { Menu, Database, Download, Upload } from 'lucide-react';
import { AppState, AssessmentType, Gender, Student, ClassGroup, Assessment, Grade, ForumPost } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClassManager from './components/ClassManager';
import AssessmentManager from './components/AssessmentManager';
import ReportGenerator from './components/ReportGenerator';
import JournalManager from './components/JournalManager';
import QuestionnaireManager from './components/QuestionnaireManager';
import AttendanceManager from './components/AttendanceManager';
import ExamManager from './components/ExamManager';
import ForumManager from './components/ForumManager';
import LandingPage from './components/LandingPage';
import { storageService } from './services/storageService';

// --- DATA GENERATOR FOR REALISTIC PREVIEW ---
const generateDummyData = (): AppState => {
  const classes: ClassGroup[] = [
    { id: 'c1', name: 'X Tahfidz 1', gradeLevel: 10, year: '2023/2024' },
    { id: 'c2', name: 'X Sains 2', gradeLevel: 10, year: '2023/2024' }
  ];

  const students: Student[] = [];
  const assessments: Assessment[] = [];
  const grades: Grade[] = [];

  // Helper to random int
  const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  classes.forEach(cls => {
    // 1. Generate 25 Students per class (Only Females for Pesantren Putri)
    for (let i = 1; i <= 25; i++) {
      const gender = Gender.P; // All female
      const firstNames = ['Aisyah', 'Fatimah', 'Zahra', 'Khadijah', 'Maryam', 'Hafsah', 'Nadia', 'Siti', 'Nurul', 'Wardah'];
      const lastNames = ['Azzahra', 'Humaira', 'Salsabila', 'Fitri', 'Hidayah', 'Rahma', 'Khoirunnisa', 'Amalia', 'Putri', 'Shalihah'];
      
      students.push({
        id: `${cls.id}_s${i}`,
        nis: `23${cls.gradeLevel}${r(100, 999)}`,
        name: `${firstNames[r(0, 9)]} ${lastNames[r(0, 9)]}`,
        gender: gender,
        classId: cls.id,
        photoUrl: undefined
      });
    }

    // 2. Generate Assessments
    const subjects = [
      { t: AssessmentType.PH, title: 'PH 1 - Tajwid', w: 10 },
      { t: AssessmentType.PH, title: 'PH 2 - Fiqih Wanita', w: 10 },
      { t: AssessmentType.TUGAS, title: 'Hafalan Juz 30', w: 20 },
      { t: AssessmentType.PTS, title: 'PTS Ganjil (Kitab)', w: 25 },
      { t: AssessmentType.PH, title: 'PH 3 - Bahasa Arab', w: 10 },
      { t: AssessmentType.PAS, title: 'PAS Ganjil', w: 25 },
    ];

    subjects.forEach((subj, idx) => {
      const aId = `${cls.id}_a${idx}`;
      assessments.push({
        id: aId,
        title: subj.title,
        type: subj.t,
        classId: cls.id,
        date: new Date(2023, 7 + idx, 15).toISOString().split('T')[0], // Spread dates
        maxScore: 100,
        weight: subj.w
      });

      // 3. Generate Grades
      // Simulate class performance trends (some students smarter)
      students.filter(s => s.classId === cls.id).forEach((s, sIdx) => {
        // Base ability of student (random but consistent)
        const baseAbility = 65 + (sIdx % 5) * 7; // Ranges 
        const variance = r(-5, 10);
        let score = baseAbility + variance;
        if (score > 100) score = 100;
        if (score < 50) score = 50;

        grades.push({
          assessmentId: aId,
          studentId: s.id,
          score: score
        });
      });
    });
  });

  const forumPosts: ForumPost[] = [
    {
      id: '1',
      author: 'Ustadzah Fatimah',
      role: 'TEACHER',
      content: 'Assalamu\'alaikum Santriwati Shalihah. Mengingatkan untuk setoran hafalan Juz 30 ba\'da Ashar di Masjid Khadijah. Tolong perhatikan makhrajul hurufnya ya.',
      date: '2023-10-24T08:30:00',
      likes: 42,
      comments: [
        { id: 'c1', author: 'Aisyah Humaira (Santri)', role: 'STUDENT', content: 'Wa\'alaikumussalam Ustadzah, insyaAllah siap.', date: '2023-10-24T09:00:00' },
        { id: 'c2', author: 'Fatimah Az-Zahra (Santri)', role: 'STUDENT', content: 'Afwan Ustadzah, saya izin terlambat sebentar karena piket.', date: '2023-10-24T09:15:00' }
      ]
    },
    {
      id: '2',
      author: 'Nadia (Ketua OSIS)',
      role: 'STUDENT',
      content: 'Teman-teman, untuk kajian Kitab Ta\'lim Muta\'allim besok, jangan lupa membawa buku catatan khusus Adab ya. Kita akan bahas bab "Menghormati Guru".',
      date: '2023-10-23T14:00:00',
      likes: 28,
      comments: []
    }
  ];

  return {
    classes,
    students,
    assessments,
    grades,
    journals: [],
    dailyAttendance: [],
    questionnaires: [
        {
          id: 'q1',
          title: 'Tes Gaya Belajar (V-A-K)',
          description: 'Mengetahui kecenderungan gaya belajar Visual, Auditory, atau Kinestetik santriwati.',
          questions: [
            { id: 'q1_1', text: 'Saya lebih suka melihat gambar/diagram daripada mendengarkan penjelasan.', category: 'Visual' },
            { id: 'q1_2', text: 'Saya mudah mengingat apa yang saya dengar di kelas.', category: 'Auditory' },
            { id: 'q1_3', text: 'Saya suka belajar sambil bergerak atau memegang objek.', category: 'Kinestetik' },
          ]
        }
    ],
    questionnaireResponses: [],
    examPackages: [],
    forumPosts,
    settings: {
      kkm: 75,
      schoolName: 'DIGISS Boarding School',
      teacherName: 'Ustadzah Aminah, S.Pd.'
    }
  };
};

const INITIAL_DATA = generateDummyData();

const App: React.FC = () => {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // App State
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<AppState>(INITIAL_DATA);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    const savedData = storageService.load();
    if (savedData) {
      // Data Migration / Filling missing fields for new features
      const mergedData = { ...INITIAL_DATA, ...savedData };
      // Specifically ensure arrays are present if missing in saved data
      if (!savedData.journals) mergedData.journals = [];
      if (!savedData.dailyAttendance) mergedData.dailyAttendance = [];
      if (!savedData.questionnaires) mergedData.questionnaires = INITIAL_DATA.questionnaires;
      if (!savedData.questionnaireResponses) mergedData.questionnaireResponses = [];
      if (!savedData.examPackages) mergedData.examPackages = [];
      if (!savedData.forumPosts || savedData.forumPosts.length === 0) mergedData.forumPosts = INITIAL_DATA.forumPosts;
      
      setData(mergedData);
    }
    setIsLoaded(true);
  }, []);

  // Save Data on Change
  useEffect(() => {
    if (isLoaded) {
      storageService.save(data);
    }
  }, [data, isLoaded]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard'); // Reset to default for next login
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if(confirm("Impor data akan menimpa semua data saat ini. Lanjutkan?")) {
        try {
          const newData = await storageService.importData(file);
          setData(newData);
          alert("Database berhasil dipulihkan!");
        } catch (error) {
          alert(error instanceof Error ? error.message : "Gagal impor data.");
        }
      }
    }
    // Reset Input
    e.target.value = '';
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard data={data} />;
      case 'classes':
        return <ClassManager data={data} onUpdate={setData} />;
      case 'attendance': 
        return <AttendanceManager data={data} onUpdate={setData} />;
      case 'journals':
        return <JournalManager data={data} onUpdate={setData} />;
      case 'assessments':
        return <AssessmentManager data={data} onUpdate={setData} />;
      case 'exams': 
        return <ExamManager data={data} onUpdate={setData} />;
      case 'forum':
        return <ForumManager data={data} onUpdate={setData} />;
      case 'talents':
        return <QuestionnaireManager data={data} onUpdate={setData} />;
      case 'reports':
        return <ReportGenerator data={data} />;
      case 'settings':
        return (
            <div className="space-y-6">
                {/* Global Settings */}
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Menu size={20} /> Pengaturan Sekolah
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Sekolah</label>
                            <input 
                                type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={data.settings.schoolName}
                                onChange={(e) => setData({...data, settings: {...data.settings, schoolName: e.target.value}})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Guru (Wali Kelas)</label>
                            <input 
                                type="text" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={data.settings.teacherName}
                                onChange={(e) => setData({...data, settings: {...data.settings, teacherName: e.target.value}})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">KKM (Kriteria Ketuntasan Minimal)</label>
                            <input 
                                type="number" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={data.settings.kkm}
                                onChange={(e) => setData({...data, settings: {...data.settings, kkm: parseInt(e.target.value)}})}
                            />
                        </div>
                    </div>
                </div>

                {/* Data Management */}
                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-blue-800">
                        <Database size={20} /> Manajemen Database (Backup & Restore)
                    </h2>
                    <p className="text-sm text-gray-600 mb-6">
                        Simpan data Anda secara berkala ke komputer agar data aman dan permanen (tidak hilang saat clear cache browser).
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <button 
                            onClick={() => storageService.exportData(data)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition"
                        >
                            <Download size={20} /> Backup Data (Download)
                        </button>
                        
                        <div className="flex-1 relative">
                             <input 
                                type="file" 
                                accept=".json" 
                                onChange={handleImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             />
                             <button className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition pointer-events-none">
                                <Upload size={20} /> Restore Data (Import)
                             </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 mt-10">
                    DIGISS Academic System v2.0
                </div>
            </div>
        );
      default:
        return <Dashboard data={data} />;
    }
  };

  // --- RENDER ---

  if (!isAuthenticated) {
    return <LandingPage data={data} onLogin={handleLogin} onUpdate={setData} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:hidden flex-shrink-0 z-10 justify-between">
          <div className="flex items-center">
             <button 
               onClick={() => setIsSidebarOpen(true)}
               className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg mr-2"
             >
               <Menu size={24} />
             </button>
             <span className="font-semibold text-gray-800">Dashboard</span>
          </div>
          <div className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
             DIGISS
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
