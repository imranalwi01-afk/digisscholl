
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { AppState, AssessmentType } from '../types';
import { analyzeClassTrends } from '../services/geminiService';
import { BrainCircuit, Loader2, Users, GraduationCap, TrendingUp, AlertCircle, Calendar, MessageSquare, Clock } from 'lucide-react';

interface DashboardProps {
  data: AppState;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentDate.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(currentDate);

  // Statistics Calculation
  const stats = useMemo(() => {
    const totalStudents = data.students.length;
    const totalClasses = data.classes.length;
    
    let totalScore = 0;
    let scoreCount = 0;
    let belowKkmCount = 0;

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

    const typePerformance = Object.values(AssessmentType).map(type => {
        const assessments = data.assessments.filter(a => a.type === type).map(a => a.id);
        const grades = data.grades.filter(g => assessments.includes(g.assessmentId));
        
        const avg = grades.length > 0 
            ? grades.reduce((s, g) => s + g.score, 0) / grades.length
            : 0;
            
        return {
            name: type.split(' ')[0],
            nilai: parseFloat(avg.toFixed(1))
        };
    });

    return { classAvg, typePerformance };
  }, [data]);

  const handleGenerateInsight = async () => {
    setIsLoadingAi(true);
    const allScores = data.grades.slice(0, 100).map(g => g.score);
    const result = await analyzeClassTrends("Semua Kelas (Sampel)", allScores);
    setAiInsight(result);
    setIsLoadingAi(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="space-y-8 pb-10"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <motion.div
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100"
        variants={itemVariants}
      >
        <div>
          <div className="flex items-center gap-2 text-slate-500 mb-1 text-sm font-medium">
             <Calendar size={16} />
             <span>{formattedDate}</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            {getGreeting()}, <span className="text-blue-600">{data.settings.teacherName}</span>
          </h1>
          <p className="text-slate-500 mt-1">Selamat datang kembali di dashboard akademik DIGISS.</p>
        </div>
        <div className="flex gap-3">
            <button
                onClick={handleGenerateInsight}
                disabled={isLoadingAi}
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isLoadingAi ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />}
                {isLoadingAi ? 'Menganalisis...' : 'Analisis AI Guru'}
            </button>
        </div>
      </motion.div>

      {/* AI Insight Section */}
      {aiInsight && (
        <motion.div
            variants={itemVariants}
            className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-6 shadow-sm relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={120} className="text-indigo-500" />
            </div>
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3 text-indigo-800 font-bold text-lg">
                    <BrainCircuit size={24} />
                    <h3>Rekomendasi AI GuruPintar</h3>
                </div>
                <div className="prose prose-sm text-indigo-900 max-w-none whitespace-pre-wrap leading-relaxed bg-white/50 p-4 rounded-xl border border-indigo-100/50 backdrop-blur-sm">
                    {aiInsight}
                </div>
            </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        variants={containerVariants}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa</p>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalStudents}</h3>
            <p className="text-xs text-slate-400 mt-1">Aktif tahun ini</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
             <Users size={24} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-slate-500">Rata-rata Global</p>
            <h3 className={`text-3xl font-bold mt-1 ${parseFloat(stats.globalAverage) >= data.settings.kkm ? 'text-emerald-600' : 'text-amber-500'}`}>
                {stats.globalAverage}
            </h3>
            <p className="text-xs text-slate-400 mt-1">KKM: {data.settings.kkm}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${parseFloat(stats.globalAverage) >= data.settings.kkm ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
             <TrendingUp size={24} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
            <p className="text-sm font-medium text-slate-500">Perlu Perhatian</p>
            <h3 className="text-3xl font-bold text-rose-500 mt-1">{stats.belowKkmCount}</h3>
            <p className="text-xs text-slate-400 mt-1">Siswa di bawah KKM</p>
          </div>
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
             <AlertCircle size={24} />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow duration-300">
          <div>
             <p className="text-sm font-medium text-slate-500">Total Kelas</p>
             <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalClasses}</h3>
             <p className="text-xs text-slate-400 mt-1">Rombongan belajar</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
             <GraduationCap size={24} />
          </div>
        </motion.div>
      </motion.div>

      {/* Main Content Grid: Charts & Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left Column: Charts (Span 2) */}
        <motion.div variants={containerVariants} className="xl:col-span-2 space-y-6">

            {/* Assessment Type Trends (Area Chart) */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Tren Nilai Akademik</h3>
                        <p className="text-sm text-slate-500">Rata-rata nilai berdasarkan jenis penilaian</p>
                    </div>
                    <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                        <TrendingUp size={20} />
                    </div>
                </div>
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.typePerformance}>
                            <defs>
                                <linearGradient id="colorNilai" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#64748b', fontSize: 12}}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                tick={{fill: '#64748b', fontSize: 12}}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                cursor={{ stroke: '#8b5cf6', strokeWidth: 2, strokeDasharray: '5 5' }}
                            />
                            <Area
                                type="monotone"
                                dataKey="nilai"
                                stroke="#8b5cf6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorNilai)"
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#7c3aed' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Class Comparison (Bar Chart) */}
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-96 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Performa Kelas</h3>
                        <p className="text-sm text-slate-500">Perbandingan rata-rata nilai antar kelas</p>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <GraduationCap size={20} />
                    </div>
                </div>
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.classAvg}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: '#64748b', fontSize: 12}}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[0, 100]}
                                tick={{fill: '#64748b', fontSize: 12}}
                            />
                            <Tooltip
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                            />
                            <Bar
                                dataKey="rataRata"
                                fill="#3b82f6"
                                radius={[8, 8, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

        </motion.div>

        {/* Right Column: Recent Activity (Span 1) */}
        <motion.div variants={containerVariants} className="space-y-6">
            <motion.div variants={itemVariants} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Aktivitas Terbaru</h3>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <MessageSquare size={20} />
                    </div>
                </div>

                <div className="space-y-6">
                    {data.forumPosts.slice(0, 4).map((post) => (
                        <div key={post.id} className="relative pl-6 border-l-2 border-slate-100 last:border-0 pb-2">
                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-emerald-500 ring-4 ring-emerald-50"></div>
                             <div className="mb-1 flex items-center justify-between">
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    {post.role === 'TEACHER' ? 'Guru' : 'Siswa'}
                                </span>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    {new Date(post.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}
                                </span>
                             </div>
                             <h4 className="text-sm font-bold text-slate-800">{post.author}</h4>
                             <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {post.content}
                             </p>
                        </div>
                    ))}

                    {data.forumPosts.length === 0 && (
                        <div className="text-center py-10 text-slate-400 text-sm">
                            Belum ada aktivitas terbaru.
                        </div>
                    )}
                </div>

                <button className="w-full mt-6 py-2.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors">
                    Lihat Semua Aktivitas
                </button>
            </motion.div>
        </motion.div>

      </div>
    </motion.div>
  );
};

export default Dashboard;
