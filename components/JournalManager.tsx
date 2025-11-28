
import React, { useState } from 'react';
import { AppState, AttendanceStatus, TeachingJournal } from '../types';
import { Plus, Calendar, Clock, Book, UserCheck, Trash2, Edit2, ChevronDown, ChevronUp, Printer } from 'lucide-react';

interface JournalManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

const JournalManager: React.FC<JournalManagerProps> = ({ data, onUpdate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [expandedJournalId, setExpandedJournalId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<TeachingJournal>>({
    date: new Date().toISOString().split('T')[0],
    timeStart: '07:00',
    timeEnd: '08:30',
    subject: '',
    topic: '',
    activity: '',
    notes: '',
    attendance: []
  });

  const studentsInClass = data.students.filter(s => s.classId === form.classId);

  const handleInitCreate = () => {
    setIsCreating(true);
    setForm({
        date: new Date().toISOString().split('T')[0],
        timeStart: '07:00',
        timeEnd: '08:30',
        subject: '',
        topic: '',
        activity: '',
        notes: '',
        classId: data.classes[0]?.id || '',
        attendance: []
    });
  };

  const handleClassChange = (classId: string) => {
      // Reset attendance when class changes
      const students = data.students.filter(s => s.classId === classId);
      const initialAttendance = students.map(s => ({
          studentId: s.id,
          status: 'H' as AttendanceStatus
      }));
      setForm({ ...form, classId, attendance: initialAttendance });
  };

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
      const newAttendance = form.attendance?.map(a => 
          a.studentId === studentId ? { ...a, status } : a
      );
      setForm({ ...form, attendance: newAttendance });
  };

  const handleSave = () => {
      if (!form.classId || !form.subject || !form.topic) {
          alert("Mohon lengkapi Kelas, Mata Pelajaran, dan Materi.");
          return;
      }

      // Ensure all students have an attendance record (handle new students added after init)
      const currentStudents = data.students.filter(s => s.classId === form.classId);
      const finalAttendance = currentStudents.map(s => {
          const existing = form.attendance?.find(a => a.studentId === s.id);
          return existing || { studentId: s.id, status: 'H' as AttendanceStatus };
      });

      const newJournal: TeachingJournal = {
          id: form.id || Date.now().toString(),
          classId: form.classId,
          date: form.date!,
          timeStart: form.timeStart!,
          timeEnd: form.timeEnd!,
          subject: form.subject!,
          topic: form.topic!,
          activity: form.activity || '',
          notes: form.notes || '',
          attendance: finalAttendance
      };

      const updatedJournals = form.id 
          ? data.journals.map(j => j.id === form.id ? newJournal : j)
          : [newJournal, ...data.journals];

      onUpdate({ ...data, journals: updatedJournals });
      setIsCreating(false);
  };

  const handleDelete = (id: string) => {
      if(confirm('Hapus jurnal ini?')) {
          onUpdate({ ...data, journals: data.journals.filter(j => j.id !== id) });
      }
  };

  const handleEdit = (journal: TeachingJournal) => {
      setForm(journal);
      setIsCreating(true);
  };

  const getClassName = (id: string) => data.classes.find(c => c.id === id)?.name || 'Unknown Class';
  const getStudentName = (id: string) => data.students.find(s => s.id === id)?.name || 'Unknown Student';

  // Filter View
  const filteredJournals = selectedClassId 
      ? data.journals.filter(j => j.classId === selectedClassId)
      : data.journals;

  if (isCreating) {
      return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-4xl mx-auto animate-fade-in">
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <h2 className="text-xl font-bold text-gray-800">
                      {form.id ? 'Edit Jurnal Mengajar' : 'Buat Jurnal Baru'}
                  </h2>
                  <button onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-gray-800">
                      &times; Tutup
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                          <select 
                              className="w-full p-2 border rounded-lg bg-gray-50"
                              value={form.classId}
                              onChange={(e) => handleClassChange(e.target.value)}
                              disabled={!!form.id} // Disable changing class on edit to prevent data mismatch
                          >
                              <option value="">-- Pilih Kelas --</option>
                              {data.classes.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded-lg"
                                value={form.date}
                                onChange={(e) => setForm({...form, date: e.target.value})}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mulai</label>
                                <input type="time" className="w-full p-2 border rounded-lg" value={form.timeStart} onChange={e => setForm({...form, timeStart: e.target.value})} />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Selesai</label>
                                <input type="time" className="w-full p-2 border rounded-lg" value={form.timeEnd} onChange={e => setForm({...form, timeEnd: e.target.value})} />
                            </div>
                        </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                          <input 
                              type="text" 
                              className="w-full p-2 border rounded-lg"
                              placeholder="Misal: Matematika Wajib"
                              value={form.subject}
                              onChange={(e) => setForm({...form, subject: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Materi Pokok / KD</label>
                          <textarea 
                              className="w-full p-2 border rounded-lg"
                              rows={2}
                              placeholder="Topik yang dibahas hari ini..."
                              value={form.topic}
                              onChange={(e) => setForm({...form, topic: e.target.value})}
                          />
                      </div>
                  </div>

                  {/* Activity & Reflection */}
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Kegiatan Pembelajaran</label>
                          <textarea 
                              className="w-full p-2 border rounded-lg"
                              rows={4}
                              placeholder="Deskripsi singkat metode atau aktivitas (Ceramah, Diskusi Kelompok, Praktikum...)"
                              value={form.activity}
                              onChange={(e) => setForm({...form, activity: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Kejadian Khusus / Refleksi</label>
                          <textarea 
                              className="w-full p-2 border rounded-lg"
                              rows={3}
                              placeholder="Kendala teknis, siswa bermasalah, atau catatan untuk pertemuan selanjutnya..."
                              value={form.notes}
                              onChange={(e) => setForm({...form, notes: e.target.value})}
                          />
                      </div>
                  </div>
              </div>

              {/* Attendance Section */}
              {form.classId && (
                  <div className="border-t pt-6">
                      <div className="flex items-center gap-2 mb-4">
                          <UserCheck className="text-blue-600" />
                          <h3 className="font-bold text-gray-800">Presensi Siswa</h3>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">Default: Hadir (H)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                          {studentsInClass.map(s => {
                              const status = form.attendance?.find(a => a.studentId === s.id)?.status || 'H';
                              return (
                                  <div key={s.id} className="bg-white p-3 rounded shadow-sm flex justify-between items-center">
                                      <span className="text-sm font-medium truncate w-32">{s.name}</span>
                                      <div className="flex gap-1">
                                          {(['H', 'S', 'I', 'A'] as AttendanceStatus[]).map((opt) => (
                                              <button
                                                  key={opt}
                                                  onClick={() => handleAttendanceChange(s.id, opt)}
                                                  className={`
                                                      w-7 h-7 rounded text-xs font-bold transition-colors
                                                      ${status === opt 
                                                          ? opt === 'H' ? 'bg-green-600 text-white' 
                                                          : opt === 'S' ? 'bg-blue-500 text-white'
                                                          : opt === 'I' ? 'bg-yellow-500 text-white'
                                                          : 'bg-red-600 text-white'
                                                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                                      }
                                                  `}
                                                  title={opt === 'H' ? 'Hadir' : opt === 'S' ? 'Sakit' : opt === 'I' ? 'Izin' : 'Alpha'}
                                              >
                                                  {opt}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              )}

              <div className="flex gap-3 mt-8 pt-4 border-t">
                  <button onClick={handleSave} className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium">
                      Simpan Jurnal
                  </button>
                  <button onClick={() => setIsCreating(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg hover:bg-gray-200 font-medium">
                      Batal
                  </button>
              </div>
          </div>
      )
  }

  // LIST VIEW
  return (
      <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h1 className="text-2xl font-bold text-gray-900">Jurnal Mengajar</h1>
                  <p className="text-gray-500">Rekam jejak aktivitas pembelajaran dan kehadiran siswa.</p>
              </div>
              <div className="flex gap-2">
                  <select 
                      className="border rounded-lg px-3 py-2 text-sm bg-white"
                      value={selectedClassId}
                      onChange={(e) => setSelectedClassId(e.target.value)}
                  >
                      <option value="">Semua Kelas</option>
                      {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                      onClick={handleInitCreate}
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                      <Plus size={18} /> Tulis Jurnal
                  </button>
              </div>
          </div>

          <div className="grid gap-4">
              {filteredJournals.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                      <Book className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium text-gray-900">Belum ada jurnal</h3>
                      <p className="text-gray-500">Mulai tulis jurnal harian mengajar Anda sekarang.</p>
                  </div>
              ) : (
                  filteredJournals.map(journal => {
                      const isExpanded = expandedJournalId === journal.id;
                      const absentees = journal.attendance.filter(a => a.status !== 'H');
                      
                      return (
                          <div key={journal.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                              <div 
                                  className="p-5 cursor-pointer hover:bg-gray-50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center"
                                  onClick={() => setExpandedJournalId(isExpanded ? null : journal.id)}
                              >
                                  <div className="flex items-start gap-4">
                                      <div className="bg-blue-100 text-blue-700 p-3 rounded-lg text-center min-w-[80px]">
                                          <div className="text-xs font-bold uppercase">{new Date(journal.date).toLocaleString('id-ID', { month: 'short' })}</div>
                                          <div className="text-2xl font-bold">{new Date(journal.date).getDate()}</div>
                                      </div>
                                      <div>
                                          <h3 className="font-bold text-gray-800 text-lg">{journal.subject}</h3>
                                          <div className="flex flex-wrap gap-2 text-sm text-gray-500 mt-1">
                                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded"><Clock size={12}/> {journal.timeStart} - {journal.timeEnd}</span>
                                              <span className="flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded font-medium text-gray-700">{getClassName(journal.classId)}</span>
                                          </div>
                                          <p className="text-sm text-gray-600 mt-2 line-clamp-1">{journal.topic}</p>
                                      </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                                      <div className="text-right text-sm">
                                          {absentees.length > 0 ? (
                                              <span className="text-red-600 font-medium">{absentees.length} Siswa Tidak Hadir</span>
                                          ) : (
                                              <span className="text-green-600 font-medium">Nihil (Semua Hadir)</span>
                                          )}
                                      </div>
                                      <div className="text-gray-400">
                                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                      </div>
                                  </div>
                              </div>

                              {isExpanded && (
                                  <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/50">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                          <div>
                                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Materi & Kegiatan</h4>
                                              <p className="text-sm font-semibold text-gray-800">{journal.topic}</p>
                                              <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{journal.activity || '-'}</p>
                                              
                                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 mt-4">Catatan / Refleksi</h4>
                                              <p className="text-sm text-gray-600 italic bg-yellow-50 p-2 rounded border border-yellow-100">
                                                  {journal.notes || 'Tidak ada catatan khusus.'}
                                              </p>
                                          </div>
                                          
                                          <div>
                                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detail Kehadiran</h4>
                                              {absentees.length > 0 ? (
                                                  <ul className="space-y-1">
                                                      {absentees.map((a, idx) => (
                                                          <li key={idx} className="text-sm flex justify-between bg-white p-2 rounded border border-gray-100">
                                                              <span>{getStudentName(a.studentId)}</span>
                                                              <span className={`font-bold px-2 rounded text-xs py-0.5 ${
                                                                  a.status === 'S' ? 'bg-blue-100 text-blue-700' :
                                                                  a.status === 'I' ? 'bg-yellow-100 text-yellow-700' :
                                                                  'bg-red-100 text-red-700'
                                                              }`}>
                                                                  {a.status === 'S' ? 'Sakit' : a.status === 'I' ? 'Izin' : 'Alpha'}
                                                              </span>
                                                          </li>
                                                      ))}
                                                  </ul>
                                              ) : (
                                                  <p className="text-sm text-gray-500 flex items-center gap-2">
                                                      <UserCheck size={16} className="text-green-500"/> Semua siswa hadir.
                                                  </p>
                                              )}
                                          </div>
                                      </div>
                                      
                                      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200">
                                          <button 
                                              onClick={() => window.print()} 
                                              className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded"
                                          >
                                              <Printer size={14} /> Cetak
                                          </button>
                                          <button 
                                              onClick={() => handleEdit(journal)} 
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded"
                                          >
                                              <Edit2 size={14} /> Edit
                                          </button>
                                          <button 
                                              onClick={() => handleDelete(journal.id)} 
                                              className="flex items-center gap-1 text-xs text-red-600 hover:bg-red-100 px-3 py-1.5 rounded"
                                          >
                                              <Trash2 size={14} /> Hapus
                                          </button>
                                      </div>
                                  </div>
                              )}
                          </div>
                      );
                  })
              )}
          </div>
      </div>
  );
};

export default JournalManager;
