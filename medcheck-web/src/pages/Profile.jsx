import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Activity, AlertCircle, Save, Plus, X } from 'lucide-react';

export default function Profile() {
  const [profileData, setProfileData] = useState({
    firstName: 'Sabri',
    lastName: 'Baz',
    age: 35,
    weight: 75,
    height: 180,
    bloodType: 'A+'
  });

  const [chronicDiseases, setChronicDiseases] = useState(['Tip 2 Diyabet', 'Hipertansiyon']);
  const [allergies, setAllergies] = useState(['Penisilin']);

  const [diseaseInput, setDiseaseInput] = useState('');
  const [allergyInput, setAllergyInput] = useState('');

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = response.data;
      setChronicDiseases(data.chronicDiseases || []);
      setAllergies(data.allergies || []);
      setProfileData(prev => ({
        ...prev,
        height: data.height || '',
        weight: data.weight || '',
        bloodType: data.bloodType || 'A+'
      }));
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDisease = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = diseaseInput.trim();
      if (val && !chronicDiseases.includes(val)) {
        setChronicDiseases([...chronicDiseases, val]);
      }
      setDiseaseInput('');
    }
  };

  const handleRemoveDisease = (diseaseToRemove) => {
    setChronicDiseases(chronicDiseases.filter(d => d !== diseaseToRemove));
  };

  const handleAddAllergy = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      e.preventDefault();
      const val = allergyInput.trim();
      if (val && !allergies.includes(val)) {
        setAllergies([...allergies, val]);
      }
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergyToRemove) => {
    setAllergies(allergies.filter(a => a !== allergyToRemove));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/profile', {
        allergies,
        chronicDiseases,
        height: profileData.height,
        weight: profileData.weight,
        bloodType: profileData.bloodType
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Profil bilgileri başarıyla güncellendi.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Profil kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <div className="p-8 h-full max-w-5xl mx-auto overflow-y-auto">
      {/* Başlık Alanı */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center">
            <User className="w-6 h-6 mr-2 text-blue-600 dark:text-blue-400" />
            Tıbbi Kayıtlarım
          </h2>
          <p className="text-slate-500 dark:text-gray-400 mt-1">
            Kişisel ve tıbbi bilgilerinizi güncel tutarak AI analizlerinin daha doğru olmasını sağlayın.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Save className="w-4 h-4 mr-2" />
          Değişiklikleri Kaydet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Temel Bilgiler */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-gray-700 pb-3">
              <Activity className="w-5 h-5 mr-2 text-slate-400 dark:text-gray-500" />
              Temel Fiziksel Veriler
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Ad</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={profileData.firstName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Soyad</label>
                <input 
                  type="text" 
                  name="lastName"
                  value={profileData.lastName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Yaş</label>
                <input 
                  type="number" 
                  name="age"
                  value={profileData.age}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Kilo (kg)</label>
                <input 
                  type="number" 
                  name="weight"
                  value={profileData.weight}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Boy (cm)</label>
                <input 
                  type="number" 
                  name="height"
                  value={profileData.height}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-400 uppercase tracking-wider mb-1">Kan Grubu</label>
                <select 
                  name="bloodType"
                  value={profileData.bloodType}
                  onChange={handleInputChange}
                  className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors appearance-none cursor-pointer"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="0+">0+</option>
                  <option value="0-">0-</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Kronik Hastalıklar ve Alerjiler */}
        <div className="space-y-6">
          {/* Kronik Hastalıklar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-gray-700 pb-3">
              <Activity className="w-5 h-5 mr-2 text-orange-500" />
              Kronik Hastalıklar
            </h3>
            
            <div className="mb-4 relative">
              <input 
                type="text" 
                value={diseaseInput}
                onChange={(e) => setDiseaseInput(e.target.value)}
                onKeyDown={handleAddDisease}
                placeholder="Hastalık yazıp Enter'a basın..."
                className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 dark:text-white transition-colors"
              />
              <button 
                onClick={handleAddDisease}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-orange-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {chronicDiseases.length === 0 ? (
                <span className="text-sm text-slate-400 dark:text-gray-500 italic">Kayıtlı hastalık bulunmuyor.</span>
              ) : (
                chronicDiseases.map((disease, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800 rounded-full text-sm font-medium"
                  >
                    {disease}
                    <button 
                      onClick={() => handleRemoveDisease(disease)}
                      className="ml-1.5 p-0.5 hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Alerjiler */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-slate-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center border-b border-slate-100 dark:border-gray-700 pb-3">
              <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
              Alerjiler
            </h3>
            
            <div className="mb-4 relative">
              <input 
                type="text" 
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                onKeyDown={handleAddAllergy}
                placeholder="Alerji yazıp Enter'a basın..."
                className="w-full bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-lg pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-white transition-colors"
              />
              <button 
                onClick={handleAddAllergy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-500"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {allergies.length === 0 ? (
                <span className="text-sm text-slate-400 dark:text-gray-500 italic">Kayıtlı alerji bulunmuyor.</span>
              ) : (
                allergies.map((allergy, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-full text-sm font-medium"
                  >
                    {allergy}
                    <button 
                      onClick={() => handleRemoveAllergy(allergy)}
                      className="ml-1.5 p-0.5 hover:bg-red-200 dark:hover:bg-red-800 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
