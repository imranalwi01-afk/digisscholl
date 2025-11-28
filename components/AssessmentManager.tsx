
import React, { useState, useMemo } from 'react';
import { AppState, Assessment, AssessmentType, Grade, Student } from '../types';
import { Plus, Save, Calendar, ArrowLeft, Trash2, Edit2, TrendingUp, User, X, BarChart2, Phone, FileText } from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, Legend, LineChart, Line, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';

interface AssessmentManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

const AssessmentManager: React.FC<AssessmentManagerProps> = ({ data, onUpdate }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  
  // UI States
  const [viewState, setViewState] = useState<'list' | 'create' | 'edit' | 'grading'>('list');
  const [studentModalId, setStudentModalId] = useState<string | null>(null); // For detailed modal

  // Form State
  const [form, setForm] = useState<Partial<Assessment>>({
    type: AssessmentType.PH,
    weight: 10,
    maxScore: 100
  });

  const activeClass = data.classes.find(c => c.id === selectedClassId);
  const classAssessments = data.assessments.filter(a => a.classId === selectedClassId);
  const classStudents = data.students.filter(s => s.classId === selectedClassId).sort((a,b) => a.name.localeCompare(b.name));
  const activeAssessment = data.assessments.find(a => a.id === selectedAssessmentId);

  // Local state for grading
  const [gradingBuffer, setGradingBuffer] = useState<Record<string, number>>({});

  // --- ANALYTICS HELPERS ---

  // Live analytics based on Buffer + Saved Grades
  const liveStats = useMemo(() => {
    if (!selectedAssessmentId) return null;
    
    // Combine saved grades and buffer (buffer takes precedence)
    const currentScores: number[] = [];
    classStudents.forEach(s => {
        if (gradingBuffer[s.id] !== undefined) {
            currentScores.push(gradingBuffer[s.id]);
        } else {
            const saved = data.grades.find(g => g.assessmentId === selectedAssessmentId && g.studentId === s.id);
            if (saved) currentScores.push(saved.score);
        }
    });

    if (currentScores.length === 0) return null;

    const avg = currentScores.reduce((a,b) => a+b, 0) / currentScores.length;
    const max = Math.max(...currentScores);
    const min = Math.min(...currentScores);
    const kkm = data.settings.kkm;
    
    const passed = currentScores.filter(s => s >= kkm).length;
    const failed = currentScores.length - passed;

    // Distribution
    const dist = [
        { range: '0-59', count: 0 },
        { range: '60-74', count: 0 },
        { range: '75-89', count: 0 },
        { range: '90-100', count: 0 },
    ];
    currentScores.forEach(s => {
        if (s < 60) dist[0].count++;
        else if (s < 75) dist[1].count++;
        else if (s < 90) dist[2].count++;
        else dist[3].count++;
    });

    return { avg, max, min, passed, failed, dist, count: currentScores.length };
  }, [gradingBuffer, data.grades, selectedAssessmentId, classStudents, data.settings.kkm]);

  // Student specific deep dive analytics
  const getStudentAnalytics = (studentId: string) => {
      // 1. Trend Line: Student Score vs Class Avg per Assessment (Chronological)
      const sortedAssessments = classAssessments.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const trendData = sortedAssessments.map(ass => {
          const sGrade = data.grades.find(g => g.assessmentId === ass.id && g.studentId === studentId);
          
          // Calculate class average for this assessment
          const allGrades = data.grades.filter(g => g.assessmentId === ass.id);
          const clsAvg = allGrades.length ? allGrades.reduce((a,b) => a+b.score, 0) / allGrades.length : 0;

          return {
              name: ass.title,
              Siswa: sGrade ? sGrade.score : null,
              RataKelas: parseFloat(clsAvg.toFixed(1))
          };
      });

      // 2. Radar: Competency Balance
      const typeMap: Record<string, {total: number, count: number}> = {};
      Object.values(AssessmentType).forEach(t => typeMap[t] = {total: 0, count: 0});
      
      classAssessments.forEach(ass => {
          const g = data.grades.find(gr => gr.assessmentId === ass.id && gr.studentId === studentId);
          if (g) {
              typeMap[ass.type].total += g.score;
              typeMap[ass.type].count++;
          }
      });

      const radarData = Object.keys(typeMap).map(type => ({
          subject: type.split(' ')[0], // Short name
          A: typeMap[type].count ? (typeMap[type].total / typeMap[type].count) : 0,
          fullMark: 100
      })).filter(d => d.A > 0); // Only show types with data

      return { trendData, radarData };
  };

  // --- ACTIONS ---

  const handleInitCreate = () => {
      setForm({
          type: AssessmentType.PH,
          weight: 10,
          maxScore: 100,
          title: '',
          date: new Date().toISOString().split('T')[0]
      });
      setViewState('create');
  };

  const handleInitEdit = (assessment: Assessment, e: React.MouseEvent) => {
      e.stopPropagation();
      setForm({ ...assessment });
      setSelectedAssessmentId(assessment.id);
      setViewState('edit');
  };

  const handleDeleteAssessment = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('Hapus penilaian ini? Semua nilai siswa untuk tugas ini akan hilang.')) {
          onUpdate({
              ...data,
              assessments: data.assessments.filter(a => a.id !== id),
              grades: data.grades.filter(g => g.assessmentId !== id)
          });
      }
  };

  const handleSaveAssessment = () => {
    if (!form.title || !form.date || !selectedClassId) return;
    
    if (viewState === 'create') {
        const assessment: Assessment = {
            id: Date.now().toString(),
            classId: selectedClassId,
            title: form.title,
            type: form.type as AssessmentType,
            date: form.date,
            maxScore: form.maxScore || 100,
            weight: form.weight || 10
        };
        onUpdate({
            ...data,
            assessments: [...data.assessments, assessment]
        });
        setSelectedAssessmentId(assessment.id);
    } else if (viewState === 'edit' && selectedAssessmentId) {
        const updatedAssessments = data.assessments.map(a => 
            a.id === selectedAssessmentId 
            ? { ...a, ...form } as Assessment
            : a
        );
        onUpdate({ ...data, assessments: updatedAssessments });
    }
    
    setViewState('list');
  };

  const handleSelectForGrading = (id: string) => {
      setSelectedAssessmentId(id);
      // Load existing grades into buffer
      const grades: Record<string, number> = {};
      data.grades.filter(g => g.assessmentId === id).forEach(g => grades[g.studentId] = g.score);
      setGradingBuffer(grades);
      setViewState('grading');
  };

  const handleScoreChange = (studentId: string, scoreStr: string) => {
      const max = activeAssessment?.maxScore || 100;
      let score = parseInt(scoreStr);
      if (isNaN(score)) score = 0; // Handle empty/NaN temporarily as 0 for calc
      if (score > max) score = max;
      
      setGradingBuffer(prev => ({ ...prev, [studentId]: score }));
  };

  const saveGrades = () => {
      if(!selectedAssessmentId) return;

      const newGrades = [...data.grades];
      
      Object.entries(gradingBuffer).forEach(([studentId, score]) => {
          const existingIndex = newGrades.findIndex(g => g.assessmentId === selectedAssessmentId && g.studentId === studentId);
          if (existingIndex > -1) {
              newGrades[existingIndex] = { ...newGrades[existingIndex], score };
          } else {
              newGrades.push({ assessmentId: selectedAssessmentId, studentId, score });
          }
      });

      onUpdate({ ...data, grades: newGrades });
      alert("Nilai berhasil disimpan!");
  };

  const getStudentGrade = (studentId: string) => {
      if (gradingBuffer[studentId] !== undefined) return gradingBuffer[studentId];
      // Fallback not needed if we init buffer, but good for safety
      const g = data.grades.find(g => g.assessmentId === selectedAssessmentId && g.studentId === studentId);
      return g ? g.score : '';
  };

  // --- VIEWS ---

  // 1. Select Class
  if (!selectedClassId) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 text-gray-800">Pilih Kelas untuk Penilaian</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.classes.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-md transition text-left group"
            >
              <h3 className="font-bold text-lg text-gray-800 group-hover:text-blue-600 transition-colors">{c.name}</h3>
              <p className="text-gray-500">{c.gradeLevel} • {c.year}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                  <BarChart2 size={16} /> 
                  {data.assessments.filter(a => a.classId === c.id).length} Penilaian
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 2. Form (Create or Edit)
  if (viewState === 'create' || viewState === 'edit') {
      return (
          <div className="p-6 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold mb-6">{viewState === 'create' ? 'Buat Penilaian Baru' : 'Edit Penilaian'}</h2>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Judul Penilaian</label>
                      <input 
                        type="text" 
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Contoh: PH 1 Matematika - Aljabar"
                        value={form.title || ''}
                        onChange={e => setForm({...form, title: e.target.value})}
                      />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                          <select 
                            className="w-full p-2 border rounded-lg"
                            value={form.type}
                            onChange={e => setForm({...form, type: e.target.value as AssessmentType})}
                          >
                              {Object.values(AssessmentType).map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                          <input 
                            type="date" 
                            className="w-full p-2 border rounded-lg"
                            value={form.date || ''}
                            onChange={e => setForm({...form, date: e.target.value})}
                          />
                      </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Bobot (%)</label>
                          <input 
                            type="number" 
                            className="w-full p-2 border rounded-lg"
                            value={form.weight}
                            onChange={e => setForm({...form, weight: parseInt(e.target.value)})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Skor Maksimal</label>
                          <input 
                            type="number" 
                            className="w-full p-2 border rounded-lg"
                            value={form.maxScore}
                            onChange={e => setForm({...form, maxScore: parseInt(e.target.value)})}
                          />
                      </div>
                  </div>
                  <div className="flex gap-3 pt-4 border-t mt-4">
                      <button onClick={handleSaveAssessment} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">Simpan</button>
                      <button onClick={() => setViewState('list')} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">Batal</button>
                  </div>
              </div>
          </div>
      )
  }

  // 3. Grading Interface (Split View)
  if (viewState === 'grading') {
    const activeStudent = studentModalId ? data.students.find(s => s.id === studentModalId) : null;
    const studentAnalytics = activeStudent ? getStudentAnalytics(activeStudent.id) : null;

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-white flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewState('list')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-800">{activeAssessment?.title}</h2>
                        <p className="text-xs text-gray-500">{activeAssessment?.type} • Max: {activeAssessment?.maxScore}</p>
                    </div>
                </div>
                <button onClick={saveGrades} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-sm text-sm font-medium">
                    <Save size={16} /> Simpan Nilai
                </button>
            </div>

            {/* Content: Split Left (Table) & Right (Stats) */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left: Table */}
                <div className="w-full md:w-2/3 lg:w-3/4 overflow-y-auto border-r border-gray-200 bg-gray-50 p-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12">No</th>
                                    <th className="px-4 py-3 text-left">Nama Siswa</th>
                                    <th className="px-4 py-3 text-center w-24">Nilai</th>
                                    <th className="px-4 py-3 text-center w-24">Status</th>
                                    <th className="px-4 py-3 text-center w-16">Detail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {classStudents.map((student, index) => {
                                    const score = getStudentGrade(student.id);
                                    const hasScore = score !== '';
                                    const numScore = Number(score);
                                    const passed = hasScore && numScore >= data.settings.kkm;

                                    return (
                                        <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-4 py-3 text-gray-500 text-center">{index + 1}</td>
                                            <td className="px-4 py-3 font-medium text-gray-800">{student.name}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number"
                                                    min="0"
                                                    max={activeAssessment?.maxScore}
                                                    className={`w-full p-1.5 text-center border rounded focus:ring-2 focus:ring-blue-500 outline-none ${hasScore && !passed ? 'text-red-600 border-red-300 bg-red-50' : 'border-gray-300'}`}
                                                    value={score}
                                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {hasScore ? (
                                                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {passed ? 'Lulus' : 'Remedi'}
                                                    </span>
                                                ) : <span className="text-gray-300">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => setStudentModalId(student.id)} className="text-gray-400 hover:text-blue-600">
                                                    <TrendingUp size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Real-time Stats */}
                <div className="hidden md:block md:w-1/3 lg:w-1/4 bg-white p-6 overflow-y-auto">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart2 size={18} className="text-blue-600" /> Live Analytics
                    </h3>
                    
                    {liveStats ? (
                        <div className="space-y-6">
                            {/* Score Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                    <div className="text-xs text-blue-600 font-semibold uppercase">Rata-Rata</div>
                                    <div className="text-2xl font-bold text-blue-800">{liveStats.avg.toFixed(1)}</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                    <div className="text-xs text-green-600 font-semibold uppercase">Tuntas</div>
                                    <div className="text-2xl font-bold text-green-800">{liveStats.passed} <span className="text-xs text-green-600 font-normal">/ {liveStats.count}</span></div>
                                </div>
                            </div>

                            {/* Pass Rate Pie */}
                            <div className="h-48 relative">
                                <h4 className="text-xs font-bold text-gray-400 uppercase text-center mb-2">Persentase Kelulusan</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Tuntas', value: liveStats.passed },
                                                { name: 'Remedial', value: liveStats.failed }
                                            ]}
                                            cx="50%" cy="50%" innerRadius={40} outerRadius={60}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            <Cell fill="#22c55e" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36}/>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Distribution Bar */}
                            <div className="h-48">
                                <h4 className="text-xs font-bold text-gray-400 uppercase text-center mb-2">Distribusi Nilai</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={liveStats.dist}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="range" tick={{fontSize: 10}} />
                                        <YAxis tick={{fontSize: 10}} allowDecimals={false} />
                                        <Tooltip cursor={{fill: 'transparent'}} />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-10">
                            <p>Mulai input nilai untuk melihat analisis real-time.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Detailed Student Analytics Modal */}
            {activeStudent && studentAnalytics && (
                <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-fade-in">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                             <div className="flex items-center gap-3">
                                 <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden border border-gray-200">
                                     {activeStudent.photoUrl ? (
                                         <img src={activeStudent.photoUrl} alt="Foto" className="w-full h-full object-cover"/>
                                     ) : activeStudent.name.charAt(0)}
                                 </div>
                                 <div>
                                     <h3 className="text-lg font-bold text-gray-800">{activeStudent.name}</h3>
                                     <div className="flex gap-2 text-sm text-gray-500">
                                         <span>{activeStudent.nis}</span> • 
                                         <span>{activeClass?.name}</span>
                                     </div>
                                 </div>
                             </div>
                             <button onClick={() => setStudentModalId(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 p-2 rounded-full transition-colors">
                                 <X size={20}/>
                             </button>
                        </div>
                        
                        <div className="p-6">
                            {/* Contact Summary (If available) */}
                            {(activeStudent.parentPhone || activeStudent.notes) && (
                                <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-100 flex flex-col md:flex-row gap-4 md:gap-8 text-sm text-gray-700">
                                    {activeStudent.parentPhone && (
                                        <div className="flex items-center gap-2">
                                            <Phone size={16} className="text-yellow-600"/>
                                            <span className="font-semibold">Wali:</span> {activeStudent.parentName || '-'} ({activeStudent.parentPhone})
                                        </div>
                                    )}
                                    {activeStudent.notes && (
                                        <div className="flex items-start gap-2">
                                            <FileText size={16} className="text-yellow-600 mt-0.5"/>
                                            <div>
                                                <span className="font-semibold">Catatan:</span> {activeStudent.notes}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Trend Chart */}
                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase">Tren Nilai Siswa vs Rata-Rata Kelas</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={studentAnalytics.trendData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-45} textAnchor="end" height={60} />
                                                <YAxis domain={[0, 100]} />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="Siswa" stroke="#2563eb" strokeWidth={3} dot={{r: 4}} />
                                                <Line type="monotone" dataKey="RataKelas" stroke="#94a3b8" strokeDasharray="5 5" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                
                                {/* Competency Radar */}
                                <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                                    <h4 className="font-bold text-gray-700 mb-4 text-sm uppercase">Keseimbangan Kompetensi</h4>
                                    <div className="h-64">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={studentAnalytics.radarData}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="subject" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                <Radar name="Skor" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-gray-50 text-right">
                             <button onClick={() => setStudentModalId(null)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Tutup</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // 4. Default List View
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
            <button onClick={() => setSelectedClassId('')} className="p-2 hover:bg-gray-100 rounded-full">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Penilaian: {activeClass?.name}</h2>
              <p className="text-sm text-gray-500">Kelola semua penilaian untuk kelas ini</p>
            </div>
        </div>
        <button 
          onClick={handleInitCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Buat Penilaian Baru
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
        {classAssessments.map(a => (
            <div 
              key={a.id}
              onClick={() => handleSelectForGrading(a.id)}
              className="bg-white p-5 rounded-lg border border-gray-200 cursor-pointer hover:border-blue-400 group relative shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      a.type === AssessmentType.PH ? 'bg-blue-100 text-blue-700' :
                      a.type === AssessmentType.PTS ? 'bg-purple-100 text-purple-700' :
                      a.type === AssessmentType.PAS ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                  }`}>{a.type}</span>
                  <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12}/> {new Date(a.date).toLocaleDateString()}</span>
              </div>
              <h3 className="font-medium text-gray-800 pr-12 line-clamp-1" title={a.title}>{a.title}</h3>
              <p className="text-sm text-gray-500 mt-1">Bobot: {a.weight}% • Max: {a.maxScore}</p>
              
              {/* Stats Mini Preview */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-400">
                  <span>{data.grades.filter(g => g.assessmentId === a.id).length} Siswa Dinilai</span>
              </div>

              {/* Actions */}
              <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white p-1 rounded shadow-sm border md:border-transparent md:shadow-none">
                  <button 
                      onClick={(e) => handleInitEdit(a, e)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Penilaian"
                  >
                      <Edit2 size={14} />
                  </button>
                  <button 
                      onClick={(e) => handleDeleteAssessment(a.id, e)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Hapus Penilaian"
                  >
                      <Trash2 size={14} />
                  </button>
              </div>
            </div>
        ))}
        {classAssessments.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-400">Belum ada penilaian dibuat untuk kelas ini.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentManager;
