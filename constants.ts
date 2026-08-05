
import { Criterion, Alternative } from './types';

export const ALTERNATIVE_DESCRIPTIONS: Record<string, string> = {
  a1: 'En yüksek kalite ve performans sunuyor. Yüksek maliyet ve enerji tüketimi vardır. Teknolojik avantajları önemli görüyorsanız ideal seçimdir.',
  a2: 'En düşük maliyetli seçenek. Kalite ve özelliklerde sınırlamalar vardır. Bütçe kısıtlı projelerde uygun bir çözümdür.',
  a3: 'Maliyet ve performans dengesi sunuyor. Sürdürülebilirlik açısından en iyi seçimdir. Genel amaçlı uygulamalar için optimum tercih.',
  a4: 'En hızlı teslimat ve uygulama. Yüksek enerji tüketimi ve düşük esneklik vardır. Zaman kritik projeler için önerilir.',
};

export const INITIAL_CRITERIA: Criterion[] = [
  { id: 'c1', name: 'Maliyet (Cost)', weight: 0.25, isBenefit: false, unit: '$', description: 'Toplam operasyonel ve yatırım maliyeti', active: true },
  { id: 'c2', name: 'Kalite (Quality)', weight: 0.25, isBenefit: true, unit: '1-100', description: 'Hizmet veya ürünün kalite standartlarına uygunluğu', active: true },
  { id: 'c3', name: 'Sürdürülebilirlik', weight: 0.15, isBenefit: true, unit: 'ESG', description: 'Çevresel ve sosyal etki puanı', active: true },
  { id: 'c4', name: 'Zaman (Time)', weight: 0.15, isBenefit: false, unit: 'Gün', description: 'Proje tamamlanma süresi', active: true },
  { id: 'c5', name: 'Enerji Tüketimi', weight: 0.10, isBenefit: false, unit: 'kWh', description: 'Birim başına harcanan enerji', active: true },
  { id: 'c6', name: 'Esneklik', weight: 0.10, isBenefit: true, unit: '1-10', description: 'Değişen koşullara uyum sağlama yeteneği', active: true },
];

export const INITIAL_ALTERNATIVES: Alternative[] = [
  {
    id: 'a1',
    name: 'Opsiyon A (Yüksek Teknoloji)',
    scores: { c1: 85000, c2: 95, c3: 88, c4: 45, c5: 120, c6: 9 }
  },
  {
    id: 'a2',
    name: 'Opsiyon B (Ekonomik Çözüm)',
    scores: { c1: 42000, c2: 72, c3: 65, c4: 20, c5: 150, c6: 5 }
  },
  {
    id: 'a3',
    name: 'Opsiyon C (Dengeli Hibrit)',
    scores: { c1: 60000, c2: 84, c3: 92, c4: 35, c5: 90, c6: 7 }
  },
  {
    id: 'a4',
    name: 'Opsiyon D (Hızlı Teslimat)',
    scores: { c1: 55000, c2: 70, c3: 50, c4: 10, c5: 180, c6: 4 }
  }
];
