import { PriorityGauge } from './PriorityGauge';
import type { Case } from '../types';

interface CaseTableProps {
  cases: Case[];
  onCaseSelect: (caseData: Case) => void;
}

export function CaseTable({ cases, onCaseSelect }: CaseTableProps) {
  return (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-[#2a2a2a]">
        <h2 className="text-lg font-semibold text-white">Live Triage Queue</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#111111] text-gray-500 text-xs uppercase tracking-wider border-b border-[#2a2a2a]">
              <th className="px-6 py-4 text-left font-medium">Rank</th>
              <th className="px-6 py-4 text-left font-medium">Case ID</th>
              <th className="px-6 py-4 text-left font-medium">Type</th>
              {/* ADDED text-center here */}
              <th className="px-6 py-4 text-center font-medium">Priority Score</th>
              <th className="px-6 py-4 text-left font-medium">AI Summary</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseData, index) => (
              <tr
                key={caseData.id}
                onClick={() => onCaseSelect(caseData)}
                className="border-b border-[#2a2a2a] hover:bg-[#1a1a1a] cursor-pointer transition-colors group last:border-0"
              >
                <td className="px-6 py-5">
                  <span className="text-gray-400 font-medium text-sm group-hover:text-gray-200">#{index + 1}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="text-gray-200 font-mono text-sm">{caseData.id}</span>
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex px-2.5 py-1 bg-[#222222] border border-[#333] text-gray-300 rounded-md text-xs font-medium">
                    {caseData.type}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {/* ADDED justify-center here to snap the circle to the exact middle */}
                  <div className="flex items-center justify-center">
                    <PriorityGauge score={caseData.priorityScore} />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-gray-400 text-sm leading-relaxed max-w-2xl group-hover:text-gray-300 transition-colors line-clamp-2">
                    {caseData.summary}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}