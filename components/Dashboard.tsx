
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend
} from 'recharts';
import { AppState, AssessmentType } from '../types';
import { analyzeClassTrends } from '../services/geminiService';
import { BrainCircuit, Loader2, Users, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalStudents = data.students.length;
    const totalClasses = data.classes.length;
    
    // Calculate average across all grades
    let totalScore = 0;
    let scoreCount = 0;
    let belowKkmCount = 0;

    // We need to count unique students below KKM for a more meaningful metric, 
    // or just count total failing grades. Let's do failing grades count for simplicity 
    // but distinct students is better. Let's do failing grades for now.
    data.grades.forEach(g => {
      totalScore += g.score;
      scoreCount++;
      if (g.score < data.settings.kkm) belowKkmCount++;
    });

    const globalAverage = scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : '0';
    
    return { totalStudents, totalClasses, globalAverage, belowKkmCount };
  }, [data]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    // 1. Average per class
    const classAvg = data.classes.map(c => {
      const classStudents = data.students.filter(s => s.classId === c.id).map(s => s.id);
      const classGrades = data.grades.filter(g => classStudents.includes(g.studentId));
      
      const avg = classGrades.length > 0
        ? classGrades.reduce((sum, g) => sum + g.score, 0) / classGrades.length
        : 0;
        
      return {
        name: c.name,
        rataRata: parseFloat(avg.toFixed(1))
      };
    });

    // 2. Performance by Assessment Type
    const typePerformance = Object.values(AssessmentType).map(type => {
        const assessments = data.assessments.filter(a => a.type === type).map(a => a.id);
        const grades = data.grades.filter(g => assessments.includes(g.assessmentId));
        
        const avg = grades.length > 0 
            ? grades.reduce((s, g) => s + g.score, 0) / grades.length
            : 0;
            
        return {
            name: type.split(' ')[0], // Shorten name
            nilai: parseFloat(avg.toFixed(1))
        };
    });

    return { classAvg, typePerformance };
  }, [data]);

  const handleGenerateInsight = async () => {
    setIsLoadingAi(true);
    // Collect sample scores (limit to 100 to avoid token limits)
    const allScores = data.grades.slice(0, 100).map(g => g.score);
    const result = await analyzeClassTrends("Semua Kelas (Sampel)", allScores);
    setAiInsight(result);
    setIsLoadingAi(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500">Ringkasan performa siswa dan kelas tahun ajaran ini.</p>
        </div>
        <button 
            onClick={handleGenerateInsight}
            disabled={isLoadingAi}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
            {isLoadingAi ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
            {isLoadingAi ? 'Menganalisis...' : 'Analisis AI Guru'}
        </button>
      </div>

      {/* AI Insight Section */}
      {aiInsight && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-purple-800 font-semibold">
                  <BrainCircuit size={20} />
                  <h3>Rekomendasi AI GuruPintar</h3>
              </div>
              <div className="prose prose-sm text-purple-900 max-w-none whitespace-pre-wrap leading-relaxed">
                  {aiInsight}
              </div>
          </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Total Siswa</p>
            <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalStudents}</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
             <Users size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Rata-rata Global</p>
            <p className={`text-3xl font-bold mt-2 ${parseFloat(stats.globalAverage) >= data.settings.kkm ? 'text-green-600' : 'text-yellow-600'}`}>
                {stats.globalAverage}
            </p>
            <p className="text-xs text-gray-400 mt-1">Target KKM: {data.settings.kkm}</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
             <TrendingUp size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Nilai Dibawah KKM</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{stats.belowKkmCount}</p>
            <p className="text-xs text-gray-400 mt-1">Perlu Remedial</p>
          </div>
          <div className="p-3 bg-red-50 text-red-500 rounded-lg">
             <AlertCircle size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-start justify-between">
          <div>
             <p className="text-sm font-medium text-gray-500">Total Kelas</p>
             <p className="text-3xl font-bold text-slate-800 mt-2">{stats.totalClasses}</p>
          </div>
          <div className="p-3 bg-orange-50 text-orange-500 rounded-lg">
             <GraduationCap size={24} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Comparison */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Perbandingan Rata-rata Kelas</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.classAvg}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{fill: '#6b7280'}} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{fill: '#f3f4f6'}}
                        />
                        <Bar dataKey="rataRata" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Assessment Type Performance */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Tren Nilai per Jenis Penilaian</h3>
            <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.typePerformance}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} />
                        <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{fill: '#6b7280'}} />
                        <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line type="monotone" dataKey="nilai" stroke="#10b981" strokeWidth={3} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
