from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd

# 1. FastAPI Uygulamasını Başlat
app = FastAPI(title="MedCheck AI Risk Tahmin Servisi")

# 2. Eğittiğimiz Modeli Belleğe Yükle (Sunucu kalkarken 1 kere çalışır)
model = joblib.load('medcheck_risk_model.pkl')

# 3. Gelen İsteğin Formatını Belirle (Veri Doğrulama Güvenliği)
class PatientData(BaseModel):
    Yas: int
    Gunluk_Ilac_Sayisi: int
    Ilac_Saati: int
    Kronik_Hastalik: int
    Hafta_Sonu: int
    Adherence_Rate: float = 100.0  # Node.js'ten gelecek yeni Sadakat Oranı

# Sunucunun çalışıp çalışmadığını test etmek için kök dizin
@app.get("/")
def read_root():
    return {"mesaj": "🚀 MedCheck AI Makine Öğrenmesi Servisi Aktif!"}

# Node.js'ten gelen verileri alıp, modelden geçirip sonucu dönen asıl uç nokta
@app.post("/predict")
def predict_risk(data: PatientData):
    # DİKKAT: Modeli sadece eğitildiği 5 sütunla beslemeliyiz. 
    # Adherence_Rate'i ayırıyoruz, aksi takdirde model hata fırlatır.
    model_features = {
        "Yas": data.Yas,
        "Gunluk_Ilac_Sayisi": data.Gunluk_Ilac_Sayisi,
        "Ilac_Saati": data.Ilac_Saati,
        "Kronik_Hastalik": data.Kronik_Hastalik,
        "Hafta_Sonu": data.Hafta_Sonu
    }
    
    # Gelen JSON verisini modelin anladığı DataFrame (Tablo) formatına çevir
    df = pd.DataFrame([model_features])
    
    # Modelin Temel Tahmini (Base Risk)
    probabilities = model.predict_proba(df)[0] 
    base_risk = probabilities[1] * 100
    
    # --- DİNAMİK DAVRANIŞSAL ANALİZ (HEURİSTİK ÇARPAN) ---
    adherence = data.Adherence_Rate
    dynamic_risk = base_risk
    
    if adherence > 80.0:
        # Hasta düzenli, riski %20 oranında düşür
        dynamic_risk = base_risk * 0.8
    elif adherence < 50.0:
        # Hasta düzensiz, riski %50 oranında artır
        dynamic_risk = base_risk * 1.5
        
    # Güvenlik Ağı: Risk oranını %1 ile %95 arasında sınırla (Mantıksız değerleri önler)
    dynamic_risk = max(1.0, min(95.0, dynamic_risk))
    
    # Yeni dinamik riske göre alarm durumunu güncelle (Örn: Risk %30'dan büyükse alarm ver)
    alarm_needed = bool(dynamic_risk > 30.0)
    
    # Sonucu dış dünyaya (Node.js backend'ine) JSON olarak yolla
    return {
        # Python formatlı anahtarlar (Eski sisteme uyumluluk)
        "unutma_riski_yuzdesi": round(dynamic_risk, 2),
        "alarm_gerekli_mi": alarm_needed,
        
        # Node.js/React formatlı anahtarlar (Yeni sisteme uyumluluk)
        "unutmaRiskYuzdesi": round(dynamic_risk, 2),
        "alarmGerekliMi": alarm_needed
    }