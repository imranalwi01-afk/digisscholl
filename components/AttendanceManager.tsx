import React, { useState, useMemo } from 'react';
import { AppState, AttendanceStatus, DailyAttendance, AttendanceRecord } from '../types';
import { CalendarCheck, Save } from 'lucide-react';
import { ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface AttendanceManagerProps {
  data: AppState;
  onUpdate: (newData: AppState) => void;
}

type TabMode = 'input' | 'recap';

interface StatusButtonProps {
    status: AttendanceStatus;
    current: AttendanceStatus;
    onClick: () => void;
}

const StatusButton: React.FC<StatusButtonProps> = ({ status, current, onClick }) => {
    const colors = {
        'H': 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200',
        'S': 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200',
        'I': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200',
        'A': 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200',
        'T': 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200'
    };
    const activeColors = {
        'H': 'bg-green-600 text-white border-green-600',
        'S': 'bg-blue-600 text-white border-blue-600',
        'I': 'bg-yellow-500 text-white border-yellow-500',
        'A': 'bg-red-600 text-white border-red-600',
        'T': 'bg-orange-500 text-white border-orange-500'
    };
    
    const labels: Record<AttendanceStatus, string> = { 'H': 'Hadir', 'S': 'Sakit', 'I': 'Izin', 'A': 'Alpha', 'T': 'Telat' };

    return (
        <button
            onClick={onClick}
            className={`
                px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm
                ${current === status ? activeColors[status] : colors[status]}
            `}
            title={labels[status]}
        >
            {status}
        </button>
    );
};

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ data, onUpdate }) => {
  const [tabMode, setTabMode] = useState<TabMode>('input');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  
  // Input Mode States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [tempRecords, setTempRecords] = useState<Record<string, AttendanceRecord>>({});
  
  // Recap Mode States
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const classStudents = useMemo(() => {
      return data.students.filter(s => s.classId === selectedClassId).sort((a,b) => a.name.localeCompare(b.name));
  }, [data.students, selectedClassId]);

  // --- ACTIONS ---

  const handleClassChange = (classId: string) => {
      setSelectedClassId(classId);
      if (tabMode === 'input') {
          loadAttendanceForDate(classId, selectedDate);
      }
  };

  const handleDateChange = (date: string) => {
      setSelectedDate(date);
      if (selectedClassId) {
          loadAttendanceForDate(selectedClassId, date);
      }
  };

  const loadAttendanceForDate = (classId: string, date: string) => {
      const existing = data.dailyAttendance.find(d => d.classId === classId && d.date === date);
      const recordsMap: Record<string, AttendanceRecord> = {};
      
      // Load existing or default to Present
      const students = data.students.filter(s => s.classId === classId);
      students.forEach(s => {
          const record = existing?.records.find(r => r.studentId === s.id);
          recordsMap[s.id] = record || { studentId: s.id, status: 'H' as AttendanceStatus };
      });
      
      setTempRecords(recordsMap);
  };

  const updateStatus = (studentId: string, status: AttendanceStatus) => {
      setTempRecords(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], status }
      }));
  };

  const updateNote = (studentId: string, note: string) => {
      setTempRecords(prev => ({
          ...prev,
          [studentId]: { ...prev[studentId], note }
      }));
  };

  const markAll = (status: AttendanceStatus) => {
      const newRecords = { ...tempRecords };
      Object.keys(newRecords).forEach(sid => {
          newRecords[sid].status = status;
      });
      setTempRecords(newRecords);
  };

  const saveAttendance = () => {
      if (!selectedClassId) return;
      
      const recordsArray = Object.values(tempRecords) as AttendanceRecord[];
      const newEntry: DailyAttendance = {
          id: `${selectedClassId}_${selectedDate}`,
          classId: selectedClassId,
          date: selectedDate,
          records: recordsArray
      };

      // Remove existing entry for this date/class if any, then add new
      const otherEntries = data.dailyAttendance.filter(d => !(d.classId === selectedClassId && d.date === selectedDate));
      
      onUpdate({
          ...data,
          dailyAttendance: [...otherEntries, newEntry]
      });
      alert("Absensi berhasil disimpan!");
  };

  // --- RECAP LOGIC ---

  const recapData = useMemo(() => {
      if (!selectedClassId || !selectedMonth) return null;

      // Filter attendance entries for the month
      const entries = data.dailyAttendance.filter(d => 
          d.classId === selectedClassId && d.date.startsWith(selectedMonth)
      );

      const stats: Record<string, { H: number, S: number, I: number, A: number, T: number, total: number }> = {};
      
      // Initialize stats
      classStudents.forEach(s => {
          stats[s.id] = { H: 0, S: 0, I: 0, A: 0, T: 0, total: 0 };
      });

      // Aggregate
      entries.forEach(entry => {
          entry.records.forEach(rec => {
              if (stats[rec.studentId]) {
                  stats[rec.studentId][rec.status]++;
                  stats[rec.studentId].total++;
              }
          });
      });

      // Chart Data (Summary of whole class)
      let totalH = 0, totalS = 0, totalI = 0, totalA = 0, totalT = 0;
      Object.values(stats).forEach(s => {
          totalH += s.H; totalS += s.S; totalI += s.I; totalA += s.A; totalT += s.T;
      });

      const chartData = [
          { name: 'Hadir', value: totalH, color: '#22c55e' },
          { name: 'Sakit', value: totalS, color: '#3b82f6' },
          { name: 'Izin', value: totalI, color: '#eab308' },
          { name: 'Alpha', value: totalA, color: '#ef4444' },
          { name: 'Terlambat', value: totalT, color: '#f97316' },
      ].filter(d => d.value > 0);

      return { studentStats: stats, chartData, totalDays: entries.length };
  }, [data.dailyAttendance, selectedClassId, selectedMonth, classStudents]);

  // --- RENDER ---

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <CalendarCheck className="text-blue-600"/> Absensi Harian
                </h1>
                <p className="text-gray-500">Kelola kehadiran siswa (Absensi Wali Kelas/Piket).</p>
            </div>
            <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
                <button 
                    onClick={() => setTabMode('input')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tabMode === 'input' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Input Harian
                </button>
                <button 
                    onClick={() => setTabMode('recap')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tabMode === 'recap' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                    Rekap Bulanan
                </button>
            </div>
        </div>

        {/* --- INPUT MODE --- */}
        {tabMode === 'input' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Kelas</label>
                        <select 
                            className="w-full p-2 border rounded-lg"
                            value={selectedClassId}
                            onChange={(e) => handleClassChange(e.target.value)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal Absensi</label>
                        <input 
                            type="date" 
                            className="w-full p-2 border rounded-lg"
                            value={selectedDate}
                            onChange={(e) => handleDateChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end justify-end">
                        <button 
                            onClick={saveAttendance}
                            disabled={!selectedClassId}
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={18} /> Simpan Data
                        </button>
                    </div>
                </div>

                {selectedClassId ? (
                    <div className="p-0">
                         {/* Quick Actions */}
                        <div className="px-6 py-3 border-b flex items-center gap-3 text-sm bg-white sticky top-0 z-10">
                            <span className="text-gray-500">Set Semua:</span>
                            <button onClick={() => markAll('H')} className="text-green-600 hover:bg-green-50 px-2 py-1 rounded font-medium text-xs border border-green-200">Hadir Semua</button>
                            <button onClick={() => markAll('S')} className="text-blue-600 hover:bg-blue-50 px-2 py-1 rounded font-medium text-xs border border-blue-200">Sakit Semua</button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-3 w-10">No</th>
                                        <th className="px-6 py-3">Nama Siswa</th>
                                        <th className="px-6 py-3 text-center">Status Kehadiran</th>
                                        <th className="px-6 py-3">Keterangan / Catatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {classStudents.map((s, idx) => {
                                        const record = tempRecords[s.id] || { studentId: s.id, status: 'H' as AttendanceStatus };
                                        return (
                                            <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${record.status !== 'H' ? 'bg-yellow-50/30' : ''}`}>
                                                <td className="px-6 py-4 text-gray-400">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800">{s.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        {(['H', 'S', 'I', 'A', 'T'] as AttendanceStatus[]).map(status => (
                                                            <StatusButton 
                                                                key={status} 
                                                                status={status} 
                                                                current={record.status} 
                                                                onClick={() => updateStatus(s.id, status)}
                                                            />
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="text" 
                                                        className="w-full border-b border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-1 text-sm text-gray-600 placeholder-gray-300"
                                                        placeholder={record.status === 'H' ? "..." : "Tulis alasan..."}
                                                        value={record.note || ''}
                                                        onChange={(e) => updateNote(s.id, e.target.value)}
                                                    />
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-400">
                        <CalendarCheck className="mx-auto h-12 w-12 text-gray-200 mb-3" />
                        <p>Silakan pilih kelas terlebih dahulu.</p>
                    </div>
                )}
            </div>
        )}

        {/* --- RECAP MODE --- */}
        {tabMode === 'recap' && (
            <div className="space-y-6">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pilih Kelas</label>
                        <select 
                            className="w-full p-2 border rounded-lg"
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                        >
                            <option value="">-- Pilih Kelas --</option>
                            {data.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Bulan</label>
                        <input 
                            type="month" 
                            className="w-full p-2 border rounded-lg"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                </div>

                {selectedClassId && recapData ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats Chart */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 lg:col-span-1 flex flex-col items-center justify-center">
                            <h3 className="font-bold text-gray-700 mb-2 text-center">Statistik Bulan Ini</h3>
                            <p className="text-xs text-gray-500 mb-6">Total Hari Efektif: {recapData.totalDays} Hari</p>
                            
                            {recapData.chartData.length > 0 ? (
                                <div className="w-full h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={recapData.chartData}
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {recapData.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <p className="text-gray-400 text-sm">Belum ada data absensi bulan ini.</p>
                            )}
                        </div>

                        {/* Detailed Table */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-gray-700">Rekapitulasi Siswa</h3>
                                <button onClick={() => window.print()} className="text-xs flex items-center gap-1 text-gray-600 hover:bg-gray-200 px-3 py-1 rounded border">
                                    Cetak Laporan
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white text-gray-500 uppercase text-xs font-semibold border-b">
                                        <tr>
                                            <th className="px-4 py-3">Nama</th>
                                            <th className="px-4 py-3 text-center w-12 bg-green-50 text-green-700">H</th>
                                            <th className="px-4 py-3 text-center w-12 bg-blue-50 text-blue-700">S</th>
                                            <th className="px-4 py-3 text-center w-12 bg-yellow-50 text-yellow-700">I</th>
                                            <th className="px-4 py-3 text-center w-12 bg-red-50 text-red-700">A</th>
                                            <th className="px-4 py-3 text-center w-12 bg-orange-50 text-orange-700">T</th>
                                            <th className="px-4 py-3 text-center w-20">% Hadir</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {classStudents.map(s => {
                                            const stat = recapData.studentStats[s.id] || { H:0, S:0, I:0, A:0, T:0, total:0 };
                                            // Calculate percentage: (H / TotalDays) * 100. 
                                            // Note: Depending on school policy, S/I might count as 'present' or not. Here strictly H.
                                            // Usually schools count (H + T) as present.
                                            const presentCount = stat.H + stat.T;
                                            const totalDays = recapData.totalDays || 1; 
                                            const percentage = recapData.totalDays > 0 
                                                ? Math.round((presentCount / totalDays) * 100) 
                                                : 0;
                                            
                                            return (
                                                <tr key={s.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-green-600 bg-green-50/30">{stat.H}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-blue-600 bg-blue-50/30">{stat.S}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-yellow-600 bg-yellow-50/30">{stat.I}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-red-600 bg-red-50/30">{stat.A}</td>
                                                    <td className="px-4 py-3 text-center font-bold text-orange-600 bg-orange-50/30">{stat.T}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${percentage < 70 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                                            {percentage}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed">
                        <p>Pilih Kelas dan Bulan untuk melihat rekapitulasi.</p>
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default AttendanceManager;