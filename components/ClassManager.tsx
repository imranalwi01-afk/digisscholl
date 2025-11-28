
import React, { useState } from 'react';
import { AppState, ClassGroup, Gender, Student } from '../types';
import { Plus, Trash2, Edit2, Upload, UserPlus, Users, Image as ImageIcon, X, Check, Save, Phone, MapPin, User, Mail, FileText, Calendar } from 'lucide-react';

interface ClassManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

const ClassManager: React.FC<ClassManagerProps> = ({ data, onUpdate }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  // UI States
  const [isEditingClass, setIsEditingClass] = useState<string | null>(null); // Store ID of class being edited
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  
  // Form States
  const [classForm, setClassForm] = useState({ name: '', gradeLevel: 10, year: new Date().getFullYear().toString() });
  
  const [studentForm, setStudentForm] = useState<Partial<Student>>({ 
    nis: '', 
    name: '', 
    gender: Gender.L,
    photoUrl: undefined,
    parentName: '',
    parentPhone: '',
    address: '',
    email: '',
    notes: '',
    birthDate: ''
  });

  const activeClass = data.classes.find(c => c.id === selectedClassId);
  const classStudents = data.students.filter(s => s.classId === selectedClassId);

  // --- CLASS ACTIONS ---

  const handleInitAddClass = () => {
    setClassForm({ name: '', gradeLevel: 10, year: new Date().getFullYear().toString() });
    setIsAddingClass(true);
    setIsEditingClass(null);
  };

  const handleInitEditClass = (c: ClassGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setClassForm({ name: c.name, gradeLevel: c.gradeLevel, year: c.year });
    setIsEditingClass(c.id);
    setIsAddingClass(false);
  };

  const handleSaveClass = () => {
    if (!classForm.name) return;

    if (isEditingClass) {
        // Edit existing
        const updatedClasses = data.classes.map(c => 
            c.id === isEditingClass 
            ? { ...c, ...classForm }
            : c
        );
        onUpdate({ ...data, classes: updatedClasses });
        setIsEditingClass(null);
    } else {
        // Add new
        const newClassObj: ClassGroup = {
            id: Date.now().toString(),
            name: classForm.name,
            gradeLevel: classForm.gradeLevel,
            year: classForm.year
        };
        onUpdate({ ...data, classes: [...data.classes, newClassObj] });
        setIsAddingClass(false);
    }
  };

  const handleDeleteClass = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if(confirm('PERINGATAN: Menghapus kelas akan menghapus SEMUA data siswa dan nilai di dalamnya secara permanen. Lanjutkan?')) {
          onUpdate({
              ...data,
              classes: data.classes.filter(c => c.id !== id),
              students: data.students.filter(s => s.classId !== id),
              assessments: data.assessments.filter(a => a.classId !== id),
              grades: data.grades.filter(g => {
                  const s = data.students.find(student => student.id === g.studentId);
                  return s && s.classId !== id;
              })
          });
          if(selectedClassId === id) setSelectedClassId(null);
      }
  }

  // --- STUDENT ACTIONS ---

  const handleInitAddStudent = () => {
      setStudentForm({ 
          nis: '', name: '', gender: Gender.L, photoUrl: undefined,
          parentName: '', parentPhone: '', address: '', email: '', notes: '', birthDate: ''
      });
      setEditingStudentId(null);
      setIsStudentFormOpen(true);
  };

  const handleInitEditStudent = (s: Student) => {
      setStudentForm({ ...s });
      setEditingStudentId(s.id);
      setIsStudentFormOpen(true);
  };

  const handleSaveStudent = () => {
    if (!selectedClassId || !studentForm.name || !studentForm.nis) {
        alert("Nama dan NIS wajib diisi.");
        return;
    }

    if (editingStudentId) {
        // Update Existing
        const updatedStudents = data.students.map(s => 
            s.id === editingStudentId 
            ? { ...s, ...studentForm } as Student
            : s
        );
        onUpdate({ ...data, students: updatedStudents });
    } else {
        // Create New
        const studentObj: Student = {
            id: Date.now().toString(),
            classId: selectedClassId,
            nis: studentForm.nis!,
            name: studentForm.name!,
            gender: studentForm.gender || Gender.L,
            photoUrl: studentForm.photoUrl,
            parentName: studentForm.parentName,
            parentPhone: studentForm.parentPhone,
            address: studentForm.address,
            email: studentForm.email,
            notes: studentForm.notes,
            birthDate: studentForm.birthDate
        };
        onUpdate({ ...data, students: [...data.students, studentObj] });
    }
    
    setIsStudentFormOpen(false);
    setStudentForm({ nis: '', name: '', gender: Gender.L, photoUrl: undefined });
  };

  const handleDeleteStudent = (id: string) => {
      if(confirm('Hapus siswa ini? Semua nilai siswa ini akan ikut terhapus.')) {
          onUpdate({
              ...data,
              students: data.students.filter(s => s.id !== id),
              grades: data.grades.filter(g => g.studentId !== id)
          });
      }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentForm(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCSVImport = () => {
      const input = prompt("Paste format CSV di sini: NIS,Nama,L/P");
      if(input && selectedClassId) {
          const lines = input.split('\n');
          const newStudents: Student[] = [];
          lines.forEach(line => {
              const [nis, name, genderRaw] = line.split(',');
              if(nis && name) {
                newStudents.push({
                    id: Math.random().toString(36).substr(2, 9),
                    classId: selectedClassId,
                    nis: nis.trim(),
                    name: name.trim(),
                    gender: genderRaw?.trim().toUpperCase() === 'P' ? Gender.P : Gender.L
                });
              }
          });
          onUpdate({
              ...data,
              students: [...data.students, ...newStudents]
          });
      }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
      {/* --- Class List Column --- */}
      <div className="col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="font-semibold text-gray-700">Daftar Kelas</h2>
          <button 
            onClick={handleInitAddClass} 
            className="p-1 hover:bg-blue-100 rounded text-blue-600 transition"
            title="Tambah Kelas"
          >
            <Plus size={20} />
          </button>
        </div>
        
        {/* Add/Edit Class Form */}
        {(isAddingClass || isEditingClass) && (
            <div className="p-4 bg-blue-50 border-b border-blue-100 animate-fade-in">
                <p className="text-xs font-bold text-blue-800 mb-2 uppercase">{isEditingClass ? 'Edit Kelas' : 'Tambah Kelas'}</p>
                <input 
                    type="text" 
                    placeholder="Nama Kelas (Misal: X IPA 1)" 
                    className="w-full p-2 text-sm border rounded mb-2 focus:ring-2 focus:ring-blue-400"
                    value={classForm.name}
                    onChange={(e) => setClassForm({...classForm, name: e.target.value})}
                />
                <div className="flex gap-2 mb-2">
                    <input 
                        type="number" 
                        className="w-1/3 p-2 text-sm border rounded"
                        value={classForm.gradeLevel}
                        onChange={(e) => setClassForm({...classForm, gradeLevel: parseInt(e.target.value)})}
                    />
                    <input 
                        type="text" 
                        className="w-2/3 p-2 text-sm border rounded"
                        value={classForm.year}
                        onChange={(e) => setClassForm({...classForm, year: e.target.value})}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleSaveClass} className="bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-blue-700">
                        <Check size={14} /> Simpan
                    </button>
                    <button 
                        onClick={() => { setIsAddingClass(false); setIsEditingClass(null); }} 
                        className="bg-white text-gray-600 px-3 py-1 rounded text-xs border border-gray-300 hover:bg-gray-100"
                    >
                        Batal
                    </button>
                </div>
            </div>
        )}

        {/* Class List Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {data.classes.map(c => (
            <div 
              key={c.id} 
              onClick={() => setSelectedClassId(c.id)}
              className={`
                p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-colors border
                ${selectedClassId === c.id ? 'bg-blue-50 border-blue-200' : 'bg-white hover:bg-gray-50 border-transparent'}
              `}
            >
              <div>
                <p className={`font-medium ${selectedClassId === c.id ? 'text-blue-800' : 'text-gray-800'}`}>{c.name}</p>
                <p className="text-xs text-gray-500">Tingkat {c.gradeLevel} • {c.year}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={(e) => handleInitEditClass(c, e)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit Kelas"
                >
                    <Edit2 size={14} />
                </button>
                <button 
                    onClick={(e) => handleDeleteClass(c.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded"
                    title="Hapus Kelas"
                >
                    <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {data.classes.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-10">Belum ada kelas.</p>
          )}
        </div>
      </div>

      {/* --- Student List Column --- */}
      <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {selectedClassId ? (
            <>
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="font-semibold text-gray-800">{activeClass?.name}</h2>
                        <p className="text-xs text-gray-500">{classStudents.length} Siswa Terdaftar</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleCSVImport} className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded border border-green-200">
                            <Upload size={16} /> Import CSV
                        </button>
                        <button onClick={handleInitAddStudent} className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm">
                            <UserPlus size={16} /> Tambah Siswa
                        </button>
                    </div>
                </div>

                {/* --- STUDENT MODAL FORM (NEW & IMPROVED) --- */}
                {isStudentFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <User className="text-blue-600"/> 
                                    {editingStudentId ? 'Edit Profil Siswa' : 'Tambah Siswa Baru'}
                                </h3>
                                <button onClick={() => setIsStudentFormOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-100 p-2 rounded-full">
                                    <X size={20}/>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    
                                    {/* Left Column: Photo & Primary Info */}
                                    <div className="md:col-span-1 space-y-6">
                                        <div className="flex flex-col items-center">
                                            <div className="w-36 h-48 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden mb-3 relative group shadow-inner">
                                                {studentForm.photoUrl ? (
                                                    <img src={studentForm.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="text-center text-gray-400">
                                                        <ImageIcon className="mx-auto mb-2 opacity-50" size={40} />
                                                        <span className="text-xs">Upload Foto</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center cursor-pointer">
                                                    <Upload className="text-white opacity-0 group-hover:opacity-100" size={24} />
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handlePhotoUpload} />
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 text-center">Format: JPG/PNG, Max 2MB</p>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                                            <h4 className="font-bold text-blue-800 text-sm border-b border-blue-200 pb-2 mb-2">Info Akademik</h4>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">NIS / NISN <span className="text-red-500">*</span></label>
                                                <input 
                                                    type="text" 
                                                    className="w-full p-2 mt-1 text-sm border rounded focus:ring-2 focus:ring-blue-400 bg-white" 
                                                    value={studentForm.nis} 
                                                    onChange={e => setStudentForm({...studentForm, nis: e.target.value})} 
                                                    placeholder="Nomor Induk"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 uppercase">Kelas</label>
                                                <div className="w-full p-2 mt-1 text-sm border rounded bg-gray-100 text-gray-600">
                                                    {activeClass?.name}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Details */}
                                    <div className="md:col-span-2 space-y-6">
                                        
                                        {/* Personal Info */}
                                        <section>
                                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 pb-2 border-b">
                                                <User size={18} className="text-gray-500"/> Data Pribadi
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                                    <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} placeholder="Nama Siswa" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Jenis Kelamin</label>
                                                    <select className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400" value={studentForm.gender} onChange={e => setStudentForm({...studentForm, gender: e.target.value as Gender})}>
                                                        <option value={Gender.L}>Laki-laki</option>
                                                        <option value={Gender.P}>Perempuan</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Lahir</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                                        <input type="date" className="w-full pl-10 p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-400" value={studentForm.birthDate || ''} onChange={e => setStudentForm({...studentForm, birthDate: e.target.value})} />
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Contact Info */}
                                        <section>
                                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 pb-2 border-b">
                                                <Phone size={18} className="text-gray-500"/> Kontak & Wali
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Orang Tua / Wali</label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                                        <input type="text" className="w-full pl-10 p-2.5 border rounded-lg" value={studentForm.parentName || ''} onChange={e => setStudentForm({...studentForm, parentName: e.target.value})} placeholder="Nama Ayah/Ibu"/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">No. Telepon / WA</label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                                        <input type="text" className="w-full pl-10 p-2.5 border rounded-lg" value={studentForm.parentPhone || ''} onChange={e => setStudentForm({...studentForm, parentPhone: e.target.value})} placeholder="0812..."/>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email Siswa (Opsional)</label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                                                        <input type="email" className="w-full pl-10 p-2.5 border rounded-lg" value={studentForm.email || ''} onChange={e => setStudentForm({...studentForm, email: e.target.value})} placeholder="siswa@sekolah.id"/>
                                                    </div>
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Alamat Rumah</label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-3 text-gray-400" size={16}/>
                                                        <textarea className="w-full pl-10 p-2.5 border rounded-lg" rows={2} value={studentForm.address || ''} onChange={e => setStudentForm({...studentForm, address: e.target.value})} placeholder="Alamat lengkap..."/>
                                                    </div>
                                                </div>
                                            </div>
                                        </section>

                                        {/* Notes */}
                                        <section>
                                            <h4 className="flex items-center gap-2 font-bold text-gray-800 mb-4 pb-2 border-b">
                                                <FileText size={18} className="text-gray-500"/> Catatan Tambahan
                                            </h4>
                                            <div>
                                                <textarea 
                                                    className="w-full p-3 border rounded-lg bg-yellow-50 focus:bg-white transition-colors" 
                                                    rows={3} 
                                                    value={studentForm.notes || ''} 
                                                    onChange={e => setStudentForm({...studentForm, notes: e.target.value})} 
                                                    placeholder="Catatan khusus tentang kesehatan, kebutuhan belajar, atau prestasi..."
                                                />
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3 sticky bottom-0">
                                <button onClick={() => setIsStudentFormOpen(false)} className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                                    Batal
                                </button>
                                <button onClick={handleSaveStudent} className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2 transition-colors">
                                    <Save size={18}/> Simpan Data Siswa
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-500 font-semibold border-b sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 w-16 bg-gray-50">Foto</th>
                                <th className="px-6 py-3 bg-gray-50">NIS</th>
                                <th className="px-6 py-3 bg-gray-50">Nama Siswa</th>
                                <th className="px-6 py-3 bg-gray-50">L/P</th>
                                <th className="px-6 py-3 bg-gray-50">Kontak</th>
                                <th className="px-6 py-3 text-right bg-gray-50">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {classStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-blue-50/30 group transition-colors cursor-pointer" onClick={() => handleInitEditStudent(s)}>
                                    <td className="px-6 py-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border border-gray-300">
                                            {s.photoUrl ? (
                                                <img src={s.photoUrl} alt={s.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-gray-500">{s.name.charAt(0)}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-gray-500">{s.nis}</td>
                                    <td className="px-6 py-3 font-medium text-gray-800">
                                        {s.name}
                                        {s.notes && <FileText size={12} className="inline ml-2 text-yellow-500" title="Ada catatan"/>}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.gender === Gender.L ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                                            {s.gender}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 text-xs">
                                        {s.parentPhone ? (
                                            <div className="flex items-center gap-1"><Phone size={12}/> {s.parentPhone}</div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right" onClick={e => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleInitEditStudent(s)} 
                                                className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                                                title="Edit Profil"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteStudent(s.id)} 
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-100 rounded"
                                                title="Hapus Siswa"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {classStudents.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center">
                                        <Users className="mx-auto h-12 w-12 text-gray-200 mb-3"/>
                                        <p className="text-gray-400">Belum ada data siswa di kelas ini.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                    <Users size={32} className="text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-600">Tidak Ada Kelas Dipilih</h3>
                <p className="text-sm">Pilih kelas dari daftar di sebelah kiri untuk mengelola siswa.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClassManager;
