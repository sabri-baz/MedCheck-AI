const axios = require('axios');

/**
 * OpenFDA API'den ilaç bilgilerini çeker
 * @param {string} drugName İlaç adı (Ticari veya etken madde)
 * @returns {Object|null} İlaç bilgileri veya bulunamazsa null
 */
const getDrugInfo = async (drugName) => {
  try {
    const url = `https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"+OR+openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`;
    const response = await axios.get(url);

    if (response.data && response.data.results && response.data.results.length > 0) {
      const data = response.data.results[0];
      const openfda = data.openfda || {};

      return {
        brand_name: openfda.brand_name ? openfda.brand_name.join(', ') : 'Belirtilmemiş',
        generic_name: openfda.generic_name ? openfda.generic_name.join(', ') : 'Belirtilmemiş',
        warnings: data.warnings ? data.warnings.join(' ') : 'Uyarı bulunamadı.',
        drug_interactions: data.drug_interactions ? data.drug_interactions.join(' ') : 'Etkileşim bilgisi bulunamadı.',
        indications_and_usage: data.indications_and_usage ? data.indications_and_usage.join(' ') : 'Kullanım amacı bulunamadı.'
      };
    }
    
    return null; // İlaç bulunamadı
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`[FDA API] İlaç bulunamadı: ${drugName}`);
      return null;
    }
    console.error(`[FDA API] İstek hatası (${drugName}):`, error.message);
    throw new Error('FDA servisinden veri çekilirken hata oluştu.');
  }
};

module.exports = {
  getDrugInfo
};
