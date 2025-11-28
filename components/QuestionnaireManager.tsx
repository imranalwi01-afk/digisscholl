
import React, { useState, useMemo } from 'react';
import { AppState, Questionnaire, Question, QuestionnaireResponse, Student } from '../types';
import { Plus, Trash2, Edit2, ArrowRight, BrainCircuit, Loader2, CheckCircle, BarChart2 } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { analyzeTalent } from '../services/geminiService';

interface QuestionnaireManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

type ViewMode = 'list' | 'create_edit' | 'fill' | 'analysis';

const QuestionnaireManager: React.FC<QuestionnaireManagerProps> = ({ data, onUpdate }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // AI States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Form States (Create/Edit)
  const [qForm, setQForm] = useState<Partial<Questionnaire>>({
    title: '', description: '', questions: []
  });
  
  // Form State (Fill)
  const [fillAnswers, setFillAnswers] = useState<Record<string, number>>({});

  const activeQuestionnaire = data.questionnaires.find(q => q.id === selectedQId);
  const classStudents = data.students.filter(s => s.classId === selectedClassId);

  // --- ACTIONS ---

  const handleInitCreate = () => {
    setQForm({ title: '', description: '', questions: [] });
    setSelectedQId(null);
    setViewMode('create_edit');
  };

  const handleInitEdit = (q: Questionnaire) => {
    setQForm({ ...q });
    setSelectedQId(q.id);
    setViewMode('create_edit');
  };

  const handleSaveQuestionnaire = () => {
    if (!qForm.title || !qForm.questions || qForm.questions.length === 0) {
      alert("Mohon isi judul dan minimal satu pertanyaan.");
      return;
    }

    const newQ: Questionnaire = {
      id: selectedQId || Date.now().toString(),
      title: qForm.title!,
      description: qForm.description || '',
      questions: qForm.questions!
    };

    const updated = selectedQId 
      ? data.questionnaires.map(q => q.id === selectedQId ? newQ : q)
      : [...data.questionnaires, newQ];

    onUpdate({ ...data, questionnaires: updated });
    setViewMode('list');
  };

  const addQuestionToForm = () => {
    setQForm(prev => ({
      ...prev,
      questions: [...(prev.questions || []), { id: Date.now().toString(), text: '', category: '' }]
    }));
  };

  const updateQuestion = (idx: number, field: keyof Question, value: string) => {
    const newQuestions = [...(qForm.questions || [])];
    newQuestions[idx] = { ...newQuestions[idx], [field]: value };
    setQForm({ ...qForm, questions: newQuestions });
  };

  const removeQuestion = (idx: number) => {
    const newQuestions = [...(qForm.questions || [])];
    newQuestions.splice(idx, 1);
    setQForm({ ...qForm, questions: newQuestions });
  };

  const handleDeleteQuestionnaire = (id: string) => {
    if (confirm("Hapus kuesioner ini? Semua respons siswa akan ikut terhapus.")) {
      onUpdate({
        ...data,
        questionnaires: data.questionnaires.filter(q => q.id !== id),
        questionnaireResponses: data.questionnaireResponses.filter(r => r.questionnaireId !== id)
      });
    }
  };

  // --- FILLING ---

  const handleInitFill = (qId: string) => {
    setSelectedQId(qId);
    setViewMode('fill');
    setSelectedClassId('');
    setSelectedStudentId(null);
    setFillAnswers({});
  };

  const handleSaveResponse = () => {
    if (!selectedQId || !selectedStudentId) return;
    
    // Check completion
    const q = data.questionnaires.find(q => q.id === selectedQId);
    if (!q) return;

    if (Object.keys(fillAnswers).length < q.questions.length) {
      alert("Mohon jawab semua pertanyaan.");
      return;
    }

    const response: QuestionnaireResponse = {
      id: `${selectedQId}_${selectedStudentId}`,
      questionnaireId: selectedQId,
      studentId: selectedStudentId,
      date: new Date().toISOString(),
      answers: fillAnswers
    };

    // Remove old response if exists
    const otherResponses = data.questionnaireResponses.filter(r => r.id !== response.id);
    onUpdate({ ...data, questionnaireResponses: [...otherResponses, response] });
    
    alert("Data berhasil disimpan!");
    setSelectedStudentId(null);
    setFillAnswers({});
  };

  // --- ANALYSIS ---

  const getStudentScores = (studentId: string, qId: string) => {
    const response = data.questionnaireResponses.find(r => r.studentId === studentId && r.questionnaireId === qId);
    const questionnaire = data.questionnaires.find(q => q.id === qId);
    
    if (!response || !questionnaire) return null;

    const scores: Record<string, number> = {};
    
    questionnaire.questions.forEach(q => {
      const val = response.answers[q.id] || 0;
      scores[q.category] = (scores[q.category] || 0) + val;
    });

    return { scores, response };
  };

  const handleRunAI = async (student: Student, q: Questionnaire) => {
    const dataObj = getStudentScores(student.id, q.id);
    if (!dataObj) return;

    setIsAnalyzing(true);
    const insight = await analyzeTalent(student.name, q.title, dataObj.scores);
    
    // Save insight to response
    const updatedResponses = data.questionnaireResponses.map(r => 
      r.id === dataObj.response.id ? { ...r, aiAnalysis: insight } : r
    );
    onUpdate({ ...data, questionnaireResponses: updatedResponses });
    setIsAnalyzing(false);
  };

  // --- RENDERING ---

  // 1. LIST MODE
  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minat & Bakat (Talent Mapping)</h1>
            <p className="text-gray-500">Kelola kuesioner untuk mengetahui potensi siswa.</p>
          </div>
          <button onClick={handleInitCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Buat Kuesioner
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.questionnaires.map(q => (
            <div key={q.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col h-full">
              <h3 className="font-bold text-lg text-gray-800 mb-2">{q.title}</h3>
              <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-3">{q.description || 'Tidak ada deskripsi'}</p>
              <div className="text-xs text-gray-400 mb-4">{q.questions.length} Pertanyaan</div>
              
              <div className="flex gap-2 pt-4 border-t border-gray-100 mt-auto">
                <button 
                  onClick={() => handleInitFill(q.id)}
                  className="flex-1 bg-green-50 text-green-700 py-2 rounded text-sm font-medium hover:bg-green-100 flex items-center justify-center gap-1"
                >
                  <Edit2 size={14}/> Input
                </button>
                <button 
                  onClick={() => { setSelectedQId(q.id); setViewMode('analysis'); }}
                  className="flex-1 bg-purple-50 text-purple-700 py-2 rounded text-sm font-medium hover:bg-purple-100 flex items-center justify-center gap-1"
                >
                  <BarChart2 size={14}/> Analisis
                </button>
                <button onClick={() => handleInitEdit(q)} className="p-2 text-gray-400 hover:bg-gray-100 rounded">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDeleteQuestionnaire(q.id)} className="p-2 text-red-400 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {data.questionnaires.length === 0 && (
             <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
               <p className="text-gray-400">Belum ada kuesioner.</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  // 2. CREATE / EDIT MODE
  if (viewMode === 'create_edit') {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-6">{selectedQId ? 'Edit Kuesioner' : 'Buat Kuesioner Baru'}</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700">Judul Kuesioner</label>
            <input type="text" className="w-full p-2 border rounded mt-1" value={qForm.title} onChange={e => setQForm({...qForm, title: e.target.value})} placeholder="Misal: Tes Gaya Belajar VAK" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
            <textarea className="w-full p-2 border rounded mt-1" rows={2} value={qForm.description} onChange={e => setQForm({...qForm, description: e.target.value})} />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Daftar Pertanyaan</h3>
            <button onClick={addQuestionToForm} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
              <Plus size={14} /> Tambah Pertanyaan
            </button>
          </div>
          
          <div className="space-y-3">
            {qForm.questions?.map((q, idx) => (
              <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded border border-gray-100">
                <span className="text-sm font-bold text-gray-400 mt-2">{idx + 1}.</span>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    className="w-full p-2 text-sm border rounded" 
                    placeholder="Tulis pertanyaan..."
                    value={q.text}
                    onChange={(e) => updateQuestion(idx, 'text', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Kategori/Dimensi:</span>
                    <input 
                      type="text" 
                      className="flex-1 p-1.5 text-xs border rounded"
                      placeholder="Misal: Visual, Logika, Introvert"
                      value={q.category}
                      onChange={(e) => updateQuestion(idx, 'category', e.target.value)}
                    />
                  </div>
                </div>
                <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {qForm.questions?.length === 0 && <p className="text-center text-gray-400 text-sm py-4">Belum ada pertanyaan.</p>}
          </div>
        </div>

        <div className="flex gap-3 border-t pt-6">
          <button onClick={handleSaveQuestionnaire} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Simpan</button>
          <button onClick={() => setViewMode('list')} className="bg-gray-100 text-gray-700 px-6 py-2 rounded hover:bg-gray-200">Batal</button>
        </div>
      </div>
    );
  }

  // 3. FILL ANSWER MODE
  if (viewMode === 'fill' && activeQuestionnaire) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-900">&larr; Kembali</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{activeQuestionnaire.title}</h1>
            <p className="text-sm text-gray-500">Input Data Siswa</p>
          </div>
        </div>

        {/* Selector */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kelas</label>
            <select 
              className="w-full p-2 border rounded"
              value={selectedClassId}
              onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId(null); }}
            >
              <option value="">-- Pilih Kelas --</option>
              {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Siswa</label>
            <select 
              className="w-full p-2 border rounded"
              value={selectedStudentId || ''}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                // Load existing answers if any
                const exist = data.questionnaireResponses.find(r => r.questionnaireId === activeQuestionnaire.id && r.studentId === e.target.value);
                setFillAnswers(exist ? exist.answers : {});
              }}
              disabled={!selectedClassId}
            >
              <option value="">-- Pilih Siswa --</option>
              {classStudents.map(s => {
                const filled = data.questionnaireResponses.some(r => r.questionnaireId === activeQuestionnaire.id && r.studentId === s.id);
                return <option key={s.id} value={s.id}>{s.name} {filled ? '✓' : ''}</option>;
              })}
            </select>
          </div>
        </div>

        {/* Questions Form */}
        {selectedStudentId && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
             <div className="space-y-6">
                {activeQuestionnaire.questions.map((q, idx) => (
                  <div key={q.id} className="pb-4 border-b border-gray-100 last:border-0">
                    <p className="font-medium text-gray-800 mb-3">{idx + 1}. {q.text}</p>
                    <div className="flex gap-4">
                      {[1, 2, 3, 4].map(score => (
                        <label key={score} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="radio" 
                            name={`q_${q.id}`}
                            className="w-4 h-4 text-blue-600"
                            checked={fillAnswers[q.id] === score}
                            onChange={() => setFillAnswers({...fillAnswers, [q.id]: score})}
                          />
                          <span className={`text-sm group-hover:text-blue-600 ${fillAnswers[q.id] === score ? 'font-bold text-blue-700' : 'text-gray-500'}`}>
                             {score === 1 ? 'Kurang' : score === 2 ? 'Cukup' : score === 3 ? 'Baik' : 'Sangat Baik'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
             <div className="mt-8 pt-6 border-t flex justify-end">
                <button onClick={handleSaveResponse} className="bg-blue-600 text-white px-8 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                  Simpan Jawaban
                </button>
             </div>
          </div>
        )}
      </div>
    );
  }

  // 4. ANALYSIS MODE
  if (viewMode === 'analysis' && activeQuestionnaire) {
    const activeResponse = selectedStudentId 
      ? data.questionnaireResponses.find(r => r.studentId === selectedStudentId && r.questionnaireId === selectedQId)
      : null;
    
    // Calculate data for chart
    let chartData: {subject: string, A: number, fullMark: number}[] = [];
    if (activeResponse) {
      const scores: Record<string, number> = {};
      const maxScores: Record<string, number> = {};
      
      activeQuestionnaire.questions.forEach(q => {
        scores[q.category] = (scores[q.category] || 0) + (activeResponse.answers[q.id] || 0);
        maxScores[q.category] = (maxScores[q.category] || 0) + 4; // Max score per question is 4
      });

      chartData = Object.keys(scores).map(cat => ({
        subject: cat,
        A: (scores[cat] / maxScores[cat]) * 100, // Normalized to 100
        fullMark: 100
      }));
    }

    return (
      <div className="h-full flex flex-col">
         <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setViewMode('list')} className="text-gray-500 hover:text-gray-900">&larr; Kembali</button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Analisis Hasil: {activeQuestionnaire.title}</h1>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full overflow-hidden">
            {/* Sidebar List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden h-full">
               <div className="p-4 border-b">
                 <select 
                    className="w-full p-2 border rounded mb-2"
                    value={selectedClassId}
                    onChange={(e) => { setSelectedClassId(e.target.value); setSelectedStudentId(null); }}
                 >
                    <option value="">-- Pilih Kelas --</option>
                    {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
               </div>
               <div className="flex-1 overflow-y-auto">
                 {classStudents.map(s => {
                    const hasData = data.questionnaireResponses.some(r => r.studentId === s.id && r.questionnaireId === selectedQId);
                    return (
                      <button 
                        key={s.id}
                        disabled={!hasData}
                        onClick={() => setSelectedStudentId(s.id)}
                        className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex justify-between items-center transition-colors ${selectedStudentId === s.id ? 'bg-blue-50 text-blue-700' : ''}`}
                      >
                         <span className={!hasData ? 'text-gray-400' : ''}>{s.name}</span>
                         {hasData ? <CheckCircle size={16} className="text-green-500"/> : <span className="text-xs text-gray-300">Belum</span>}
                      </button>
                    )
                 })}
               </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto">
               {selectedStudentId && activeResponse ? (
                 <>
                   {/* Chart Section */}
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <h3 className="font-bold text-gray-800 mb-4 text-center">Peta Potensi Siswa</h3>
                      <div className="h-80 w-full flex justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name="Potensi" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Tooltip />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   {/* AI Insight Section */}
                   <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2 text-purple-800 font-bold">
                           <BrainCircuit size={20} /> Analisis AI & Strategi Belajar
                        </div>
                        <button 
                          onClick={() => {
                             const s = data.students.find(st => st.id === selectedStudentId);
                             if(s) handleRunAI(s, activeQuestionnaire);
                          }}
                          disabled={isAnalyzing}
                          className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                        >
                           {isAnalyzing ? <Loader2 className="animate-spin" size={14}/> : 'Generate Analisis'}
                        </button>
                      </div>
                      
                      <div className="prose prose-sm max-w-none p-4 bg-purple-50 rounded-lg border border-purple-100 text-gray-700 whitespace-pre-wrap">
                        {activeResponse.aiAnalysis ? activeResponse.aiAnalysis : 'Klik tombol "Generate Analisis" untuk mendapatkan wawasan mendalam tentang bakat dan strategi belajar siswa ini.'}
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border-2 border-dashed">
                    <p>Pilih siswa yang sudah mengisi kuesioner untuk melihat hasil.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    );
  }

  return null;
};

export default QuestionnaireManager;
