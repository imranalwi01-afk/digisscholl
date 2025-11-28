import React, { useState } from 'react';
import { AppState, AssessmentType, Student } from '../types';
import { Printer, Download, Sparkles, Loader2 } from 'lucide-react';
import { generateStudentFeedback } from '../services/geminiService';

interface ReportGeneratorProps {
  data: AppState;
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ data }) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const activeClass = data.classes.find(c => c.id === selectedClassId);
  const classStudents = data.students.filter(s => s.classId === selectedClassId);
  const selectedStudent = data.students.find(s => s.id === selectedStudentId);

  // Helper to calculate final grade
  const calculateFinalGrade = (studentId: string) => {
    // Group assessments by type
    const scoresByType: Record<string, { total: number, count: number, weight: number }> = {};
    
    // Init types
    Object.values(AssessmentType).forEach(t => {
        scoresByType[t] = { total: 0, count: 0, weight: 0 };
    });

    // Sum scores
    data.assessments.forEach(ass => {
        if (ass.classId !== selectedClassId) return;
        const grade = data.grades.find(g => g.assessmentId === ass.id && g.studentId === studentId);
        if (grade) {
            scoresByType[ass.type].total += grade.score;
            scoresByType[ass.type].count += 1;
            scoresByType[ass.type].weight = ass.weight; // Simplified: assuming same weight per type or taking last
        }
    });

    let weightedSum = 0;
    let totalWeight = 0;

    Object.values(AssessmentType).forEach(t => {
        const group = scoresByType[t];
        if (group.count > 0) {
            const average = group.total / group.count;
            // In a real app, weight logic is complex. Here we sum configured weights of assessments present
            // For simplicity in this demo, we average the type then apply a static distribution if not set
            weightedSum += average; 
            totalWeight += 1; 
        }
    });

    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : 0;
  };

  const getStudentDetails = (studentId: string) => {
      // Get detailed breakdown
      return Object.values(AssessmentType).map(type => {
          const typeAssessments = data.assessments.filter(a => a.type === type && a.classId === selectedClassId);
          const typeGrades = typeAssessments.map(a => {
             const g = data.grades.find(gr => gr.assessmentId === a.id && gr.studentId === studentId);
             return g ? g.score : 0;
          });
          const avg = typeGrades.length ? (typeGrades.reduce((a,b) => a+b, 0) / typeGrades.length).toFixed(0) : '-';
          return { type, avg };
      });
  };

  const handlePrint = () => {
    window.print();
  };

  const generateFeedback = async () => {
      if(!selectedStudent) return;
      setIsLoadingAi(true);
      const details = getStudentDetails(selectedStudent.id);
      // Weak types (score < KKM)
      const weaknesses = details.filter(d => d.avg !== '-' && parseInt(d.avg) < data.settings.kkm).map(d => d.type);
      const strengths = details.filter(d => d.avg !== '-' && parseInt(d.avg) >= 85).map(d => d.type);
      const avg = calculateFinalGrade(selectedStudent.id);

      const feedback = await generateStudentFeedback(selectedStudent.name, Number(avg), strengths, weaknesses);
      setAiFeedback(feedback);
      setIsLoadingAi(false);
  }

  if (!selectedClassId) {
      return (
          <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Pilih Kelas untuk Laporan</h2>
              <div className="flex flex-wrap gap-4">
                  {data.classes.map(c => (
                      <button key={c.id} onClick={() => setSelectedClassId(c.id)} className="bg-white px-6 py-4 rounded-xl shadow-sm border hover:border-blue-500">
                          {c.name}
                      </button>
                  ))}
              </div>
          </div>
      )
  }

  // List View
  if (!selectedStudentId) {
      return (
          <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Laporan Kelas {activeClass?.name}</h2>
                <button onClick={() => setSelectedClassId('')} className="text-gray-500 hover:text-gray-800">Ganti Kelas</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                          <tr>
                              <th className="px-6 py-3 w-16 text-left">Foto</th>
                              <th className="px-6 py-3 text-left">Nama</th>
                              <th className="px-6 py-3 text-left">NIS</th>
                              <th className="px-6 py-3 text-left">Nilai Akhir</th>
                              <th className="px-6 py-3 text-right">Aksi</th>
                          </tr>
                      </thead>
                      <tbody>
                          {classStudents.map(s => (
                              <tr key={s.id} className="border-b hover:bg-gray-50">
                                  <td className="px-6 py-3">
                                      <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-300">
                                          {s.photoUrl ? (
                                              <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                          ) : (
                                              <span className="text-xs font-bold text-gray-500">{s.name.charAt(0)}</span>
                                          )}
                                      </div>
                                  </td>
                                  <td className="px-6 py-3 font-medium">{s.name}</td>
                                  <td className="px-6 py-3 text-gray-500">{s.nis}</td>
                                  <td className="px-6 py-3 font-bold text-blue-600">{calculateFinalGrade(s.id)}</td>
                                  <td className="px-6 py-3 text-right">
                                      <button onClick={() => setSelectedStudentId(s.id)} className="text-blue-600 hover:underline text-sm">
                                          Lihat Rapor
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
          </div>
      )
  }

  // Detail/Print View
  const breakdown = getStudentDetails(selectedStudentId);

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
        {/* Controls - Hidden on Print */}
        <div className="mb-6 flex justify-between items-center no-print">
            <button onClick={() => setSelectedStudentId(null)} className="text-gray-600 hover:text-gray-900">
                &larr; Kembali ke Daftar
            </button>
            <div className="flex gap-3">
                <button onClick={handlePrint} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900">
                    <Printer size={18} /> Cetak / PDF
                </button>
            </div>
        </div>

        {/* Report Card Paper */}
        <div className="bg-white shadow-lg p-10 border border-gray-200 min-h-[1000px] print:shadow-none print:border-0 print:p-0 relative">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-6 mb-8 text-center relative">
                <h1 className="text-2xl font-bold uppercase tracking-wider">{data.settings.schoolName}</h1>
                <p className="text-gray-500 text-sm mt-1">Laporan Capaian Hasil Belajar Siswa</p>
                <p className="text-gray-500 text-sm">Tahun Ajaran {activeClass?.year}</p>
                
                {/* School Logo Placeholder (Absolute Left) */}
                <div className="absolute left-0 top-0 hidden md:block print:block">
                   <div className="w-20 h-20 bg-gray-200 flex items-center justify-center rounded-lg">
                       <span className="text-xs text-gray-400">Logo</span>
                   </div>
                </div>
            </div>

            {/* Student Info & Photo */}
            <div className="flex justify-between items-start mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm w-full pr-4">
                    <div className="w-full">
                        <div className="grid grid-cols-3 py-1">
                            <span className="text-gray-500">Nama Peserta Didik</span>
                            <span className="col-span-2 font-semibold">: {selectedStudent?.name}</span>
                        </div>
                        <div className="grid grid-cols-3 py-1">
                            <span className="text-gray-500">NIS / NISN</span>
                            <span className="col-span-2 font-semibold">: {selectedStudent?.nis}</span>
                        </div>
                    </div>
                    <div className="w-full">
                        <div className="grid grid-cols-3 py-1">
                            <span className="text-gray-500">Kelas</span>
                            <span className="col-span-2 font-semibold">: {activeClass?.name}</span>
                        </div>
                        <div className="grid grid-cols-3 py-1">
                            <span className="text-gray-500">Semester</span>
                            <span className="col-span-2 font-semibold">: Ganjil (Demo)</span>
                        </div>
                    </div>
                </div>

                {/* Student Photo */}
                <div className="flex-shrink-0">
                    <div className="w-28 h-36 border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shadow-sm">
                        {selectedStudent?.photoUrl ? (
                             <img src={selectedStudent.photoUrl} alt="Foto Siswa" className="w-full h-full object-cover" />
                        ) : (
                             <div className="text-center text-gray-400 text-xs p-2">
                                 Foto 3x4
                             </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Grades Table */}
            <div className="mb-8">
                <h3 className="font-bold text-gray-800 mb-3 border-l-4 border-blue-600 pl-3">A. Nilai Akademik & Sikap</h3>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-3 text-left">Aspek Penilaian</th>
                            <th className="border border-gray-300 p-3 text-center w-24">KKM</th>
                            <th className="border border-gray-300 p-3 text-center w-24">Nilai</th>
                            <th className="border border-gray-300 p-3 text-left">Predikat</th>
                        </tr>
                    </thead>
                    <tbody>
                        {breakdown.map((item, idx) => {
                            const val = item.avg !== '-' ? parseInt(item.avg) : 0;
                            let predikat = '-';
                            if(val >= 90) predikat = 'A (Sangat Baik)';
                            else if(val >= 80) predikat = 'B (Baik)';
                            else if(val >= 70) predikat = 'C (Cukup)';
                            else if(val > 0) predikat = 'D (Kurang)';

                            return (
                                <tr key={idx}>
                                    <td className="border border-gray-300 p-3">{item.type}</td>
                                    <td className="border border-gray-300 p-3 text-center text-gray-500">{data.settings.kkm}</td>
                                    <td className="border border-gray-300 p-3 text-center font-bold">{item.avg}</td>
                                    <td className="border border-gray-300 p-3">{predikat}</td>
                                </tr>
                            )
                        })}
                        <tr className="bg-blue-50 font-bold">
                            <td className="border border-gray-300 p-3">RATA-RATA AKHIR</td>
                            <td className="border border-gray-300 p-3"></td>
                            <td className="border border-gray-300 p-3 text-center text-lg">{calculateFinalGrade(selectedStudent!.id)}</td>
                            <td className="border border-gray-300 p-3"></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Qualitative Feedback (AI) */}
            <div className="mb-12">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-800 border-l-4 border-yellow-500 pl-3">B. Catatan Wali Kelas</h3>
                    <button 
                        onClick={generateFeedback}
                        className="no-print flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                        disabled={isLoadingAi}
                    >
                        {isLoadingAi ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>} 
                        Buat Deskripsi Otomatis (AI)
                    </button>
                </div>
                <div className="border border-gray-300 rounded p-4 min-h-[100px] text-sm leading-relaxed relative bg-gray-50">
                    {aiFeedback ? (
                         <p>{aiFeedback}</p>
                    ) : (
                         <p className="text-gray-400 italic">Klik tombol "Buat Deskripsi Otomatis" atau tulis catatan manual di sini setelah dicetak.</p>
                    )}
                </div>
            </div>

            {/* Signature */}
            <div className="grid grid-cols-3 mt-16 text-center text-sm break-inside-avoid">
                <div>
                    <p>Mengetahui,</p>
                    <p>Orang Tua/Wali</p>
                    <br/><br/><br/>
                    <p className="border-t border-black mx-10 mt-4">( ....................... )</p>
                </div>
                <div></div>
                <div>
                    <p>Jakarta, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p>Wali Kelas</p>
                    <br/><br/><br/>
                    <p className="font-bold underline">{data.settings.teacherName}</p>
                    <p>NIP. .......................</p>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ReportGenerator;