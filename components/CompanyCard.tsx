
import React from 'react';
import type { Company } from '../types';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col justify-between hover:border-cyan-500 transition-all duration-300 shadow-lg">
      <div>
        <h3 className="text-xl font-bold text-cyan-400">{company.name}</h3>
        <p className="mt-2 text-slate-300">{company.description}</p>
      </div>
      <a
        href={company.website}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block bg-slate-700 hover:bg-slate-600 text-cyan-300 font-semibold py-2 px-4 rounded-md transition duration-300 text-center"
      >
        Visit Website & Apply
      </a>
    </div>
  );
};

export default CompanyCard;
