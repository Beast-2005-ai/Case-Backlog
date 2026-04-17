import { useState } from 'react';
import { Scale, BarChart3, Terminal, PieChart } from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  activePage: string;
  setActivePage: (page: string) => void;
}

export function Sidebar({ collapsed, setCollapsed, activePage, setActivePage }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !collapsed || isHovered;

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-0 left-0 h-screen bg-[#161616] text-gray-300 transition-all duration-300 ease-in-out z-50 border-r border-[#2a2a2a] flex flex-col ${isExpanded ? 'w-[280px]' : 'w-[80px]'}`}
    >
      <div className={`p-6 flex items-center justify-between border-b border-[#2a2a2a] h-[80px] ${!isExpanded ? 'justify-center' : ''}`}>
        {isExpanded ? (
          <div className="flex items-center space-x-3 overflow-hidden whitespace-nowrap">
            <div className="p-2 bg-[#222222] border border-[#333] rounded-lg shrink-0">
              <Scale className="text-gray-200" size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Case<span className="text-gray-500">Triage</span></span>
          </div>
        ) : (
           <div className="p-2 bg-[#222222] border border-[#333] rounded-lg shrink-0">
             <Scale className="text-gray-200" size={18} />
           </div>
        )}
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-hidden">
        <button onClick={() => setActivePage('Dashboard')} className={`w-full flex items-center rounded-lg p-3 text-sm font-medium transition-all group ${activePage === 'Dashboard' ? 'bg-[#222222] text-white border border-[#333]' : 'border border-transparent hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300'}`}>
          <BarChart3 className={`shrink-0 transition-all ${activePage === 'Dashboard' ? 'text-white' : 'text-gray-500'} ${isExpanded ? 'mr-4' : 'mr-0'}`} size={18} />
          {isExpanded && <span>Dashboard</span>}
        </button>

        <button onClick={() => setActivePage('Logs')} className={`w-full flex items-center rounded-lg p-3 text-sm font-medium transition-all group ${activePage === 'Logs' ? 'bg-[#222222] text-white border border-[#333]' : 'border border-transparent hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300'}`}>
          <Terminal className={`shrink-0 transition-all ${activePage === 'Logs' ? 'text-white' : 'text-gray-500'} ${isExpanded ? 'mr-4' : 'mr-0'}`} size={18} />
          {isExpanded && <span>Audit Logs</span>}
        </button>

        {/* NEW ANALYTICS TAB */}
        <button onClick={() => setActivePage('Analytics')} className={`w-full flex items-center rounded-lg p-3 text-sm font-medium transition-all group ${activePage === 'Analytics' ? 'bg-[#222222] text-white border border-[#333]' : 'border border-transparent hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300'}`}>
          <PieChart className={`shrink-0 transition-all ${activePage === 'Analytics' ? 'text-white' : 'text-gray-500'} ${isExpanded ? 'mr-4' : 'mr-0'}`} size={18} />
          {isExpanded && <span>System Analytics</span>}
        </button>
      </nav>

      {isExpanded && (
        <div className="p-5 border-t border-[#2a2a2a] bg-[#1a1a1a] m-4 rounded-xl whitespace-nowrap overflow-hidden">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-[#222222] border border-[#333] text-gray-300 flex items-center justify-center font-medium text-xs shrink-0">A</div>
            <div>
              <p className="text-sm font-medium text-gray-200">Admin Portal</p>
              <p className="text-sm text-gray-500">System v6.9</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}