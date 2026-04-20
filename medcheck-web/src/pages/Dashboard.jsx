import { useEffect, useState } from 'react';
import axios from 'axios';
import { Pill, Activity, User, LogOut, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState({ healthChecksCount: 0, usersCount: 0, medicinesCount: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [medsRes, statsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/medicines', config),
          axios.get('http://localhost:5000/api/stats', config)
        ]);
        
        setMedicines(medsRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response && err.response.status === 401) {
          handleLogout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Activity className="h-6 w-6 text-primary-600 mr-2" />
          <span className="font-bold text-xl text-gray-900">MedCheck AI</span>
        </div>
        <div className="flex flex-col flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <a href="#" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-lg bg-primary-50 text-primary-700">
            <Pill className="mr-3 h-5 w-5" /> İlaçlarım
          </a>
          <a href="#" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
            <Activity className="mr-3 h-5 w-5 text-gray-400" /> Analiz
          </a>
          <a href="#" className="flex items-center px-2 py-2.5 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-100">
            <User className="mr-3 h-5 w-5 text-gray-400" /> Profil
          </a>
        </div>
        <div className="p-4 border-t border-gray-200">
          <button onClick={handleLogout} className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 hover:text-red-600 transition-colors">
            <LogOut className="mr-3 h-5 w-5" /> Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Sağlık Paneli</h1>
          <div className="flex items-center">
            <span className="ml-3 text-sm font-medium text-gray-700">Merhaba, {user.fullName || 'Kullanıcı'}</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
              <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Sistemdeki Hastalar</p>
                <p className="font-semibold text-2xl text-gray-900">{stats.usersCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
              <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Aktif İlaçlarım</p>
                <p className="font-semibold text-2xl text-gray-900">{medicines.filter(m => m.isActive).length}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
              <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Toplam Yapılan Analiz</p>
                <p className="font-semibold text-2xl text-gray-900">{stats.healthChecksCount}</p>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Güncel İlaç Listesi</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-500">Yükleniyor...</div>
            ) : medicines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İlaç Adı</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dozaj</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saat</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {medicines.map((med) => (
                      <tr key={med.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600">
                              <Pill className="h-5 w-5" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{med.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{med.dosage}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {med.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${med.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {med.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <Pill className="h-12 w-12 text-gray-300 mb-3" />
                <p>Henüz sistemde hiç ilacınız bulunmuyor.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
