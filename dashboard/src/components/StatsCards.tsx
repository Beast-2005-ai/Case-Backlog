import { TrendingUp, AlertTriangle, HardDrive, AlignCenter } from 'lucide-react';
import type { Stats } from '../types';

interface StatsCardsProps {
  stats: Stats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      icon: HardDrive,
      color: 'text-gray-300',
    },
    {
      title: 'Average Priority',
      value: stats.averagePriority.toFixed(1),
      icon: TrendingUp,
      color: 'text-gray-300',
    },
    {
      title: 'Critical Action Required',
      value: stats.criticalCases,
      icon: AlertTriangle,
      color: 'text-red-400',
    },
  ];

  return (
    <div className="align-center grid grid-cols-3 gap-6 mb-8">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-[#161616] text-center border border-[#2a2a2a] rounded-xl p-6 hover:border-[#444] transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2.5 bg-[#222222] border border-[#333] rounded-lg ${card.color}`}>
                <Icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-semibold text-white mb-1 tracking-tight">{card.value}</div>
            <div className="text-gray-500 font-medium text-sm">{card.title}</div>
          </div>
        );
      })}
    </div>
  );
}