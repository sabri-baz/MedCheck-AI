import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LogOut, Trash2, Search, Bell, Settings, User, 
  Plus, Grid, Pill, Activity, ShieldCheck, AlertTriangle, FileText,
  Moon, Sun, ClipboardList, Calendar
} from 'lucide-react';

export default function Layout() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State'leri
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('fast'); // 'fast' | 'routine'
  const [newDrugInput, setNewDrugInput] = useState('');
  const [newDrugTime, setNewDrugTime] = useState('');
  const [newDrugTotalPills, setNewDrugTotalPills] = useState('');
  const [newDrugDailyDose, setNewDrugDailyDose] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [medicineIdToDelete, setMedicineIdToDelete] = useState(null);
  
  // AI Analiz State'leri
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResultData, setAiResultData] = useState(null);
  
  // Dropdown State'leri
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Search State for Medicines Page (we can hoist it if we want the top bar to filter, but top bar is here in Layout!)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  
  // Koyu Mod State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const navigate = useNavigate();
  const location = useLocation();

  // Kullanıcı bilgisi
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.fullName || 'Dr. Yılmaz';

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const response = await axios.get('http://localhost:5000/api/medicines', config);
      setMedicines(response.data);
      setError(null);
    } catch (err) {
      console.error('Veri çekme hatası:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      } else {
        setError('İlaç verileri yüklenirken bir hata oluştu. Backendin çalıştığından emin olun.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // Dışarı tıklama ve ESC tuşu ile menüleri kapatma
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setIsProfileOpen(false);
        setIsSettingsOpen(false);
      }
    };
    
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  // Koyu Mod Efekti
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAddMedicine = async () => {
    const drugName = newDrugInput.trim();
    if (!drugName) return;

    setIsAnalyzing(true);

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const currentMedicinesNames = medicines.map(m => m.name);

      const aiResponse = await axios.post('http://localhost:5000/api/ai/analyze', {
        drugName: drugName,
        currentMedicines: currentMedicinesNames,
        isQuickCheck: activeTab === 'fast',
        newMedData: activeTab === 'routine' ? {
          name: drugName,
          dosage: 'Standart Doz',
          time: newDrugTime || 'Günde 1',
          totalPills: parseInt(newDrugTotalPills) || 0,
          dailyDose: parseInt(newDrugDailyDose) || 1
        } : null
      }, config);

      const aiData = aiResponse.data;
      const message = aiData.message || "Bilinmeyen risk detayı";
      const finalRiskLevel = aiData.risk || 'low_risk';

      setAiResultData({
        risk_level: finalRiskLevel,
        message: message,
        visible: true
      });

      if (activeTab === 'routine' && aiData.savedMedicine) {
        setMedicines(prev => [aiData.savedMedicine, ...prev]);
      }
      
      setIsAddModalOpen(false);
      setNewDrugInput('');
      setNewDrugTime('');
      setNewDrugTotalPills('');
      setNewDrugDailyDose('');
      setActiveTab('fast');

    } catch (err) {
      console.error("AI analizi veya ilaç ekleme hatası:", err);
      alert("İşlem sırasında bir hata oluştu.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const openDeleteModal = (id) => {
    setMedicineIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteMedicine = async () => {
    if (!medicineIdToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.delete(`http://localhost:5000/api/medicines/${medicineIdToDelete}`, config);
      
      setMedicines(prevMedicines => prevMedicines.filter(med => med.id !== medicineIdToDelete));
      
      setIsDeleteModalOpen(false);
      setMedicineIdToDelete(null);
    } catch (err) {
      console.error('Silme hatası:', err);
      if (err.response && err.response.status === 401) {
        handleLogout();
      } else {
        alert('İlaç silinirken bir hata oluştu.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900 flex font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
      
      {/* ------------------ SIDEBAR (Sol Menü) ------------------ */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700 flex flex-col transition-colors duration-200">
        <div className="p-6">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">MedCheck AI</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">Clinical Precision</p>
        </div>
        
        <div className="px-4 mb-6">
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg flex items-center justify-center font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni İlaç Ekle / Analiz
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <Link 
            to="/" 
            className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors border-l-4 ${location.pathname === '/' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border-transparent'}`}
          >
            <Grid className="w-5 h-5 mr-3" />
            Ana Sayfa
          </Link>
          <Link 
            to="/medicines" 
            className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors border-l-4 ${location.pathname === '/medicines' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border-transparent'}`}
          >
            <Pill className="w-5 h-5 mr-3" />
            İlaçlarım
          </Link>
          <Link 
            to="/reports" 
            className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors border-l-4 ${location.pathname === '/reports' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border-transparent'}`}
          >
            <FileText className="w-5 h-5 mr-3" />
            AI Raporları
          </Link>
          <Link 
            to="/profile" 
            className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors border-l-4 ${location.pathname === '/profile' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border-transparent'}`}
          >
            <ClipboardList className="w-5 h-5 mr-3" />
            Tıbbi Kayıtlarım
          </Link>
          <Link 
            to="/calendar" 
            className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors border-l-4 ${location.pathname === '/calendar' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 border-blue-600' : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 border-transparent'}`}
          >
            <Calendar className="w-5 h-5 mr-3" />
            Takvimim
          </Link>
        </nav>

        {/* Sidebar Alt İşlemler */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-gray-700 space-y-2">
          <button 
            onClick={() => setIsDarkMode(prev => !prev)}
            className="flex items-center w-full px-3 py-2 text-slate-500 dark:text-gray-400 font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                Açık Mod
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                Koyu Mod
              </>
            )}
          </button>

          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-slate-500 dark:text-gray-400 font-medium hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* ------------------ MAIN CONTENT (Ana İçerik) ------------------ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Üst Header */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 flex items-center justify-between px-8 transition-colors duration-200 shrink-0">
          <div className="flex items-center w-96">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                placeholder="İlaçlarda Ara..." 
                className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-md pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4 text-slate-500 dark:text-gray-400">
            <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
            </button>
            
            {/* Ayarlar (Settings) Dropdown */}
            <div className="relative dropdown-container">
              <button 
                onClick={() => {
                  setIsSettingsOpen(!isSettingsOpen);
                  setIsProfileOpen(false);
                }}
                className={`p-1.5 rounded-full transition-colors ${isSettingsOpen ? 'bg-slate-200 dark:bg-gray-700 text-slate-800 dark:text-white' : 'hover:bg-slate-100 dark:hover:bg-gray-700'}`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {isSettingsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-white">Ayarlar</h4>
                  </div>
                  <div className="py-2">
                    <button 
                      onClick={() => setIsDarkMode(!isDarkMode)}
                      className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                    >
                      Açık/Koyu Mod
                      <div className={`w-8 h-4 rounded-full flex items-center px-0.5 transition-colors ${isDarkMode ? 'bg-blue-600' : 'bg-slate-300'}`}>
                        <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${isDarkMode ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profil Dropdown */}
            <div className="relative dropdown-container">
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsSettingsOpen(false);
                }}
                className={`w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center border transition-all overflow-hidden ${isProfileOpen ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-blue-200 dark:border-blue-700 hover:border-blue-300'}`}
              >
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{userName}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 truncate">{user.email || 'sabri.baz@medcheck.com'}</p>
                  </div>
                  <div className="border-t border-slate-100 dark:border-gray-700 py-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Çıkış Yap
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dinamik İçerik (Dashboard veya Medicines) */}
        <div className="flex-1 overflow-auto bg-transparent">
          <Outlet context={{ 
            medicines, 
            loading, 
            error, 
            openDeleteModal, 
            userName,
            searchTerm: globalSearchTerm 
          }} />
        </div>
      </main>

      {/* ------------------ MODALLAR ------------------ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-slate-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Yeni İlaç Ekle</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
              >
                <Plus className="w-6 h-6 transform rotate-45" />
              </button>
            </div>
            
            <div className="flex bg-slate-100 dark:bg-gray-700/50 p-1 rounded-lg mb-6">
              <button 
                onClick={() => setActiveTab('fast')}
                className={`group relative flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'fast' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
              >
                Hızlı Kontrol
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-normal text-center p-2 rounded-lg shadow-xl z-50">
                  İlacı listeye kaydetmeden, sadece anlık etkileşim riskini kontrol eder.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('routine')}
                className={`group relative flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'routine' ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'}`}
              >
                Düzenli İlacım
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-normal text-center p-2 rounded-lg shadow-xl z-50">
                  İlacı envanterinize kaydeder ve günlük tedavi planınıza ekler.
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </button>
            </div>
            
            <div className={activeTab === 'fast' ? 'mb-6' : 'mb-4'}>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                İlaç Adı
              </label>
              <input
                type="text"
                value={newDrugInput}
                onChange={(e) => setNewDrugInput(e.target.value)}
                placeholder="Örn: Aspirin, Warfarin..."
                className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                autoFocus
              />
            </div>
            
            {activeTab === 'routine' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                    Kullanım Saati / Sıklığı
                  </label>
                  <input
                    type="text"
                    value={newDrugTime}
                    onChange={(e) => setNewDrugTime(e.target.value)}
                    placeholder="Örn: Sabah, Günde 2 kez..."
                    className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Toplam Adet <span className="text-slate-400 text-xs font-normal">(Opsiyonel)</span>
                    </label>
                    <input
                      type="number"
                      value={newDrugTotalPills}
                      onChange={(e) => setNewDrugTotalPills(e.target.value)}
                      placeholder="Örn: 30"
                      className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                      Günlük Dozaj <span className="text-slate-400 text-xs font-normal">(Opsiyonel)</span>
                    </label>
                    <input
                      type="number"
                      value={newDrugDailyDose}
                      onChange={(e) => setNewDrugDailyDose(e.target.value)}
                      placeholder="Örn: 2"
                      className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                    />
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleAddMedicine}
                disabled={isAnalyzing}
                className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm transition-colors flex items-center ${isAnalyzing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Analiz Ediliyor... ⏳
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 mr-2" />
                    {activeTab === 'fast' ? 'Sadece Analiz Et' : 'Analiz Et ve Listeme Ekle'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all border border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-2">İlacı Sil</h3>
            <p className="text-sm text-center text-slate-500 dark:text-gray-400 mb-6">
              <strong className="text-slate-700 dark:text-gray-300">"{medicines.find(m => m.id === medicineIdToDelete)?.name || 'Bu'}"</strong> ilacını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setMedicineIdToDelete(null);
                }}
                className="px-4 py-2.5 w-full text-sm font-medium text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleDeleteMedicine}
                className="px-4 py-2.5 w-full text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {aiResultData && aiResultData.visible && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity p-4">
          <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.3)] w-full max-w-lg p-1 overflow-hidden transform transition-all ${
            aiResultData.risk_level === 'high_risk' 
              ? 'bg-gradient-to-br from-red-500 to-red-600 dark:from-red-600 dark:to-red-900 shadow-red-500/20' 
              : aiResultData.risk_level === 'medium_risk'
                ? 'bg-gradient-to-br from-orange-400 to-orange-500 dark:from-orange-500 dark:to-orange-800 shadow-orange-500/20'
                : 'bg-gradient-to-br from-green-400 to-green-500 dark:from-green-500 dark:to-green-800 shadow-green-500/20'
          }`}>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 sm:p-8 h-full flex flex-col">
              <div className="flex items-center justify-center mb-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center ${
                  aiResultData.risk_level === 'high_risk'
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 ring-4 ring-red-50 dark:ring-red-900/20'
                    : aiResultData.risk_level === 'medium_risk'
                      ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 ring-4 ring-orange-50 dark:ring-orange-900/20'
                      : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 ring-4 ring-green-50 dark:ring-green-900/20'
                }`}>
                  {aiResultData.risk_level === 'high_risk' && <AlertTriangle className="w-8 h-8 sm:w-10 sm:h-10" />}
                  {aiResultData.risk_level === 'medium_risk' && <Activity className="w-8 h-8 sm:w-10 sm:h-10" />}
                  {aiResultData.risk_level !== 'high_risk' && aiResultData.risk_level !== 'medium_risk' && <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10" />}
                </div>
              </div>
              
              <div className="text-center mb-8">
                <h3 className={`text-2xl sm:text-3xl font-black mb-4 ${
                  aiResultData.risk_level === 'high_risk' ? 'text-red-600 dark:text-red-400' :
                  aiResultData.risk_level === 'medium_risk' ? 'text-orange-600 dark:text-orange-400' :
                  'text-green-600 dark:text-green-400'
                }`}>
                  {aiResultData.risk_level === 'high_risk' ? 'Yüksek Risk Tespit Edildi' :
                   aiResultData.risk_level === 'medium_risk' ? 'Orta Düzey Etkileşim' :
                   'Güvenli Kullanım'}
                </h3>
                <div className="p-5 bg-slate-50 dark:bg-gray-700/50 rounded-xl border border-slate-100 dark:border-gray-600 text-left">
                  <p className="text-slate-700 dark:text-gray-300 font-medium leading-relaxed text-sm sm:text-base">
                    {aiResultData.message}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setAiResultData(null)}
                className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 text-lg ${
                  aiResultData.risk_level === 'high_risk' ? 'bg-red-600 hover:bg-red-700 hover:shadow-red-600/30' :
                  aiResultData.risk_level === 'medium_risk' ? 'bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/30' :
                  'bg-green-500 hover:bg-green-600 hover:shadow-green-500/30'
                }`}
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
