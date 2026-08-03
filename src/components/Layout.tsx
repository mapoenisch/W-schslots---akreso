import React from 'react';
import { useAuth } from './AuthProvider';
import { LogOut, Calendar, List, Repeat, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout({ children, currentTab, setCurrentTab }: { children: React.ReactNode, currentTab: string, setCurrentTab: (t: string) => void }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col font-sans">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-1">
          <span className="font-bold text-2xl text-black">ak</span>
          <div className="w-4 h-4 rounded-full bg-[#53a661] mt-1 mx-0.5"></div>
          <span className="font-bold text-2xl text-black">reso</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">Hallo, {user?.lastName}</span>
          <button onClick={logout} className="text-gray-400 hover:text-gray-600">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-2 py-2 flex justify-around">
        <NavItem active={currentTab === 'book'} onClick={() => setCurrentTab('book')} icon={<Calendar size={24} />} label="Buchen" />
        <NavItem active={currentTab === 'my'} onClick={() => setCurrentTab('my')} icon={<List size={24} />} label="Meine" />
        <NavItem active={currentTab === 'exchange'} onClick={() => setCurrentTab('exchange')} icon={<Repeat size={24} />} label="Tausch" />
        {user?.role === 'admin' && (
          <NavItem active={currentTab === 'admin'} onClick={() => setCurrentTab('admin')} icon={<Shield size={24} />} label="Admin" />
        )}
      </nav>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-colors",
        active ? "text-[#53a661] font-semibold" : "text-gray-400 hover:text-gray-600"
      )}
    >
      <div className={cn("mb-1", active && "scale-110 transition-transform")}>{icon}</div>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
