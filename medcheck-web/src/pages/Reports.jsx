import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, FileText, Activity, AlertTriangle, ShieldCheck, Clock, Filter } from 'lucide-react';

export default function Reports() {
  const [filterRisk, setFilterRisk] = useState('all');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const response = await axios.get('http://localhost:5000/api/reports', config);
        // Ensure data is an array
        setReports(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Raporlar yüklenirken hata oluştu:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReports();
  }, []);

  const handlePrint = () => {
    console.log('PDF İndiriliyor...');
    window.print();
  };

  const filteredReports = reports.filter(r => {
    if (filterRisk === 'all') return true;
    return r.riskLevel === filterRisk;
  });

  const getRiskDetails = (level) => {
    switch (level) {
      case 'high_risk':
        return { label: 'Yüksek Risk', color: 'border-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', bullet: 'bg-red-500', icon: AlertTriangle };
      case 'medium_risk':
        return { label: 'Orta Risk', color: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', bullet: 'bg-orange-500', icon: Activity };
      default:
        return { label: 'Güvenli', color: 'border-green-500', bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', bullet: 'bg-green-500', icon: ShieldCheck };
    }
  };

  return (
    <div className="p-8 h-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            AI Analiz Raporları
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Geçmişte yapılan tüm yapay zeka analizlerinin detaylı dökümü.</p>
        </div>
        
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Filter className="w-4 h-4 text-slate-400" />
            </div>
            <select 
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 text-sm font-medium rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 pr-3 py-2.5 outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="all">Tüm Raporlar</option>
              <option value="high_risk">Yüksek Risk</option>
              <option value="medium_risk">Orta Risk</option>
              <option value="low_risk">Güvenli</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>

          <button 
            onClick={handlePrint}
            className="flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">PDF İndir</span>
            <span className="sm:hidden">İndir</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-slate-500 font-medium">Raporlar yükleniyor...</span>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700">
          <div className="w-20 h-20 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-slate-300 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-300 mb-2">Henüz bir yapay zeka analizi gerçekleştirilmedi</h3>
          <p className="text-slate-500 dark:text-gray-400 text-center max-w-sm">
            Yeni bir ilaç eklediğinizde yapay zekanın ürettiği raporlar burada listelenecektir.
          </p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 mt-12 bg-slate-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-slate-200 dark:border-gray-700 transition-all">
          <div className="w-12 h-12 bg-slate-100 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-3">
            <Filter className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-gray-400 font-medium text-center">
            Bu risk grubunda rapor bulunamadı.
          </p>
          <button 
            onClick={() => setFilterRisk('all')}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold"
          >
            Filtreyi Temizle
          </button>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-8 py-4 border-l-2 border-slate-200 dark:border-gray-700 space-y-8">
          {filteredReports.map((report) => {
            const risk = getRiskDetails(report.riskLevel);
            const Icon = risk.icon;
            
            // Format the date if it's an ISO string, otherwise just render it.
            // If the backend returns 'createdAt' we might need to parse it, 
            // but the mock used 'date'. We can fallback to `report.createdAt`.
            let displayDate = report.date;
            if (!displayDate && report.createdAt) {
              displayDate = new Date(report.createdAt).toLocaleString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
            
            // Format drugs array
            let drugsArray = report.medicines || [];
            if (typeof drugsArray === 'string') {
                try {
                    drugsArray = JSON.parse(drugsArray);
                } catch(e) {
                    drugsArray = [drugsArray];
                }
            }

            return (
              <div key={report.id} className="relative">
                {/* Timeline Noktası */}
                <div className="absolute -left-[21px] sm:-left-[37px] top-4 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 bg-white dark:bg-gray-800 shadow-sm z-10 flex items-center justify-center">
                  <div className={`w-2 h-2 rounded-full ${risk.bullet}`}></div>
                </div>

                {/* Kart İçeriği */}
                <div className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-l-4 border-y border-r border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow ${risk.color}`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                    <div className="flex items-center text-sm font-medium text-slate-500 dark:text-gray-400">
                      <Clock className="w-4 h-4 mr-1.5" />
                      {displayDate}
                    </div>
                    
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${risk.bg} ${risk.text}`}>
                      <Icon className="w-3.5 h-3.5 mr-1" />
                      {risk.label}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">İncelenen İlaçlar</h4>
                    <div className="flex flex-wrap gap-2">
                      {drugsArray.map((drug, idx) => (
                        <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-sm font-medium rounded-full">
                          {drug}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-slate-50 dark:bg-gray-700/50 rounded-lg border border-slate-100 dark:border-gray-600">
                    <p className="text-slate-700 dark:text-gray-300 leading-relaxed text-sm sm:text-base">
                      {report.aiMessage || 'Bu analiz için ek bir açıklama bulunamadı.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
