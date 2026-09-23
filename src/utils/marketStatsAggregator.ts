export interface ScrapedAd {
  id: string;
  title: string;
  price: number;
  year?: number | null;
  km?: number | null;
  isPro?: boolean;
  location?: string;
  badge?: string;
  href?: string;
}

export interface ModelMarketStats {
  modelId: string;
  canonicalName: string;
  sampleCount: number;
  averagePrice: number;
  medianPrice: number;
  averageKm: number;
  medianKm: number;
  minPrice: number;
  maxPrice: number;
  minKm: number;
  maxKm: number;
  sweetSpotPrice: number; // Prix médian constaté le plus représentatif
  sweetSpotKm: number; // Kilométrage médian constaté
  mostAvailableSummary: string; // Ex: "Marché le plus disponible : 5 900 € pour ~73 000 km (25 annonces)"
  topAds: ScrapedAd[];
}

const QUADRICYCLE_REGEX = /\b(ami|twizy|twisy|aixam|ligier|microlino|chatenet|minauto|bellier|du[eé]|casalini|bluecar|bluesummer)\b/i;

/**
 * Détecte si un véhicule est un quadricycle sans permis à écarter des comparaisons VP
 */
export function isQuadricycleTitle(title: string): boolean {
  return QUADRICYCLE_REGEX.test(title);
}

/**
 * Associe une annonce brute LeBonCoin à l'identifiant canonique du modèle dans la base Stop-Carburant
 */
export function matchAdToModelId(adTitle: string, adYear?: number | null): string {
  if (isQuadricycleTitle(adTitle)) {
    return 'quadricycle-ignore';
  }

  const lower = adTitle.toLowerCase();

  // Dacia Spring
  if (lower.includes('spring')) {
    return 'dacia-spring-27';
  }

  // Zoé
  if (lower.includes('zoe') || lower.includes('zoé')) {
    if (lower.includes('52') || lower.includes('50') || lower.includes('r110') || lower.includes('r135') || (adYear && adYear >= 2020)) {
      return 'renault-zoe-r110-52';
    }
    return 'renault-zoe-r90-41';
  }

  // Peugeot e-208 / 208 électrique
  if (lower.includes('e-208') || lower.includes('e 208') || (lower.includes('208') && !lower.includes('2008') && !lower.includes('308'))) {
    return 'peugeot-e208-50';
  }

  // MG4
  if (lower.includes('mg4') || lower.includes('mg 4')) {
    return 'mg-mg4-luxury-64';
  }

  // Hyundai Kona
  if (lower.includes('kona')) {
    return 'hyundai-kona-ev-64';
  }

  // Fiat 500e / 500 électrique
  if (lower.includes('500') || lower.includes('500e')) {
    return 'fiat-500e-42';
  }

  // Nissan Leaf
  if (lower.includes('leaf')) {
    return 'nissan-leaf-40';
  }

  // Renault Twingo
  if (lower.includes('twingo')) {
    return 'renault-twingo-electric-22';
  }

  // Mégane E-Tech
  if (lower.includes('megane') || lower.includes('mégane')) {
    if (lower.includes('ev40') || lower.includes('40') || lower.includes('130') || lower.includes('equilibre') || lower.includes('équilibre')) {
      return 'renault-megane-ev40';
    }
    return 'renault-megane-ev60';
  }

  // Scénic E-Tech
  if (lower.includes('scenic') || lower.includes('scénic')) {
    return 'renault-scenic-ev87';
  }

  // Renault 5 E-Tech
  if (lower.includes('renault 5') || lower.includes('r5')) {
    return 'renault-5-ev52';
  }

  // Peugeot SUVs & Breaks (2008, 3008, 5008, 308 SW)
  if (lower.includes('2008') || lower.includes('e-2008') || lower.includes('e 2008')) {
    return 'peugeot-e2008-50';
  }
  if (lower.includes('3008') || lower.includes('e-3008') || lower.includes('e 3008')) {
    return 'peugeot-e3008-73';
  }
  if (lower.includes('5008') || lower.includes('e-5008') || lower.includes('e 5008')) {
    return 'peugeot-e5008-73';
  }
  if (lower.includes('308') || lower.includes('e-308') || lower.includes('e 308')) {
    return 'peugeot-e308-sw-54';
  }

  // VW ID.4
  if (lower.includes('id.4') || lower.includes('id4')) {
    return 'volkswagen-id4-pro-77';
  }

  // Audi Q4 e-tron
  if (lower.includes('q4')) {
    return 'audi-q4-etron-77';
  }

  // Škoda Enyaq
  if (lower.includes('enyaq')) {
    return 'skoda-enyaq-iv80-77';
  }

  // MG5 Break
  if (lower.includes('mg5') || lower.includes('mg 5')) {
    return 'mg-mg5-ev-61';
  }

  // Kia EV6
  if (/\b(ev-?6|ev\s+6)\b/i.test(lower)) {
    return 'kia-ev6-77';
  }

  // Ford Mustang Mach-E
  if (lower.includes('mach-e') || lower.includes('mach e') || (lower.includes('mustang') && lower.includes('ford'))) {
    return 'ford-mustang-mache-76';
  }

  // BMW i4
  if (/\bi4\b/i.test(lower)) {
    return 'bmw-i4-edrive40-81';
  }

  // Mini Countryman
  if (lower.includes('countryman')) {
    return 'mini-countryman-e-66';
  }

  // VW ID.3
  if (lower.includes('id.3') || lower.includes('id3')) {
    return 'volkswagen-id3-pro-58';
  }

  // Kia e-Niro
  if (lower.includes('niro')) {
    return 'kia-eniro-64';
  }

  // Opel Corsa-e
  if (lower.includes('corsa')) {
    return 'opel-corsa-e-50';
  }

  // BMW i3
  if (/\bi3\b/i.test(lower) && !lower.includes('id.3') && !lower.includes('id3')) {
    return 'bmw-i3-120ah';
  }

  // Smart Fortwo EQ
  if (lower.includes('smart') || lower.includes('fortwo')) {
    return 'smart-fortwo-eq';
  }

  // Citroën ë-C4 / e-C4
  if (!lower.includes('volvo') && !lower.includes('xc40') && !lower.includes('c40') && (lower.includes('citroën') || lower.includes('citroen')) && (lower.includes('c4') || lower.includes('ë-c4') || lower.includes('e-c4'))) {
    return 'citroen-ec4-50';
  }

  // Citroën C-Zéro / Peugeot iOn
  if (lower.includes('c-zero') || lower.includes('c-zéro') || lower.includes('czero') || /\b(i-?on)\b/i.test(lower)) {
    return 'citroen-czero-peugeot-ion';
  }

  // Tesla Model 3
  if (lower.includes('model 3') || (lower.includes('tesla') && !lower.includes('model y'))) {
    if (lower.includes('long range') || lower.includes('grande autonomie') || lower.includes('dual motor')) {
      return 'tesla-model-3-long-range';
    }
    return 'tesla-model-3-standard-60';
  }

  // Tesla Model Y
  if (lower.includes('model y')) {
    return 'tesla-model-y-propulsion';
  }

  return 'autre';
}

/**
 * Agrège les annonces constatées pour calculer la médiane, moyenne et fourchette de marché
 * Détermine le prix et kilométrage moyen le plus facilement disponible sur le marché de l'occasion.
 */
export function aggregateMarketStats(ads: ScrapedAd[]): Record<string, ModelMarketStats> {
  const grouped: Record<string, ScrapedAd[]> = {};

  for (const ad of ads) {
    if (!ad.price || ad.price <= 0) continue;
    const modelId = matchAdToModelId(ad.title, ad.year);
    if (modelId === 'quadricycle-ignore') continue;

    if (!grouped[modelId]) {
      grouped[modelId] = [];
    }
    grouped[modelId].push(ad);
  }

  const results: Record<string, ModelMarketStats> = {};

  for (const [modelId, modelAds] of Object.entries(grouped)) {
    const validPrices = modelAds
      .map((a) => a.price)
      .filter((p): p is number => typeof p === 'number' && p >= 3000)
      .sort((a, b) => a - b);

    const validKms = modelAds
      .map((a) => a.km)
      .filter((k): k is number => typeof k === 'number' && k > 0)
      .sort((a, b) => a - b);

    const count = validPrices.length;
    if (count === 0) continue;

    const avgPrice = Math.round(validPrices.reduce((a, b) => a + b, 0) / count);
    const medianPrice = validPrices[Math.floor(count / 2)];

    const kmCount = validKms.length;
    const avgKm = kmCount > 0 ? Math.round(validKms.reduce((a, b) => a + b, 0) / kmCount) : 0;
    const medianKm = kmCount > 0 ? validKms[Math.floor(kmCount / 2)] : 0;

    const minPrice = validPrices[0];
    const maxPrice = validPrices[validPrices.length - 1];
    const minKm = kmCount > 0 ? validKms[0] : 0;
    const maxKm = kmCount > 0 ? validKms[kmCount - 1] : 0;

    // Détermination de l'offre la plus facilement disponible ("sweet spot" de disponibilité)
    const sweetSpotPrice = medianPrice;
    const sweetSpotKm = medianKm;

    const summary = kmCount > 0
      ? `Marché le plus disponible : ${sweetSpotPrice.toLocaleString('fr-FR')} € pour ~${sweetSpotKm.toLocaleString('fr-FR')} km (${count} annonce${count > 1 ? 's' : ''} analysée${count > 1 ? 's' : ''})`
      : `Marché le plus disponible : ${sweetSpotPrice.toLocaleString('fr-FR')} € (${count} annonce${count > 1 ? 's' : ''} analysée${count > 1 ? 's' : ''})`;

    // Top annonces représentatives (triées par pertinence / prix croissant)
    const sortedAds = [...modelAds].sort((a, b) => a.price - b.price).slice(0, 5);

    results[modelId] = {
      modelId,
      canonicalName: modelAds[0]?.title?.split('-')[0]?.trim() || modelId,
      sampleCount: count,
      averagePrice: avgPrice,
      medianPrice,
      averageKm: avgKm,
      medianKm,
      minPrice,
      maxPrice,
      minKm,
      maxKm,
      sweetSpotPrice,
      sweetSpotKm,
      mostAvailableSummary: summary,
      topAds: sortedAds,
    };
  }

  return results;
}
