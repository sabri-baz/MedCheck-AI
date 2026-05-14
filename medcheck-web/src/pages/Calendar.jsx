import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock, CheckCircle2, Circle, Pill, AlertCircle } from 'lucide-react';

export default function Calendar() {
  const { medicines, loading } = useOutletContext();
  const [completedMeds, setCompletedMeds] = useState({});

  const toggleComplete = (id) => {
    setCompletedMeds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Sadece düzenli (routine) ilaçları filtrele (totalPills veya dailyDose bilgisi olanlar)
  const routineMedicines = medicines.filter(med => (med.totalPills > 0 || med.dailyDose > 0));

  // Zaman gruplarını tanımla
  const timeGroups = {
    "Sabah": [],
    "Öğle": [],
    "Akşam": [],
    "Gece": [],
    "Diğer": []
  };

  routineMedicines.forEach(med => {
    const time = (med.time || '').toLowerCase();
    if (time.includes('sabah')) timeGroups["Sabah"].push(med);
    else if (time.includes('öğle')) timeGroups["Öğle"].push(med);
    else if (time.includes('akşam')) timeGroups["Akşam"].push(med);
    else if (time.includes('gece')) timeGroups["Gece"].push(med);
    else timeGroups["Diğer"].push(med);
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto h-full overflow-y-auto">
      {/* Başlık Alanı */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
          <Clock className="w-6 h-6 mr-3 text-blue-600 dark:text-blue-400" />
          Günlük Tedavi Planı
        </h2>
        <p className="text-slate-500 dark:text-gray-400 mt-2">
          Bugün içmeniz gereken ilaçları buradan takip edebilir ve onaylayabilirsiniz.
        </p>
      </div>

      {routineMedicines.length === 0 ? (
        /* Boş Durum (Empty State) */
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-slate-300 dark:border-gray-700 shadow-sm transition-colors">
          <div className="w-16 h-16 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <Pill className="w-8 h-8 text-slate-300 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-300">Günlük tedavi planınızda şu an bir ilaç bulunmuyor.</h3>
          <p className="text-slate-500 dark:text-gray-400 mt-1 max-w-xs text-center">Düzenli ilaçlarınızı "Yeni İlaç Ekle" modalından "Düzenli İlacım" sekmesini kullanarak ekleyebilirsiniz.</p>
        </div>
      ) : (
        /* Modern Zaman Çizelgesi (Timeline) */
        <div className="space-y-12 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-gray-700">
          {Object.entries(timeGroups).map(([groupName, meds]) => (
            meds.length > 0 && (
              <div key={groupName} className="relative pl-12">
                {/* Timeline Dot & Icon */}
                <div className="absolute left-0 top-1 w-9 h-9 bg-white dark:bg-gray-800 border-2 border-blue-500 dark:border-blue-400 rounded-full flex items-center justify-center z-10 shadow-sm ring-4 ring-[#F8FAFC] dark:ring-gray-900 transition-colors">
                  <Clock className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>

                <h3 className="text-sm font-black text-slate-400 dark:text-gray-500 mb-6 uppercase tracking-[0.2em]">
                  {groupName}
                </h3>

                <div className="grid gap-4">
                  {meds.map(med => (
                    <div 
                      key={med.id}
                      className={`group flex items-center p-5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 ${completedMeds[med.id] ? 'opacity-40 grayscale scale-[0.98]' : ''}`}
                    >
                      {/* Interactive Checkbox */}
                      <button 
                        onClick={() => toggleComplete(med.id)}
                        className={`mr-5 p-1 rounded-full transition-all duration-300 transform group-hover:scale-110 ${completedMeds[med.id] ? 'text-green-500 bg-green-50 dark:bg-green-900/20' : 'text-slate-300 dark:text-gray-600 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
                      >
                        {completedMeds[med.id] ? (
                          <CheckCircle2 className="w-8 h-8" />
                        ) : (
                          <Circle className="w-8 h-8" />
                        )}
                      </button>

                      <div className="flex-1">
                        <h4 className={`text-lg font-bold text-slate-800 dark:text-white transition-all ${completedMeds[med.id] ? 'line-through' : ''}`}>
                          {med.name}
                        </h4>
                        <div className="flex flex-wrap items-center mt-2 gap-3 text-sm">
                          <span className="flex items-center font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg">
                            <Pill className="w-3.5 h-3.5 mr-1.5" />
                            {med.dosage || 'Standart Doz'}
                          </span>
                          <span className="text-slate-400 hidden sm:inline">•</span>
                          <span className="text-slate-500 dark:text-gray-400 italic">
                            {med.time}
                          </span>
                        </div>
                      </div>

                      {/* Low Stock Warning Badge */}
                      {med.totalPills < 5 && med.totalPills > 0 && !completedMeds[med.id] && (
                        <div className="hidden sm:flex items-center text-[10px] font-black uppercase tracking-tighter text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg border border-red-100 dark:border-red-800/50">
                          <AlertCircle className="w-3 h-3 mr-1.5" />
                          Stok Azaldı: {med.totalPills}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
