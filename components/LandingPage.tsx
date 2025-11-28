
import React, { useState } from 'react';
import { AppState, ForumPost, ForumComment } from '../types';
import { 
  GraduationCap, 
  Users, 
  BarChart2, 
  CheckCircle, 
  MessageSquare, 
  Send, 
  Heart, 
  MessageCircle,
  LogIn,
  X,
  Loader2,
  Lock,
  User
} from 'lucide-react';

interface LandingPageProps {
  data: AppState;
  onLogin: () => void;
}

// Mock Forum Data (In a real app, this would be in AppState)
const INITIAL_POSTS: ForumPost[] = [
  {
    id: '1',
    author: 'Andi Saputra (Siswa)',
    role: 'STUDENT',
    content: 'Ada yang punya rangkuman materi Biologi tentang Sel? Besok ulangan harian nih.',
    date: '2023-10-24T08:30:00',
    likes: 5,
    comments: [
      { id: 'c1', author: 'Bu Siti (Guru)', role: 'TEACHER', content: 'Cek di modul yang Ibu upload di menu Materi ya Andi.', date: '2023-10-24T09:00:00' }
    ]
  },
  {
    id: '2',
    author: 'Pak Budi (Guru)',
    role: 'TEACHER',
    content: 'Pengingat untuk kelas X IPA 1, tugas proyek video dikumpulkan paling lambat hari Jumat ya.',
    date: '2023-10-23T14:00:00',
    likes: 12,
    comments: []
  }
];

const LandingPage: React.FC<LandingPageProps> = ({ data, onLogin }) => {
  const [posts, setPosts] = useState<ForumPost[]>(INITIAL_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  
  // Login Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handlePostSubmit = () => {
    if (!newPostContent.trim()) return;
    const newPost: ForumPost = {
      id: Date.now().toString(),
      author: 'Tamu (Guest)',
      role: 'STUDENT',
      content: newPostContent,
      date: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const handleLike = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    // Simulate API Call
    setTimeout(() => {
        if (loginEmail === 'admin@sekolah.id' && loginPassword === 'admin123') {
            onLogin();
            setIsLoginOpen(false);
        } else {
            setLoginError('Email atau password salah. (Coba: admin@sekolah.id / admin123)');
            setIsLoggingIn(false);
        }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <GraduationCap size={24} />
              </div>
              <span className="text-xl font-bold text-slate-800">GuruPintar AI</span>
            </div>
            <div className="flex gap-4">
               <a href="#features" className="hidden md:block text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Fitur</a>
               <a href="#forum" className="hidden md:block text-gray-600 hover:text-blue-600 px-3 py-2 text-sm font-medium">Forum Diskusi</a>
               <button 
                onClick={() => setIsLoginOpen(true)}
                className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 flex items-center gap-2 transition-all"
               >
                 <LogIn size={16} /> Masuk Guru
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- LOGIN MODAL --- */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                <button 
                    onClick={() => setIsLoginOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>
                
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex bg-blue-100 p-3 rounded-full text-blue-600 mb-4">
                            <Lock size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Login Guru</h2>
                        <p className="text-gray-500 text-sm mt-1">Masuk untuk mengelola kelas dan penilaian.</p>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Sekolah</label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="admin@sekolah.id"
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                                    placeholder="••••••••"
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                            </div>
                        </div>
                        
                        {loginError && (
                            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg">
                                {loginError}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Dashboard'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        <p>Demo Credentials:</p>
                        <p>Email: <strong>admin@sekolah.id</strong></p>
                        <p>Pass: <strong>admin123</strong></p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="bg-gradient-to-b from-blue-50 to-white pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
              Revolusi Penilaian Sekolah dengan <span className="text-blue-600">Kecerdasan Buatan</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              GuruPintar membantu Anda mengelola nilai, menganalisis bakat siswa, dan membuat laporan pembelajaran secara otomatis, akurat, dan efisien.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsLoginOpen(true)} 
                className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 hover:scale-105 transition-transform"
              >
                Coba Sekarang
              </button>
              <a href="#features" className="bg-white text-slate-700 border border-gray-300 px-8 py-3 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-colors">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center">
             <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-50"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-200 rounded-full blur-2xl opacity-50"></div>
                <img 
                  src="https://images.unsplash.com/photo-1531545514256-b1400bc00f31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" 
                  alt="Dashboard Preview" 
                  className="relative rounded-2xl shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500"
                />
             </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-20 bg-white">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900">Fitur Unggulan</h2>
              <p className="mt-4 text-gray-500">Semua yang Anda butuhkan untuk manajemen kelas modern.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-6">
                     <BarChart2 size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Analisis Real-time</h3>
                  <p className="text-gray-600">Pantau perkembangan siswa dengan grafik interaktif dan deteksi dini siswa yang membutuhkan bimbingan.</p>
               </div>
               <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-6">
                     <Users size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Manajemen Siswa & Kelas</h3>
                  <p className="text-gray-600">Database terpusat untuk data siswa, absensi, dan jurnal mengajar yang rapi dan mudah diakses.</p>
               </div>
               <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-6">
                     <CheckCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Rapor Otomatis</h3>
                  <p className="text-gray-600">Generate rapor siap cetak dengan satu klik, lengkap dengan deskripsi capaian berbasis AI.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- FORUM SECTION --- */}
      <section id="forum" className="py-20 bg-gray-50">
         <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
               <h2 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
                 <MessageSquare className="text-blue-600"/> Forum Diskusi Sekolah
               </h2>
               <p className="mt-4 text-gray-500">Ruang interaksi digital antara guru dan siswa.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
               <div className="p-4 border-b bg-gray-50">
                  <div className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                     </div>
                     <div className="flex-1">
                        <textarea 
                           className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                           rows={2}
                           placeholder="Tulis pertanyaan atau pengumuman..."
                           value={newPostContent}
                           onChange={(e) => setNewPostContent(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                           <button onClick={handlePostSubmit} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700">
                              <Send size={14} /> Posting
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
               
               <div className="divide-y divide-gray-100">
                  {posts.map(post => (
                     <div key={post.id} className="p-6">
                        <div className="flex justify-between items-start mb-3">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${post.role === 'TEACHER' ? 'bg-blue-600' : 'bg-green-500'}`}>
                                 {post.author.charAt(0)}
                              </div>
                              <div>
                                 <h4 className="font-bold text-gray-900 text-sm">{post.author}</h4>
                                 <span className={`text-[10px] px-2 py-0.5 rounded-full ${post.role === 'TEACHER' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                    {post.role === 'TEACHER' ? 'Guru' : 'Siswa'}
                                 </span>
                              </div>
                           </div>
                           <span className="text-xs text-gray-400">{new Date(post.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-800 mb-4 ml-13 pl-13">{post.content}</p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500 border-t border-gray-50 pt-3">
                           <button onClick={() => handleLike(post.id)} className="flex items-center gap-1 hover:text-red-500 transition">
                              <Heart size={16} className={post.likes > 0 ? 'fill-red-500 text-red-500' : ''}/> {post.likes} Suka
                           </button>
                           <button className="flex items-center gap-1 hover:text-blue-500 transition">
                              <MessageCircle size={16}/> {post.comments.length} Komentar
                           </button>
                        </div>

                        {/* Comments Preview */}
                        {post.comments.length > 0 && (
                           <div className="mt-4 bg-gray-50 rounded-lg p-3 space-y-3">
                              {post.comments.map(comment => (
                                 <div key={comment.id} className="flex gap-2 text-sm">
                                    <span className="font-bold text-gray-800">{comment.author}:</span>
                                    <span className="text-gray-600">{comment.content}</span>
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12">
         <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-6 text-white">
              <GraduationCap size={32} />
              <span className="text-2xl font-bold">GuruPintar AI</span>
            </div>
            <p className="mb-6">Platform pendidikan masa depan untuk sekolah Indonesia.</p>
            <div className="text-sm">
               &copy; {new Date().getFullYear()} GuruPintar AI. Hak Cipta Dilindungi.
            </div>
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
