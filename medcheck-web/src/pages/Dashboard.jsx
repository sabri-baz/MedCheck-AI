import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Pill, Activity, ShieldCheck, AlertTriangle, List, Grid, Trash2
} from 'lucide-react';
import { getRiskStatus } from '../utils/risk';

export default function Dashboard() {
  const { medicines, loading, error, userName, openDeleteModal } = useOutletContext();

  const totalMedicines = medicines.length;
  const highRiskMedicines = medicines.filter(m => getRiskStatus(m).label === 'Yüksek Risk');
  const highRiskCount = highRiskMedicines.length;
  const safeCount = medicines.filter(m => getRiskStatus(m).label === 'Güvenli').length;

  return (
    <div className="p-8 h-full">
      {/* Karşılama Alanı */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
          Hoş Geldiniz, {userName} <span className="ml-2">👋</span>
        </h2>
        <p className="text-slate-500 dark:text-gray-400 mt-1">
          Hasta ilaçları ve sistem durumu hakkındaki en güncel bilgiler burada.
        </p>
      </div>

      {/* 4 ÖZET KART (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Toplam İlaç</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{totalMedicines}</h3>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Pill className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Kritik Etkileşimler</p>
              <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</h3>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-4 flex items-center">
            <Activity className="w-3 h-3 mr-1" /> Action required
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Güvenli Kullanım</p>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white">{safeCount}</h3>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Sistem Durumu</p>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">AI Motoru Aktif</h3>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
          </div>
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-4 flex items-center">
            <Grid className="w-3 h-3 mr-1" /> Real-time monitoring active
          </p>
        </div>
      </div>

      {/* ------------------ TABLO (Dikkat Gerektiren İlaçlar) ------------------ */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Dikkat Gerektiren İlaçlar
          </h3>
          <Link to="/medicines" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
            Tüm İlaçları Gör
          </Link>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-500">Veriler yükleniyor...</span>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500 bg-red-50 dark:bg-red-900/20 m-4 rounded-lg border border-red-100 dark:border-red-800">
              {error}
            </div>
          ) : highRiskMedicines.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-green-500 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-700 dark:text-gray-200 mb-2">Harika!</h3>
              <p className="text-slate-500 dark:text-gray-400 font-medium">Tüm ilaçlarınız güvenli görünüyor. Riskli bir etkileşim tespit edilmedi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="bg-white dark:bg-gray-800 px-6 py-4 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700">İlaç Adı</th>
                    <th className="bg-white dark:bg-gray-800 px-6 py-4 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700">Dozaj</th>
                    <th className="bg-white dark:bg-gray-800 px-6 py-4 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700">Kullanım Saati</th>
                    <th className="bg-white dark:bg-gray-800 px-6 py-4 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700">Risk Durumu</th>
                    <th className="bg-white dark:bg-gray-800 px-6 py-4 text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider border-b border-slate-100 dark:border-gray-700 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {highRiskMedicines.map((med, index) => {
                    const risk = getRiskStatus(med);
                    const Icon = risk.icon;
                    return (
                      <tr key={med.id || index} className="hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-slate-800 dark:text-gray-200">{med.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500 dark:text-gray-400">{med.dosage}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500 dark:text-gray-400">{med.time || med.frequency || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1.5 rounded-md text-xs font-semibold ${risk.badgeColor}`}>
                            <Icon className="w-3.5 h-3.5 mr-1.5" />
                            {risk.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => openDeleteModal(med.id)}
                            className="inline-flex items-center justify-center w-8 h-8 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Text */}
      <div className="mt-8 text-center pb-4">
        <p className="text-xs text-slate-400 dark:text-gray-500">MedCheck AI v2.4.1 • Güvenli Tıbbi Ortam</p>
      </div>

    </div>
  );
}
