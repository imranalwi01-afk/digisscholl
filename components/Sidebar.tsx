
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileBarChart, 
  Settings, 
  GraduationCap,
  BookOpenCheck,
  ClipboardList,
  CalendarCheck,
  FileQuestion,
  LogOut,
  MessageCircle
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'forum', label: 'Halaqah Online', icon: MessageCircle },
    { id: 'classes', label: 'Kelas & Siswa', icon: Users },
    { id: 'attendance', label: 'Absensi Harian', icon: CalendarCheck },
    { id: 'journals', label: 'Jurnal Mengajar', icon: BookOpenCheck },
    { id: 'assessments', label: 'Penilaian', icon: BookOpen },
    { id: 'exams', label: 'Bank Soal', icon: FileQuestion }, 
    { id: 'talents', label: 'Minat & Bakat', icon: ClipboardList },
    { id: 'reports', label: 'Lapor & Rapor', icon: FileBarChart },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  const handleLogoutClick = () => {
    // Gunakan window.confirm secara eksplisit
    if (window.confirm("Apakah Anda yakin ingin keluar dari Dashboard Guru?")) {
        onLogout();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static no-print
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 h-16 border-b border-gray-200">
            <div className="bg-emerald-600 p-2 rounded-lg text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold text-emerald-950">DIGISS</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCurrentPage(item.id);
                    // On mobile, close sidebar after selection
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`
                    flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <Icon size={20} className={isActive ? 'text-emerald-600' : 'text-gray-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold border border-emerald-200">
                US
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">Ustadzah</p>
                <p className="text-xs text-gray-500 truncate">Online</p>
              </div>
            </div>
            <button 
                type="button"
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center gap-2 bg-white text-rose-600 border border-rose-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-50 transition-colors"
            >
                <LogOut size={16} /> Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
