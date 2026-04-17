import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { CaseTable } from './components/CaseTable';
import { CaseDetailPanel } from './components/CaseDetailPanel';
import { SystemLogs } from './components/SystemLogs';
import { ConfigurationModal } from './components/ConfigurationModal';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DollarSign, IndianRupee, Globe2 } from 'lucide-react';
import type { Case, Stats } from './types';

type Category = 'All' | 'Corporate / IP' | 'Civil Litigation' | 'Criminal Defense' | 'Family Law';
// ADDED 'International' to the Region type
type Region = 'US' | 'India' | 'International';

function App() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSystemActive, setIsSystemActive] = useState(false);
  
  const [activeRegion, setActiveRegion] = useState<Region>('US');
  const [activeTab, setActiveTab] = useState<Category>('All');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  
  const [activePage, setActivePage] = useState('Dashboard');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const fetchQueue = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/queue`);
      const data = await response.json();
      
      const liveCases: Case[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        region: item.region, 
        priorityScore: item.priority_score,
        summary: item.summary,
        justification: item.justification
      }));

      setCases(liveCases);
      setIsSystemActive(true);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch:", error);
      setIsSystemActive(false);
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchQueue();
    const intervalId = setInterval(fetchQueue, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesRegion = c.region === activeRegion;
    const matchesCategory = activeTab === 'All' || c.type === activeTab;
    return matchesRegion && matchesCategory;
  });

  const stats: Stats = {
    totalCases: filteredCases.length,
    averagePriority: filteredCases.length > 0
      ? filteredCases.reduce((sum, c) => sum + c.priorityScore, 0) / filteredCases.length
      : 0,
    criticalCases: filteredCases.filter((c) => c.priorityScore >= 80).length,
  };

  const tabs: Category[] = ['All', 'Corporate / IP', 'Civil Litigation', 'Criminal Defense', 'Family Law'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111111] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse font-mono tracking-widest">SYNCHRONIZING BACKLOG...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111111] flex text-gray-200 font-sans">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        activePage={activePage}
        setActivePage={setActivePage}
      />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden ml-[80px]">
        <Header 
          cases={cases} 
          onCaseSelect={setSelectedCase} 
          isSystemActive={isSystemActive} 
          onOpenConfig={() => setIsConfigOpen(true)}
        />
        
        <main className="flex-1 p-8 overflow-y-auto relative">
          <div className="max-w-[1800px] mx-auto">
            
            {/* DYNAMIC ROUTING ENGINE */}
            {activePage === 'Logs' ? (
              <SystemLogs />
            ) : activePage === 'Analytics' ? (
              <AnalyticsDashboard cases={cases} />
            ) : (
              <>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-5xl font-semibold text-white mb-2 tracking-tight">Legal Triage Dashboard</h1>
                    <p className="text-gray-500 text-3xl">AI-powered backlog optimization engine</p>
                  </div>

                  <div className="flex space-x-2 bg-[#161616] p-1.5 rounded-xl border border-[#2a2a2a]">
                    {/* ADDED INTERNATIONAL BUTTON MAPPING */}
                    {(['US', 'India', 'International'] as Region[]).map(reg => (
                      <button
                        key={reg}
                        onClick={() => { setActiveRegion(reg); setActiveTab('All'); }}
                        className={`flex items-center space-x-2.5 px-6 py-6 rounded-lg text-sm font-medium transition-all ${
                          activeRegion === reg 
                            ? 'bg-[#222222] text-white border border-[#333333] shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {reg === 'US' ? <DollarSign size={20} /> : reg === 'India' ? <IndianRupee size={20} /> : <Globe2 size={20} />}
                        <span>{reg === 'US' ? 'US' : reg === 'India' ? 'IN' : 'INT'} Caseload</span>
                      </button>
                    ))}
                  </div>
                </div>

                <StatsCards stats={stats} />

                <div className="flex items-center space-x-4 mb-6">
                  <span className="text-gray-500 text-3xl font-medium">Filter View:</span>
                  <div className="flex space-x-2 bg-[#161616] p-1 rounded-xl border border-[#2a2a2a] w-fit">
                    {tabs.map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          activeTab === tab 
                            ? 'bg-[#222222] text-white border border-[#333333] shadow-sm' 
                            : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                <CaseTable cases={filteredCases} onCaseSelect={setSelectedCase} />
              </>
            )}
          </div>
        </main>
      </div>
      
      <CaseDetailPanel caseData={selectedCase} onClose={() => setSelectedCase(null)} />
      <ConfigurationModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
}

export default App;