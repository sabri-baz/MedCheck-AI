import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Pill, FileText, Trash2 } from 'lucide-react';
import { getRiskStatus } from '../utils/risk';

export default function Medicines() {
  const { medicines, loading, error, openDeleteModal, searchTerm } = useOutletContext();

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tüm İlaçlarım</h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1">Kayıtlı tüm ilaçlarınızı buradan görüntüleyebilir, silebilir ve detaylarına ulaşabilirsiniz.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-500 dark:text-slate-400 font-medium">İlaçlar yükleniyor...</span>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
          {error}
        </div>
      ) : medicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12">
          <div className="w-20 h-20 bg-slate-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <Pill className="w-10 h-10 text-slate-300 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-slate-700 dark:text-gray-300 mb-2">Henüz bir ilaç eklemediniz</h3>
          <p className="text-slate-500 dark:text-gray-400 text-center max-w-sm">
            Sol menüdeki "Yeni İlaç Ekle" butonunu kullanarak tedavi planınızı oluşturabilirsiniz.
          </p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 mt-12">
          <h3 className="text-lg font-medium text-slate-600 dark:text-gray-400 mb-2">"{searchTerm}" ile eşleşen ilaç bulunamadı.</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedicines.map((med, index) => {
            const risk = getRiskStatus(med);
            const Icon = risk.icon;
            
            return (
              <div 
                key={med.id || index}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col relative group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                    <Pill className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openDeleteModal(med.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
                      title="İlacı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${risk.badgeColor}`}>
                      <Icon className="w-3.5 h-3.5 mr-1.5" />
                      {risk.label}
                    </span>
                  </div>
                </div>
                
                <div className="mt-2">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3">
                    {med.name}
                  </h3>
                  
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center text-sm text-slate-500 dark:text-gray-400">
                      <span className="w-16 font-medium">Dozaj:</span>
                      <span className="text-slate-700 dark:text-gray-300 font-semibold">{med.dosage}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-500 dark:text-gray-400">
                      <span className="w-16 font-medium">Saat:</span>
                      <span className="text-slate-700 dark:text-gray-300 font-semibold">{med.time || med.frequency || '-'}</span>
                    </div>
                    {med.totalPills > 0 && med.dailyDose > 0 && (
                      <div className="flex items-center text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1.5 rounded-md mt-2">
                        <span className="font-semibold text-xs">
                          Kalan: {med.totalPills} adet ({Math.floor(med.totalPills / med.dailyDose)} günlük)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Detay Raporu Butonu */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-gray-700">
                  <button 
                    onClick={() => console.log('Detay açılacak:', med.name)}
                    className="w-full flex items-center justify-center py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    AI Detay Raporu
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
