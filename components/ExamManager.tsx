
import React, { useState } from 'react';
import { AppState, ExamPackage, ExamQuestion, ExamQuestionType } from '../types';
import { Plus, Trash2, Edit2, CheckCircle, Circle, Save, BrainCircuit, Loader2, ArrowLeft, Printer } from 'lucide-react';
import { generateExamQuestions } from '../services/geminiService';

interface ExamManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

const ExamManager: React.FC<ExamManagerProps> = ({ data, onUpdate }) => {
  const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  
  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ topic: '', count: 5, level: 'SMA Kelas 10', type: 'MULTIPLE_CHOICE' as ExamQuestionType });
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [examForm, setExamForm] = useState<Partial<ExamPackage>>({
    title: '', subject: '', gradeLevel: 10, questions: []
  });

  // Current Question being added/edited
  const [qEdit, setQEdit] = useState<Partial<ExamQuestion>>({
    type: 'MULTIPLE_CHOICE', text: '', points: 10, options: []
  });
  const [qEditIdx, setQEditIdx] = useState<number | null>(null); // null means adding new

  // --- ACTIONS ---

  const handleInitCreate = () => {
    setExamForm({ title: '', subject: '', gradeLevel: 10, questions: [] });
    setSelectedExamId(null);
    setViewMode('editor');
  };

  const handleInitEdit = (exam: ExamPackage) => {
    setExamForm({ ...exam });
    setSelectedExamId(exam.id);
    setViewMode('editor');
  };

  const handleSaveExam = () => {
    if (!examForm.title || !examForm.subject) {
      alert("Mohon lengkapi Judul dan Mata Pelajaran.");
      return;
    }

    const newExam: ExamPackage = {
      id: selectedExamId || Date.now().toString(),
      title: examForm.title!,
      subject: examForm.subject!,
      gradeLevel: examForm.gradeLevel || 10,
      questions: examForm.questions || [],
      createdDate: new Date().toISOString()
    };

    const updated = selectedExamId 
      ? data.examPackages.map(e => e.id === selectedExamId ? newExam : e)
      : [...data.examPackages, newExam];

    onUpdate({ ...data, examPackages: updated });
    setViewMode('list');
  };

  const handleDeleteExam = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(confirm("Hapus paket soal ini?")) {
      onUpdate({ ...data, examPackages: data.examPackages.filter(ex => ex.id !== id) });
    }
  };

  // --- QUESTION EDITOR ACTIONS ---

  const initQuestionForm = () => {
    setQEdit({ type: 'MULTIPLE_CHOICE', text: '', points: 10, options: [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false }
    ], answerKey: '' });
    setQEditIdx(null);
  };

  const handleAddQuestion = () => {
    if (!qEdit.text) return;

    // Validation
    if (qEdit.type === 'MULTIPLE_CHOICE') {
      if (!qEdit.options || qEdit.options.length < 2) {
        alert("Pilihan ganda minimal 2 opsi.");
        return;
      }
      if (!qEdit.options.some(o => o.isCorrect)) {
        alert("Tandai satu jawaban yang benar.");
        return;
      }
    }

    const newQ = {
      ...qEdit,
      id: qEdit.id || Date.now().toString()
    } as ExamQuestion;

    const currentQuestions = [...(examForm.questions || [])];

    if (qEditIdx !== null) {
      currentQuestions[qEditIdx] = newQ;
    } else {
      currentQuestions.push(newQ);
    }

    setExamForm({ ...examForm, questions: currentQuestions });
    initQuestionForm();
  };

  const handleEditQuestion = (idx: number) => {
    setQEdit({ ...examForm.questions![idx] });
    setQEditIdx(idx);
  };

  const handleDeleteQuestion = (idx: number) => {
    const currentQuestions = [...(examForm.questions || [])];
    currentQuestions.splice(idx, 1);
    setExamForm({ ...examForm, questions: currentQuestions });
  };

  const handleOptionChange = (optIdx: number, val: string) => {
    const opts = [...(qEdit.options || [])];
    opts[optIdx].text = val;
    setQEdit({ ...qEdit, options: opts });
  };

  const handleSetCorrect = (optIdx: number) => {
    const opts = [...(qEdit.options || [])];
    opts.forEach((o, i) => o.isCorrect = i === optIdx);
    setQEdit({ ...qEdit, options: opts });
  };

  const addOption = () => {
    setQEdit({
      ...qEdit,
      options: [...(qEdit.options || []), { id: Date.now().toString(), text: '', isCorrect: false }]
    });
  };

  // --- AI GENERATION ---

  const handleGenerateAI = async () => {
    if (!aiPrompt.topic) return;
    setIsGenerating(true);
    try {
      const generated = await generateExamQuestions(
        aiPrompt.topic, 
        aiPrompt.level, 
        aiPrompt.count, 
        aiPrompt.type === 'MULTIPLE_CHOICE' ? 'MULTIPLE_CHOICE' : 'ESSAY'
      );
      
      setExamForm(prev => ({
        ...prev,
        questions: [...(prev.questions || []), ...generated]
      }));
      setShowAiModal(false);
    } catch (e) {
      alert("Gagal membuat soal. Pastikan API Key valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- RENDER ---

  if (viewMode === 'list') {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bank Soal & Ujian</h1>
            <p className="text-gray-500">Buat dan kelola paket soal untuk ujian.</p>
          </div>
          <button onClick={handleInitCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Buat Paket Soal
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.examPackages?.map(exam => (
            <div key={exam.id} onClick={() => handleInitEdit(exam)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition group relative">
              <div className="flex justify-between items-start mb-2">
                 <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">Kelas {exam.gradeLevel}</span>
                 <span className="text-xs text-gray-400">{new Date(exam.createdDate).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{exam.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{exam.subject} • {exam.questions.length} Soal</p>
              
              <button 
                  onClick={(e) => handleDeleteExam(exam.id, e)}
                  className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition"
              >
                  <Trash2 size={16} />
              </button>
            </div>
          ))}
          {(!data.examPackages || data.examPackages.length === 0) && (
             <div className="col-span-full text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
               <p className="text-gray-400">Belum ada paket soal dibuat.</p>
             </div>
          )}
        </div>
      </div>
    );
  }

  // EDITOR MODE
  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-4">
           <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20}/></button>
           <h2 className="text-xl font-bold">{selectedExamId ? 'Edit Paket Soal' : 'Paket Soal Baru'}</h2>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => setShowAiModal(true)}
             className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 border border-purple-200"
           >
             <BrainCircuit size={18}/> Generate AI
           </button>
           <button onClick={handleSaveExam} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
             <Save size={18}/> Simpan Paket
           </button>
        </div>
      </div>

      <div className="flex gap-6 h-full overflow-hidden">
        {/* Left: Exam Info & Question List */}
        <div className="w-1/3 flex flex-col gap-4 overflow-hidden">
           <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Judul Paket</label>
                 <input type="text" className="w-full p-2 text-sm border rounded" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} placeholder="Misal: UH 1 Biologi" />
              </div>
              <div className="flex gap-2">
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Mapel</label>
                    <input type="text" className="w-full p-2 text-sm border rounded" value={examForm.subject} onChange={e => setExamForm({...examForm, subject: e.target.value})} />
                 </div>
                 <div className="w-20">
                    <label className="text-xs font-bold text-gray-500 uppercase">Kelas</label>
                    <input type="number" className="w-full p-2 text-sm border rounded" value={examForm.gradeLevel} onChange={e => setExamForm({...examForm, gradeLevel: parseInt(e.target.value)})} />
                 </div>
              </div>
           </div>

           <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-3 bg-gray-50 border-b flex justify-between items-center">
                 <span className="font-bold text-gray-700 text-sm">Daftar Soal ({examForm.questions?.length})</span>
                 <button onClick={initQuestionForm} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">+ Baru</button>
              </div>
              <div className="overflow-y-auto p-2 space-y-2 flex-1">
                 {examForm.questions?.map((q, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleEditQuestion(idx)}
                      className={`p-3 rounded border text-sm cursor-pointer hover:bg-gray-50 relative group ${qEditIdx === idx ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 bg-white'}`}
                    >
                       <div className="flex justify-between mb-1">
                          <span className={`text-[10px] font-bold px-1.5 rounded ${q.type === 'MULTIPLE_CHOICE' ? 'bg-green-100 text-green-700' : q.type === 'ESSAY' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                            {q.type === 'MULTIPLE_CHOICE' ? 'PG' : q.type === 'ESSAY' ? 'ESSAY' : 'B/S'}
                          </span>
                          <span className="text-[10px] text-gray-500">{q.points} Poin</span>
                       </div>
                       <p className="line-clamp-2 text-gray-800">{q.text}</p>
                       <button onClick={(e) => {e.stopPropagation(); handleDeleteQuestion(idx);}} className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100">
                          <Trash2 size={14}/>
                       </button>
                    </div>
                 ))}
                 {examForm.questions?.length === 0 && <p className="text-center text-gray-400 text-xs py-4">Belum ada soal.</p>}
              </div>
           </div>
        </div>

        {/* Right: Question Editor */}
        <div className="w-2/3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 overflow-y-auto">
            <h3 className="font-bold text-lg text-gray-800 mb-4 border-b pb-2">{qEditIdx !== null ? `Edit Soal #${qEditIdx + 1}` : 'Tambah Soal Baru'}</h3>
            
            <div className="space-y-4">
               <div className="flex gap-4">
                  <div className="w-1/3">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Soal</label>
                     <select 
                        className="w-full p-2 border rounded"
                        value={qEdit.type}
                        onChange={(e) => setQEdit({...qEdit, type: e.target.value as ExamQuestionType})}
                     >
                        <option value="MULTIPLE_CHOICE">Pilihan Ganda</option>
                        <option value="ESSAY">Essay / Uraian</option>
                        <option value="TRUE_FALSE">Benar / Salah</option>
                     </select>
                  </div>
                  <div className="w-1/4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Poin</label>
                     <input type="number" className="w-full p-2 border rounded" value={qEdit.points} onChange={e => setQEdit({...qEdit, points: parseInt(e.target.value)})} />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                  <textarea 
                     className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                     placeholder="Tulis pertanyaan di sini..."
                     value={qEdit.text}
                     onChange={e => setQEdit({...qEdit, text: e.target.value})}
                  />
               </div>

               {/* Dynamic Inputs based on Type */}
               {qEdit.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2 mt-4">
                     <label className="block text-sm font-medium text-gray-700">Opsi Jawaban (Klik lingkaran untuk set jawaban benar)</label>
                     {qEdit.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                           <button onClick={() => handleSetCorrect(i)} className={`p-1 rounded-full ${opt.isCorrect ? 'text-green-600' : 'text-gray-300 hover:text-gray-400'}`}>
                              {opt.isCorrect ? <CheckCircle size={24}/> : <Circle size={24}/>}
                           </button>
                           <input 
                              type="text" 
                              className={`flex-1 p-2 border rounded text-sm ${opt.isCorrect ? 'bg-green-50 border-green-300' : ''}`}
                              placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                              value={opt.text}
                              onChange={e => handleOptionChange(i, e.target.value)}
                           />
                           <button onClick={() => {
                              const newOpts = [...qEdit.options!];
                              newOpts.splice(i, 1);
                              setQEdit({...qEdit, options: newOpts});
                           }} className="text-red-300 hover:text-red-500"><Trash2 size={18}/></button>
                        </div>
                     ))}
                     <button onClick={addOption} className="text-sm text-blue-600 hover:underline mt-2 flex items-center gap-1">
                        <Plus size={14}/> Tambah Opsi
                     </button>
                  </div>
               )}

               {qEdit.type === 'TRUE_FALSE' && (
                  <div className="flex gap-6 mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                           type="radio" 
                           name="tf_answer" 
                           checked={qEdit.correctAnswer === true} 
                           onChange={() => setQEdit({...qEdit, correctAnswer: true})}
                           className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-green-700">BENAR</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                           type="radio" 
                           name="tf_answer" 
                           checked={qEdit.correctAnswer === false} 
                           onChange={() => setQEdit({...qEdit, correctAnswer: false})}
                           className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium text-red-700">SALAH</span>
                     </label>
                  </div>
               )}

               {qEdit.type === 'ESSAY' && (
                  <div className="mt-4">
                     <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban / Kata Kunci (Opsional)</label>
                     <textarea 
                        className="w-full p-3 border rounded bg-yellow-50 focus:ring-2 focus:ring-yellow-200"
                        rows={3}
                        placeholder="Jawaban yang diharapkan..."
                        value={qEdit.answerKey || ''}
                        onChange={e => setQEdit({...qEdit, answerKey: e.target.value})}
                     />
                  </div>
               )}

               <div className="pt-6 mt-6 border-t flex justify-end">
                  <button onClick={handleAddQuestion} className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 font-medium">
                     {qEditIdx !== null ? 'Update Soal' : 'Tambahkan Soal'}
                  </button>
               </div>
            </div>
        </div>
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
               <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2"><BrainCircuit className="text-purple-600"/> Generate Soal AI</h3>
               
               <div className="space-y-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700">Topik / Materi</label>
                     <input type="text" className="w-full p-2 border rounded mt-1" placeholder="Cth: Fotosintesis, Perang Dunia II" value={aiPrompt.topic} onChange={e => setAiPrompt({...aiPrompt, topic: e.target.value})} />
                  </div>
                  <div className="flex gap-3">
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Jlh Soal</label>
                        <input type="number" min="1" max="10" className="w-full p-2 border rounded mt-1" value={aiPrompt.count} onChange={e => setAiPrompt({...aiPrompt, count: parseInt(e.target.value)})} />
                     </div>
                     <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700">Tipe</label>
                        <select className="w-full p-2 border rounded mt-1" value={aiPrompt.type} onChange={e => setAiPrompt({...aiPrompt, type: e.target.value as any})}>
                           <option value="MULTIPLE_CHOICE">Pil-Gan</option>
                           <option value="ESSAY">Essay</option>
                        </select>
                     </div>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Tingkat Sekolah</label>
                      <input type="text" className="w-full p-2 border rounded mt-1" value={aiPrompt.level} onChange={e => setAiPrompt({...aiPrompt, level: e.target.value})} />
                  </div>
               </div>

               <div className="mt-6 flex gap-3">
                  <button onClick={handleGenerateAI} disabled={isGenerating} className="flex-1 bg-purple-600 text-white py-2 rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                     {isGenerating ? <Loader2 className="animate-spin" size={18}/> : 'Buat Soal'}
                  </button>
                  <button onClick={() => setShowAiModal(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Batal</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default ExamManager;
