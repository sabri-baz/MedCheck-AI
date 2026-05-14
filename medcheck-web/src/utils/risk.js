import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export const getRiskStatus = (medicine) => {
  if (medicine.aiRiskLevel) {
    if (medicine.aiRiskLevel === 'high_risk') {
      return { label: 'Yüksek Risk', badgeColor: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/50', icon: AlertTriangle };
    }
    if (medicine.aiRiskLevel === 'medium_risk') {
      return { label: 'Orta Risk', badgeColor: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50', icon: Activity };
    }
    return { label: 'Güvenli', badgeColor: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:border-green-800/50', icon: ShieldCheck };
  }

  const name = medicine.name?.toLowerCase() || '';
  if (name.includes('aspirin') || name.includes('warfarin') || name.includes('coraspin')) {
    return { label: 'Yüksek Risk', badgeColor: 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/20 dark:border-red-800/50', icon: AlertTriangle };
  }
  if (name.includes('metformin')) {
    return { label: 'Orta Risk', badgeColor: 'bg-orange-50 text-orange-600 border border-orange-100 dark:bg-orange-900/20 dark:border-orange-800/50', icon: Activity };
  }
  return { label: 'Güvenli', badgeColor: 'bg-green-50 text-green-600 border border-green-100 dark:bg-green-900/20 dark:border-green-800/50', icon: ShieldCheck };
};
