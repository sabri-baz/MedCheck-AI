import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Activity } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      navigate('/');
    } catch (err) {
      setError('Geçersiz email veya şifre');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* Sol Kolon - Form Alanı */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 border-r border-slate-100 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 sm:p-12 shadow-lg shadow-blue-900/5 rounded-3xl border border-slate-100 flex flex-col justify-center">
          <div>
            <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 mb-6">
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">
              Tekrar Hoşgeldiniz
            </h2>
            <p className="mt-3 text-sm text-gray-500 text-center mb-8">
              Sağlık paneline güvenli giriş yapın
            </p>
          </div>
          
          <form className="space-y-6 flex-1" onSubmit={handleLogin}>
            {error && <div className="text-red-600 text-sm py-3 px-4 text-center font-medium bg-red-50 rounded-xl border border-red-100">{error}</div>}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-posta Adresi</label>
                <input
                  type="email"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="admin@admin.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">Şifre</label>
                  <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">Şifremi Unuttum?</a>
                </div>
                <input
                  type="password"
                  required
                  className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all sm:text-sm bg-slate-50 focus:bg-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-blue-500/20 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Giriş Yap
              </button>
            </div>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-400 font-medium">Veya</span>
              </div>
            </div>

            <button
              type="button"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google ile Giriş Yap
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-500 hover:underline transition-all">
              Hemen Kayıt Olun
            </Link>
          </p>
        </div>
      </div>

      {/* Sağ Kolon - Vizyon & İlgi Çekici Alan */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-blue-600 via-blue-500 to-teal-400 items-center justify-center p-12 overflow-hidden">
        {/* Dekoratif Arkaplan Objeleri */}
        <div className="absolute top-0 left-0 w-full h-full opacity-40">
          <div className="absolute top-20 left-12 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl animate-[pulse_8s_ease-in-out_infinite]"></div>
          <div className="absolute top-40 right-20 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl animate-[pulse_10s_ease-in-out_infinite_2s]"></div>
          <div className="absolute bottom-20 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl animate-[pulse_12s_ease-in-out_infinite_4s]"></div>
        </div>

        <div className="relative z-10 w-full max-w-xl flex flex-col items-center">
          {/* Glowing Icon */}
          <div className="relative mb-10 w-24 h-24 flex justify-center items-center">
            <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse"></div>
            <div className="absolute inset-0 bg-blue-300/40 blur-2xl rounded-full"></div>
            <Activity className="h-16 w-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] z-10" />
          </div>

          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight text-center mb-6 drop-shadow-md">
            İlaç Yönetiminde<br/>Yapay Zeka Dönemi
          </h1>
          <p className="text-lg text-blue-100 font-medium leading-relaxed max-w-md mx-auto text-center mb-12 drop-shadow">
            MedCheck AI ile reçetelerinizi dijitalleştirin, ilaç etkileşimlerini anında analiz edin ve tedavi sürecinizi güvenle takip edin.
          </p>

          {/* Floating UI Elements */}
          <div className="relative w-full h-64">
            {/* Kart 1 */}
            <div className="absolute top-0 left-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-[bounce_8s_infinite] flex items-center transform -rotate-3">
              <span className="text-2xl mr-3">💊</span>
              <div>
                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-0.5">Yapay Zeka Analizi</p>
                <p className="text-sm font-bold text-white tracking-wide">Akıllı Etkileşim Analizi</p>
              </div>
            </div>

            {/* Kart 2 */}
            <div className="absolute bottom-0 right-4 px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl animate-[bounce_6s_infinite_1s] flex items-center transform rotate-2">
              <span className="text-2xl mr-3">🛡️</span>
              <div>
                <p className="text-xs text-blue-200 font-medium uppercase tracking-wider mb-0.5">Veri Gizliliği</p>
                <p className="text-sm font-bold text-white tracking-wide">Uçtan Uca Güvenlik</p>
              </div>
            </div>

             {/* Kart 3 */}
             <div className="absolute top-32 right-20 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 shadow-xl animate-[bounce_7s_infinite_3s] flex items-center z-0 opacity-80">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 mr-2.5 animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></div>
              <span className="text-xs font-semibold text-white tracking-wider">Sistem Aktif ve Korunuyor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
