import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Trash2, Search, Bell, Settings, User, 
  Plus, Grid, Pill, Activity, ShieldCheck, AlertTriangle, List,
  Moon, Sun
} from 'lucide-react';

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal State'leri
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDrugInput, setNewDrugInput] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [medicineIdToDelete, setMedicineIdToDelete] = useState(null);
  
  // Dropdown State'leri
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
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

  // Kullanıcı bilgisi localStorage'dan alınıyor
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.fullName || 'Dr. Yılmaz'; // Gelen isim yoksa görseldeki varsayılan isim

  useEffect(() => {
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

  // Dinamik Risk Status Hesaplayıcı (Görseldeki renklere uygun)
  const getRiskStatus = (medicine) => {
    // AI'dan dönen dinamik risk değeri varsa öncelikli kullan
    if (medicine.aiRiskLevel) {
      if (medicine.aiRiskLevel === 'high_risk') {
        return { label: 'Yüksek Risk', badgeColor: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/50', icon: AlertTriangle };
      }
      if (medicine.aiRiskLevel === 'medium_risk') {
        return { label: 'Orta Risk', badgeColor: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50', icon: Activity };
      }
      return { label: 'Güvenli', badgeColor: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:border-green-800/50', icon: ShieldCheck };
    }

    // Yoksa (veya sayfa yenilendiyse) fallback statik kuralı kullan
    const name = medicine.name?.toLowerCase() || '';
    if (name.includes('aspirin') || name.includes('warfarin') || name.includes('coraspin')) {
      return { label: 'Yüksek Risk', badgeColor: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/50', icon: AlertTriangle };
    }
    if (name.includes('metformin')) {
      return { label: 'Orta Risk', badgeColor: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50', icon: Activity };
    }
    return { label: 'Güvenli', badgeColor: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:border-green-800/50', icon: ShieldCheck };
  };

  const handleAddMedicine = async () => {
    const drugName = newDrugInput.trim();
    if (!drugName) return;

    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const currentMedicines = medicines.map(m => m.name);

      // 1. Yapay zeka servisinden analiz al
      const aiResponse = await axios.post('http://localhost:5000/api/ai/analyze', {
        drugName: drugName,
        currentMedicines: currentMedicines
      }, config);

      const aiData = aiResponse.data;
      const message = aiData.short_explanation || aiData.message || "Bilinmeyen risk detayı";

      // 2. Risk durumunu alert ile göster
      if (aiData.risk_level === 'high_risk') {
        alert(`🚨 YÜKSEK RİSK UYARISI:\n\n${message}`);
      } else if (aiData.risk_level === 'medium_risk') {
        alert(`⚠️ ORTA RİSK:\n\n${message}`);
      } else {
        alert(`✅ GÜVENLİ:\n\n${message}`);
      }

      // 3. İlacı backend'e kaydet
      const newMedData = {
        name: drugName,
        dosage: 'Standart Doz',
        time: 'Günde 1'
      };
      
      const dbResponse = await axios.post('http://localhost:5000/api/medicines', newMedData, config);
      
      // 4. Tabloya AI risk sonucu ile birlikte ekle
      const newMedWithRisk = {
        ...dbResponse.data,
        aiRiskLevel: aiData.risk_level
      };
      
      setMedicines(prev => [newMedWithRisk, ...prev]);
      
      // İşlem başarılı olunca Modal'ı kapat ve input'u temizle
      setIsAddModalOpen(false);
      setNewDrugInput('');

    } catch (err) {
      console.error("AI analizi veya ilaç ekleme hatası:", err);
      alert("İşlem sırasında bir hata oluştu.");
    }
  };


  const handleDeleteMedicine = async () => {
    if (!medicineIdToDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      await axios.delete(`http://localhost:5000/api/medicines/${medicineIdToDelete}`, config);
      
      // Silme başarılıysa state'i güncelleyerek UI'dan hemen kaldır
      setMedicines(prevMedicines => prevMedicines.filter(med => med.id !== medicineIdToDelete));
      
      // İşlem başarılı olunca Modal'ı kapat
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

  // ------------------ İSTATİSTİK HESAPLAMALARI ------------------
  const totalMedicines = medicines.length;
  const highRiskCount = medicines.filter(m => getRiskStatus(m).label === 'Yüksek Risk').length;
  const safeCount = medicines.filter(m => getRiskStatus(m).label === 'Güvenli').length;

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
          <a href="#" className="flex items-center px-3 py-2.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg font-medium border-l-4 border-blue-600 transition-colors">
            <Grid className="w-5 h-5 mr-3" />
            Ana Sayfa
          </a>
          <a href="#" className="flex items-center px-3 py-2.5 text-slate-600 dark:text-gray-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-700 rounded-lg transition-colors border-l-4 border-transparent">
            <Pill className="w-5 h-5 mr-3" />
            İlaçlarım
          </a>
        </nav>

        {/* Sidebar Alt İşlemler */}
        <div className="p-4 mt-auto border-t border-slate-100 dark:border-gray-700 space-y-2">
          {/* Koyu Mod Butonu */}
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

          {/* Çıkış Yap Butonu */}
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
                placeholder="Ara..." 
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
                    <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      Bildirim Tercihleri
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      Sistem Durumu
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
                  <div className="py-2">
                    <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      Profilimi Düzenle
                    </button>
                    <button className="w-full px-4 py-2 text-left text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                      Hesap Ayarları
                    </button>
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

        {/* Kaydırılabilir İçerik Alanı */}
        <div className="flex-1 overflow-auto p-8">
          
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
            {/* Kart 1: Toplam İlaç */}
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

            {/* Kart 2: Kritik Etkileşimler */}
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

            {/* Kart 3: Güvenli Kullanım */}
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

            {/* Kart 4: Sistem Durumu */}
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

          {/* ------------------ TABLO (İlaç Listesi) ------------------ */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="px-6 py-5 flex justify-between items-center border-b border-slate-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center">
                <List className="w-5 h-5 mr-2 text-slate-400" />
                İlaç Listesi
              </h3>
              <button className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Tümünü Gör
              </button>
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
              ) : medicines.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    <Pill className="w-8 h-8 text-slate-300 dark:text-gray-500" />
                  </div>
                  <p className="text-slate-500 dark:text-gray-400 font-medium">Sistemde kayıtlı herhangi bir ilaç bulunamadı.</p>
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
                      {medicines.map((med, index) => {
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
                                onClick={() => {
                                  setMedicineIdToDelete(med.id);
                                  setIsDeleteModalOpen(true);
                                }}
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
      </main>

      {/* ------------------ MODAL (Yeni İlaç Ekle) ------------------ */}
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
            
            <div className="mb-6">
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
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                İptal
              </button>
              <button 
                onClick={handleAddMedicine}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center"
              >
                <Activity className="w-4 h-4 mr-2" />
                Analiz Et ve Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------ MODAL (İlaç Sil) ------------------ */}
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

    </div>
  );
}
