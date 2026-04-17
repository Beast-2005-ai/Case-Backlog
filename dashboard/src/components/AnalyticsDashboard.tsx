import { useState, useMemo } from 'react';
import { BarChart2, PieChart as PieChartIcon, Activity, Map } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend 
} from 'recharts';
import type { Case } from '../types';

interface AnalyticsProps {
  cases: Case[];
}

// Consistent color mapping for case types across all doughnut charts
const CATEGORY_COLORS: Record<string, string> = {
  'Criminal Defense': '#ef4444', // Red
  'Family Law': '#3b82f6',       // Blue
  'Civil Litigation': '#10b981', // Green
  'Corporate / IP': '#8b5cf6',   // Purple
  'Uncategorized': '#f59e0b'     // Yellow
};

export function AnalyticsDashboard({ cases }: AnalyticsProps) {
  const [activeTab, setActiveTab] = useState('Priority');

  const tabs = [
    { id: 'Priority', label: 'Priority Distribution', icon: BarChart2 },
    { id: 'Category', label: 'Caseload by Category', icon: PieChartIcon },
    { id: 'Triggers', label: 'Keyword Triggers', icon: Activity },
    { id: 'Region', label: 'Regional Backlog', icon: Map },
  ];

  // 1. Process Data for Priority Histogram
  const priorityData = useMemo(() => {
    const buckets = { '0-20 (Low)': 0, '21-40 (Mod)': 0, '41-60 (Med)': 0, '61-80 (High)': 0, '81-100 (Critical)': 0 };
    cases.forEach(c => {
      if (c.priorityScore <= 20) buckets['0-20 (Low)']++;
      else if (c.priorityScore <= 40) buckets['21-40 (Mod)']++;
      else if (c.priorityScore <= 60) buckets['41-60 (Med)']++;
      else if (c.priorityScore <= 80) buckets['61-80 (High)']++;
      else buckets['81-100 (Critical)']++;
    });
    return Object.entries(buckets).map(([name, count]) => ({ name, count }));
  }, [cases]);

  // 2. Process Data for 3 Category Doughnuts (US, Overall, India)
  const categoryData = useMemo(() => {
    const overall: Record<string, number> = {};
    const us: Record<string, number> = {};
    const india: Record<string, number> = {};

    cases.forEach(c => {
      const type = c.type || 'Uncategorized';
      overall[type] = (overall[type] || 0) + 1;
      
      if (c.region === 'US') us[type] = (us[type] || 0) + 1;
      if (c.region === 'India') india[type] = (india[type] || 0) + 1;
    });

    const format = (obj: Record<string, number>) => Object.entries(obj).map(([name, value]) => ({ name, value }));
    return { overall: format(overall), us: format(us), india: format(india) };
  }, [cases]);

  // 3. Process Data for 3 Keyword Radar Charts (US, Overall, India)
  const keywordData = useMemo(() => {
    const targets = ['murder', 'assault', 'fraud', 'bail', 'custody', 'abuse'];
    const initHits = () => ({ murder: 0, assault: 0, fraud: 0, bail: 0, custody: 0, abuse: 0 });
    
    const overallHits = initHits(); 
    const usHits = initHits(); 
    const indiaHits = initHits();

    cases.forEach(c => {
      const text = c.summary.toLowerCase();
      targets.forEach(word => {
        if (text.includes(word)) {
          overallHits[word as keyof typeof overallHits]++;
          if (c.region === 'US') usHits[word as keyof typeof usHits]++;
          if (c.region === 'India') indiaHits[word as keyof typeof indiaHits]++;
        }
      });
    });
    
    const format = (obj: Record<string, number>) => Object.entries(obj).map(([subject, A]) => ({ 
      subject: subject.charAt(0).toUpperCase() + subject.slice(1), A 
    }));
    
    return { overall: format(overallHits), us: format(usHits), india: format(indiaHits) };
  }, [cases]);

  // 4. Process Data for Regional Bar Chart (ADDED INTERNATIONAL)
  const regionData = useMemo(() => {
    const regions = { 
      'US': { count: 0, totalScore: 0 }, 
      'India': { count: 0, totalScore: 0 },
      'International': { count: 0, totalScore: 0 } 
    };
    
    cases.forEach(c => {
      if (regions[c.region as keyof typeof regions]) {
        regions[c.region as keyof typeof regions].count++;
        regions[c.region as keyof typeof regions].totalScore += c.priorityScore;
      }
    });

    return [
      { name: 'United States', Volume: regions['US'].count, AvgScore: regions['US'].count ? Math.round(regions['US'].totalScore / regions['US'].count) : 0 },
      { name: 'India', Volume: regions['India'].count, AvgScore: regions['India'].count ? Math.round(regions['India'].totalScore / regions['India'].count) : 0 },
      { name: 'International', Volume: regions['International'].count, AvgScore: regions['International'].count ? Math.round(regions['International'].totalScore / regions['International'].count) : 0 }
    ];
  }, [cases]);

  // Custom Tooltip for dark mode
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111] border border-[#333] p-3 rounded-lg shadow-xl">
          <p className="text-gray-300 font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.payload.fill || '#fff' }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-4xl font-semibold text-white mb-2 tracking-tight">System Analytics</h1>
          <p className="text-gray-500 text-xl">Macro-level insights and data telemetry</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-[#161616] p-1.5 rounded-xl border border-[#2a2a2a] w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2.5 px-6 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#222222] text-white border border-[#333333] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl h-[550px] p-8 flex flex-col">
        
        {activeTab === 'Priority' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
              <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#222' }} />
              <Bar dataKey="count" name="Total Cases" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {/* 3-WAY SPLIT: CASELOAD BY CATEGORY */}
        {activeTab === 'Category' && (
          <div className="flex h-full w-full items-center">
            
            {/* US Caseload */}
            <div className="flex-1 h-full flex flex-col items-center justify-center border-r border-[#2a2a2a]">
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">US Caseload</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={categoryData.us} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                    {categoryData.us.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Overall Caseload (Center) */}
            <div className="flex-1 h-full flex flex-col items-center justify-center">
              <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Overall Backlog</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={categoryData.overall} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={3} dataKey="value" stroke="none">
                    {categoryData.overall.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* India Caseload */}
            <div className="flex-1 h-full flex flex-col items-center justify-center border-l border-[#2a2a2a]">
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">India Caseload</h3>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie data={categoryData.india} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" stroke="none">
                    {categoryData.india.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#9ca3af'} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* 3-WAY SPLIT: KEYWORD TRIGGERS */}
        {activeTab === 'Triggers' && (
          <div className="flex h-full w-full items-center">
            
            {/* US Triggers */}
            <div className="flex-1 h-full flex flex-col items-center justify-center border-r border-[#2a2a2a]">
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">US Region</h3>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={keywordData.us}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar name="Hits" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Overall Triggers */}
            <div className="flex-1 h-full flex flex-col items-center justify-center">
              <h3 className="text-white font-bold uppercase tracking-wider text-sm mb-2">Overall System</h3>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={keywordData.overall}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#e5e7eb', fontSize: 14 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 11 }} />
                  <Radar name="Hits" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* India Triggers */}
            <div className="flex-1 h-full flex flex-col items-center justify-center border-l border-[#2a2a2a]">
              <h3 className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">India Region</h3>
              <ResponsiveContainer width="100%" height="90%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={keywordData.india}>
                  <PolarGrid stroke="#333" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <Radar name="Hits" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                  <RechartsTooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* REGIONAL COMPARISON WITH INTERNATIONAL */}
        {activeTab === 'Region' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#9ca3af' }} />
              <YAxis yAxisId="left" orientation="left" stroke="#6b7280" />
              <YAxis yAxisId="right" orientation="right" stroke="#6b7280" domain={[0, 100]} />
              <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#222' }} />
              <Legend wrapperStyle={{ paddingTop: '20px', color: '#9ca3af' }} />
              <Bar yAxisId="left" dataKey="Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Caseload" />
              <Bar yAxisId="right" dataKey="AvgScore" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Average Priority Score" />
            </BarChart>
          </ResponsiveContainer>
        )}

      </div>
    </div>
  );
}