
import React, { useState } from 'react';
import { AppState, ForumPost, Student } from '../types';
import { 
  Moon, 
  LogIn,
  X,
  Loader2,
  Lock,
  User,
  Sparkles,
  Heart,
  BookOpen,
  Smartphone,
  MessageCircle,
  Send,
  CheckCircle,
  Trash2,
  Users,
  Menu,
  LogOut,
  GraduationCap
} from 'lucide-react';

interface LandingPageProps {
  data: AppState;
  onLogin: () => void;
  onUpdate: (newData: AppState) => void;
}

// Logo Component Internal
const DigissLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M50 0L63.5 29.5L95.5 32L74.5 56L84 87.5L50 73L16 87.5L25.5 56L4.5 32L36.5 29.5L50 0Z" fill="#F59E0B"/>
    <rect x="20" y="20" width="60" height="60" transform="rotate(45 50 50)" fill="#F59E0B"/>
    <rect x="22" y="22" width="56" height="56" rx="8" fill="#059669"/>
    <path d="M32 35H40V65H32V35ZM48 35H52V65H48V35ZM60 35H68V48H60V35ZM60 52H68V65H60V52Z" fill="white"/>
  </svg>
);

const LandingPage: React.FC<LandingPageProps> = ({ data, onLogin, onUpdate }) => {
  // Student Auth State
  const [studentUser, setStudentUser] = useState<Student | null>(null);
  
  // Forum State
  const [newPostContent, setNewPostContent] = useState('');
  
  // Login Modal State
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<'TEACHER' | 'STUDENT'>('STUDENT'); // Default tab logic
  
  // Credentials
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginNis, setLoginNis] = useState(''); // For Student
  
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Safe Scroll Function
  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const handlePostSubmit = () => {
    if (!studentUser) return; // Guard clause
    if (!newPostContent.trim()) return;

    const newPost: ForumPost = {
      id: Date.now().toString(),
      author: studentUser.name,
      role: 'STUDENT',
      content: newPostContent,
      date: new Date().toISOString(),
      likes: 0,
      comments: []
    };
    
    // Update global state
    onUpdate({
        ...data,
        forumPosts: [newPost, ...data.forumPosts]
    });
    setNewPostContent('');
  };

  const handleLike = (id: string) => {
    if (!studentUser) {
        alert("Silakan login sebagai santri untuk menyukai postingan.");
        return;
    }
    const updatedPosts = data.forumPosts.map(p => 
        p.id === id ? { ...p, likes: p.likes + 1 } : p
    );
    onUpdate({ ...data, forumPosts: updatedPosts });
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    setTimeout(() => {
        if (loginRole === 'TEACHER') {
            // Teacher Login Logic
            if (loginEmail === 'admin@sekolah.id' && loginPassword === 'admin123') {
                onLogin();
                setIsLoginOpen(false);
            } else {
                setLoginError('Email atau password salah.');
                setIsLoggingIn(false);
            }
        } else {
            // Student Login Logic
            const student = data.students.find(s => s.nis === loginNis.trim());
            if (student) {
                setStudentUser(student);
                setIsLoginOpen(false);
                setLoginNis('');
            } else {
                setLoginError('NIS tidak ditemukan dalam database.');
                setIsLoggingIn(false);
            }
        }
    }, 1000);
  };

  const handleStudentLogout = () => {
      if(confirm("Apakah Anda yakin ingin keluar?")) {
          setStudentUser(null);
      }
  };

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-slate-800">
      
      {/* --- NAVBAR --- */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-12 h-12 drop-shadow-md hover:scale-105 transition-transform">
                <DigissLogo className="w-full h-full" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-emerald-950 tracking-tight block leading-none">DIGISS</span>
                <span className="text-[10px] font-medium text-emerald-600 tracking-widest uppercase">Boarding School</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
               <a 
                 href="#features" 
                 onClick={(e) => scrollToSection(e, 'features')}
                 className="text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors cursor-pointer"
               >
                 Program Unggulan
               </a>
               <a 
                 href="#forum" 
                 onClick={(e) => scrollToSection(e, 'forum')}
                 className="text-slate-600 hover:text-emerald-600 text-sm font-medium transition-colors cursor-pointer"
               >
                 Halaqah Online
               </a>
               
               {studentUser ? (
                   <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
                       <div className="text-right">
                           <p className="text-sm font-bold text-emerald-900">{studentUser.name}</p>
                           <p className="text-xs text-emerald-600">Santriwati</p>
                       </div>
                       <button 
                           onClick={handleStudentLogout}
                           className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                           title="Keluar"
                       >
                           <LogOut size={20} />
                       </button>
                   </div>
               ) : (
                   <button 
                    onClick={() => setIsLoginOpen(true)}
                    className="bg-emerald-700 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-800 flex items-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                   >
                     <LogIn size={18} /> Login
                   </button>
               )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-4">
               {!studentUser && (
                   <button 
                      onClick={() => setIsLoginOpen(true)}
                      className="text-emerald-700 font-bold text-sm"
                   >
                     Login
                   </button>
               )}
               <button 
                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 className="p-2 text-slate-600 hover:bg-gray-100 rounded-lg transition-colors"
               >
                 {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
               </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
           <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl p-4 flex flex-col gap-2 animate-fade-in z-30">
               {studentUser && (
                   <div className="px-4 py-3 bg-emerald-50 rounded-lg mb-2 flex justify-between items-center">
                       <div>
                           <p className="font-bold text-emerald-900">{studentUser.name}</p>
                           <p className="text-xs text-emerald-600">NIS: {studentUser.nis}</p>
                       </div>
                       <button onClick={handleStudentLogout} className="text-rose-600 text-xs font-bold border border-rose-200 px-2 py-1 rounded">Keluar</button>
                   </div>
               )}
               <a 
                 href="#features" 
                 onClick={(e) => scrollToSection(e, 'features')}
                 className="block px-4 py-3 text-slate-600 font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
               >
                 Program Unggulan
               </a>
               <a 
                 href="#forum" 
                 onClick={(e) => scrollToSection(e, 'forum')}
                 className="block px-4 py-3 text-slate-600 font-medium hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors cursor-pointer"
               >
                 Halaqah Online (Forum)
               </a>
           </div>
        )}
      </nav>

      {/* --- LOGIN MODAL --- */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-emerald-900/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative border border-emerald-100">
                <button 
                    onClick={() => setIsLoginOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-emerald-600 transition-colors bg-gray-50 p-2 rounded-full z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 mx-auto mb-3">
                            <DigissLogo className="w-full h-full" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Portal Digital DIGISS</h2>
                    </div>

                    {/* Role Tabs */}
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button 
                            onClick={() => { setLoginRole('STUDENT'); setLoginError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === 'STUDENT' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Masuk Santri
                        </button>
                        <button 
                            onClick={() => { setLoginRole('TEACHER'); setLoginError(''); }}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${loginRole === 'TEACHER' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Masuk Ustadzah
                        </button>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        {loginRole === 'TEACHER' ? (
                            <>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email / NIP</label>
                                    <div className="relative group">
                                        <User className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                        <input 
                                            type="email" 
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="admin@sekolah.id"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                        <input 
                                            type="password" 
                                            required
                                            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="••••••••"
                                            value={loginPassword}
                                            onChange={(e) => setLoginPassword(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            // STUDENT FORM
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nomor Induk Santri (NIS)</label>
                                <div className="relative group">
                                    <GraduationCap className="absolute left-3.5 top-2.5 text-gray-400 group-focus-within:text-emerald-600 transition-colors" size={18} />
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                        placeholder="Contoh: 2310123"
                                        value={loginNis}
                                        onChange={(e) => setLoginNis(e.target.value)}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2">
                                    *Gunakan NIS yang terdaftar di sistem akademik.
                                </p>
                            </div>
                        )}
                        
                        {loginError && (
                            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-lg font-medium text-center">
                                {loginError}
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLoggingIn}
                            className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-emerald-200"
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Masuk Sekarang'}
                        </button>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 mb-1">Demo Credentials:</p>
                        {loginRole === 'TEACHER' ? (
                             <p className="text-xs text-gray-600 font-mono">admin@sekolah.id / admin123</p>
                        ) : (
                             <p className="text-xs text-gray-600 font-mono">NIS: {data.students.length > 0 ? data.students[0].nis : '2310123'}</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden bg-[#F0FDF4] pt-20 pb-28">
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 opacity-10 pointer-events-none">
           <svg width="600" height="600" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#059669" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,81.6,-46.6C91.4,-34.1,98.1,-19.2,95.8,-5.3C93.5,8.6,82.2,21.5,70.6,31.7C59,41.9,47.1,49.5,35.2,55.4C23.3,61.3,11.4,65.5,-1.6,68.3C-14.6,71.1,-29.9,72.5,-43.3,67.6C-56.7,62.7,-68.2,51.5,-75.6,38.3C-83,25.1,-86.3,9.9,-84.3,-4.4C-82.3,-18.7,-75,-32.1,-65.4,-43.5C-55.8,-54.9,-43.9,-64.3,-31.2,-72.5C-18.5,-80.7,-5,-87.7,6.8,-99.5L18.6,-111.3L44.7,-76.4Z" transform="translate(100 100)" />
           </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="md:w-1/2 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-emerald-200">
               <Sparkles size={16} /> Pesantrennya Anak Zaman Now
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-emerald-950 leading-tight mb-6">
              Mencetak Generasi <span className="text-emerald-600 relative">Qur'ani<span className="absolute bottom-2 left-0 w-full h-3 bg-emerald-200/50 -z-10 rounded-full"></span></span> yang Berwawasan Teknologi
            </h1>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-xl mx-auto md:mx-0">
              Sistem manajemen pesantren modern yang mengintegrasikan monitoring Tahfidz, penilaian Adab, dan kecerdasan buatan untuk masa depan santriwati.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button 
                onClick={() => { setLoginRole('STUDENT'); setIsLoginOpen(true); }} 
                className="bg-emerald-600 text-white px-8 py-3.5 rounded-full font-bold shadow-xl shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all"
              >
                Login Santri
              </button>
              <a 
                href="#features" 
                onClick={(e) => scrollToSection(e, 'features')}
                className="bg-white text-emerald-900 border border-emerald-200 px-8 py-3.5 rounded-full font-bold shadow-sm hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                Lihat Program <Users size={18}/>
              </a>
            </div>
          </div>
          
          <div className="md:w-1/2 relative">
             <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent z-10"></div>
                {/* Image Placeholder: Muslim woman studying */}
                <img 
                  src="https://images.unsplash.com/photo-1576489922094-2cfe89fb1733?q=80&w=2030&auto=format&fit=crop" 
                  alt="Santriwati Belajar Digital" 
                  className="w-full h-[300px] md:h-[500px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-6 left-6 right-6 z-20 text-white">
                    <p className="text-sm font-medium opacity-90 mb-1">DIGISS Smart Campus</p>
                    <h3 className="text-xl md:text-2xl font-bold">Integrasi Iman, Ilmu, & Teknologi</h3>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce-slow hidden md:flex">
                 <div className="bg-rose-100 p-3 rounded-full text-rose-500">
                     <Heart size={24} fill="currentColor" />
                 </div>
                 <div>
                     <p className="text-xs text-gray-500 font-bold uppercase">Kepuasan Wali Santri</p>
                     <p className="text-xl font-bold text-gray-900">4.9/5.0</p>
                 </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-24 bg-white relative scroll-mt-20">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-emerald-900 mb-4">Keunggulan Sistem DIGISS</h2>
              <p className="text-slate-500 text-lg">Platform digital komprehensif yang dirancang khusus untuk ekosistem pesantren putri modern.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               <div className="group p-8 bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-emerald-100/50 hover:border-emerald-200 transition-all duration-300">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                     <BookOpen size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Monitoring Tahfidz</h3>
                  <p className="text-gray-600 leading-relaxed">Pantau perkembangan hafalan Al-Qur'an santriwati secara real-time dengan grafik capaian yang detail dan transparan bagi wali santri.</p>
               </div>
               
               <div className="group p-8 bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-rose-100/50 hover:border-rose-200 transition-all duration-300">
                  <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                     <Heart size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Adab & Karakter</h3>
                  <p className="text-gray-600 leading-relaxed">Penilaian kualitatif untuk aspek kepribadian, kemandirian, dan adab keseharian santriwati di asrama maupun sekolah.</p>
               </div>
               
               <div className="group p-8 bg-white rounded-[2rem] border border-gray-100 shadow-lg hover:shadow-2xl hover:shadow-blue-100/50 hover:border-blue-200 transition-all duration-300">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                     <Smartphone size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Digital Classroom</h3>
                  <p className="text-gray-600 leading-relaxed">Pembelajaran modern dengan materi digital, bank soal AI, dan forum diskusi interaktif yang tetap dalam koridor Islami.</p>
               </div>
            </div>
         </div>
      </section>

      {/* --- FORUM SECTION --- */}
      <section id="forum" className="py-24 bg-gradient-to-b from-emerald-50/50 to-white scroll-mt-20">
         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
               <span className="text-emerald-600 font-bold tracking-wider text-xs uppercase bg-emerald-100 px-3 py-1 rounded-full">Komunitas Belajar</span>
               <h2 className="text-3xl font-bold text-emerald-900 mt-4 flex items-center justify-center gap-3">
                 <MessageCircle className="text-emerald-600"/> Halaqah Digital Santriwati
               </h2>
               <p className="mt-4 text-slate-500">Ruang diskusi aman dan terpantau untuk berbagi ilmu agama dan pengetahuan umum.</p>
            </div>

            {!studentUser ? (
               // LOCKED STATE
               <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-12 text-center max-w-2xl mx-auto animate-fade-in relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                  <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                     <Lock size={40} className="text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Akses Terbatas untuk Santri</h3>
                  <p className="text-gray-500 mb-8 leading-relaxed max-w-md mx-auto">
                     Mohon maaf, diskusi Halaqah Online bersifat privat dan hanya dapat diakses oleh santriwati aktif DIGISS Boarding School.
                  </p>
                  <button 
                     onClick={() => { setLoginRole('STUDENT'); setIsLoginOpen(true); }}
                     className="bg-emerald-600 text-white px-8 py-3.5 rounded-full font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all flex items-center gap-2 mx-auto"
                  >
                     <LogIn size={20} /> Login dengan NIS
                  </button>
                  <p className="text-xs text-gray-400 mt-6">
                     Belum punya akun? Hubungi bagian Tata Usaha.
                  </p>
               </div>
            ) : (
               // UNLOCKED STATE
               <div className="bg-white rounded-2xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden mb-8 animate-fade-in">
                  
                  {/* --- POST INPUT SECTION --- */}
                  <div className="p-6 border-b bg-gray-50/50">
                     <div className="flex gap-4">
                           <div className="w-12 h-12 rounded-full bg-rose-100 flex-shrink-0 flex items-center justify-center border-2 border-white shadow-sm font-bold text-rose-500">
                              {studentUser.name.charAt(0)}
                           </div>
                           <div className="flex-1">
                              <textarea 
                              className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none resize-none bg-white text-sm"
                              rows={2}
                              placeholder={`Assalamu'alaikum ${studentUser.name.split(' ')[0]}, ingin bertanya atau berbagi apa hari ini?`}
                              value={newPostContent}
                              onChange={(e) => setNewPostContent(e.target.value)}
                              />
                              <div className="flex justify-between items-center mt-3">
                              <div className="text-xs text-gray-400 italic">*Gunakan bahasa yang sopan dan santun.</div>
                              <button onClick={handlePostSubmit} className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-md transition-all">
                                 <Send size={16} /> Kirim
                              </button>
                              </div>
                           </div>
                     </div>
                  </div>
                  
                  {/* --- POST LIST --- */}
                  <div className="divide-y divide-gray-50">
                     {data.forumPosts.length > 0 ? data.forumPosts.map(post => (
                        <div key={post.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                           <div className="flex justify-between items-start mb-3">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${post.role === 'TEACHER' ? 'bg-emerald-600' : 'bg-rose-400'}`}>
                                    {post.author.charAt(0)}
                                 </div>
                                 <div>
                                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                       {post.author}
                                       {post.role === 'TEACHER' && <CheckCircle size={14} className="text-emerald-500 fill-emerald-100" />}
                                    </h4>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${post.role === 'TEACHER' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                       {post.role === 'TEACHER' ? 'Ustadzah' : 'Santriwati'}
                                    </span>
                                 </div>
                              </div>
                              <span className="text-xs text-gray-400 font-medium">{new Date(post.date).toLocaleDateString()}</span>
                           </div>
                           
                           <div className="pl-13 ml-13">
                               <p className="text-gray-700 mb-4 leading-relaxed text-sm bg-gray-50/50 p-3 rounded-lg border border-gray-100">{post.content}</p>
                               
                               <div className="flex items-center gap-6 text-sm text-gray-500">
                                  <button onClick={() => handleLike(post.id)} className="flex items-center gap-1.5 hover:text-rose-500 transition-colors group">
                                     <Heart size={18} className={`transition-transform group-hover:scale-110 ${post.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`}/> 
                                     <span className="font-medium">{post.likes}</span>
                                  </button>
                                  <button className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                                     <MessageCircle size={18}/> 
                                     <span className="font-medium">{post.comments.length} Balasan</span>
                                  </button>
                               </div>

                               {/* Comments Preview */}
                               {post.comments.length > 0 && (
                                  <div className="mt-4 pl-4 border-l-2 border-emerald-100 space-y-3">
                                     {post.comments.map(comment => (
                                        <div key={comment.id} className="flex gap-3 text-sm">
                                           <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white ${comment.role === 'TEACHER' ? 'bg-emerald-600' : 'bg-gray-400'}`}>
                                               {comment.author.charAt(0)}
                                           </div>
                                           <div className="bg-gray-50 p-2.5 rounded-r-xl rounded-bl-xl flex-1">
                                               <div className="flex justify-between items-center mb-1">
                                                   <span className="font-bold text-gray-800 text-xs flex items-center gap-1">
                                                      {comment.author}
                                                      {comment.role === 'TEACHER' && <CheckCircle size={10} className="text-emerald-500"/>}
                                                   </span>
                                                   <span className="text-[10px] text-gray-400">{new Date(comment.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                               </div>
                                               <span className="text-gray-600">{comment.content}</span>
                                           </div>
                                        </div>
                                     ))}
                                  </div>
                               )}
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-10 text-gray-400">
                           <p>Belum ada diskusi. Jadilah yang pertama bertanya!</p>
                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-emerald-950 text-emerald-200 py-16">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12">
            <div>
                <div className="flex items-center gap-3 mb-6 text-white">
                    <div className="w-8 h-8">
                        <DigissLogo className="w-full h-full" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">DIGISS</span>
                </div>
                <p className="text-emerald-400/80 leading-relaxed mb-6">
                    Digital Islamic School System. Platform manajemen pesantren terpadu untuk mencetak generasi muslimah yang cerdas, berkarakter, dan melek teknologi.
                </p>
                <div className="flex gap-4">
                    {/* Social Placeholders */}
                    <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center hover:bg-emerald-700 cursor-pointer transition">IG</div>
                    <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center hover:bg-emerald-700 cursor-pointer transition">YT</div>
                    <div className="w-8 h-8 bg-emerald-900 rounded-full flex items-center justify-center hover:bg-emerald-700 cursor-pointer transition">FB</div>
                </div>
            </div>
            
            <div>
                <h4 className="text-white font-bold text-lg mb-6">Program</h4>
                <ul className="space-y-3 text-sm">
                    <li><a href="#" className="hover:text-white transition">Tahfidz Al-Qur'an 30 Juz</a></li>
                    <li><a href="#" className="hover:text-white transition">Kajian Kitab Kuning</a></li>
                    <li><a href="#" className="hover:text-white transition">Leadership & Public Speaking</a></li>
                    <li><a href="#" className="hover:text-white transition">Coding & Design Grafis</a></li>
                </ul>
            </div>

            <div>
                <h4 className="text-white font-bold text-lg mb-6">Hubungi Kami</h4>
                <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-3">
                        <span className="text-emerald-500">📍</span> Jl. Pendidikan Islam No. 99, Kota Santri, Indonesia
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-500">📞</span> (021) 555-0123
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="text-emerald-500">✉️</span> info@digiss-pesantren.id
                    </li>
                </ul>
            </div>
         </div>
         <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-emerald-900 text-center text-xs text-emerald-600">
            &copy; {new Date().getFullYear()} DIGISS Boarding School. All Rights Reserved. Created with ❤️ for Islamic Education.
         </div>
      </footer>
    </div>
  );
};

export default LandingPage;
