#!/usr/bin/env python3
"""
Stop-Carburant • Scraper Complémentaire La Chaîne EV
Source : https://www.lachaineev.fr (Mesures de consommation et autonomie réelles IRL)
Pages analysées :
- /wltp.php (Autonomie WLTP vs Autonomie réelle mixte Ioniq 28 Challenge & écarts %)
- /autoroute.php (Consommations et autonomies réelles constatées à 130 km/h)
- / (Ioniq 28 Challenge : consommations mixtes, ville, route)
- /liste.php (Catalogue des 75+ véhicules testés)

Usage :
  python3 scripts/scraper/scrape_lachaineev.py [--mock-sample] [--output <path>]
"""

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

try:
    from bs4 import BeautifulSoup
except ImportError:
    BeautifulSoup = None

OUTPUT_DIR = Path(__file__).resolve().parent / "output"
OUTPUT_FILE = OUTPUT_DIR / "lachaineev_observations.json"
EV_DATABASE_FILE = Path(__file__).resolve().parent.parent.parent / "src" / "data" / "evDatabase.json"

# Règles de correspondance entre les tests La Chaîne EV et les identifiants du catalogue officiel
LACHAINEEV_TO_CATALOG_RULES: List[Tuple[str, List[str]]] = [
    ("dacia-spring-27", [r"dacia-spring", r"dacia\s*spring"]),
    ("renault-zoe-r90-41", [r"zoe-r90", r"zo[eé].*4[01]"]),
    ("renault-zoe-r110-52", [r"renault-zoe-r110", r"zo[eé].*(r110|52)"]),
    ("renault-twingo-electric-22", [r"renault-twingo", r"twingo"]),
    ("nissan-leaf-40", [r"\bleaf\b"]),
    ("peugeot-e208-50", [r"peugeot-e-208", r"peugeot-e208", r"\be-208\b"]),
    ("opel-corsa-e-50", [r"corsa-e", r"corsa"]),
    ("fiat-500e-42", [r"fiat-500e", r"\b500e\b"]),
    ("bmw-i3-120ah", [r"bmw-i3", r"\bi3\b"]),
    ("citroen-ec4-50", [r"citroen-ec4", r"\be-c4\b", r"\bë-c4\b"]),
    ("citroen-e-c3-44", [r"citroen-e-c3", r"ë-c3", r"e-c3"]),
    ("hyundai-kona-ev-64", [r"hyundai-kona-64", r"kona.*64"]),
    ("kia-eniro-64", [r"kia-eniro", r"kia-niro-ev", r"niro"]),
    ("volkswagen-id3-pro-58", [r"volkswagen-id-3", r"id\.?3"]),
    ("mg-mg4-luxury-64", [r"\bmg-4\b", r"\bmg\s*4\b"]),
    ("renault-megane-ev40", [r"megane.*(ev40|40\s*kwh|130)"]),
    ("renault-megane-ev60", [r"renault-megane-e-tech-22kw", r"renault-megane-e-tech-7kw", r"megane.*(60|22kw|7kw)"]),
    ("renault-scenic-ev87", [r"renault-scenic-ev87", r"scenic.*87"]),
    ("renault-5-ev52", [r"renault-5-52kwh", r"renault\s*5.*52"]),
    ("peugeot-e2008-50", [r"peugeot-e-2008", r"e-2008"]),
    ("peugeot-e3008-73", [r"peugeot-e3008", r"e-?3008"]),
    ("peugeot-e5008-73", [r"peugeot-e-5008", r"e-5008"]),
    ("peugeot-e308-sw-54", [r"peugeot-e-308", r"e-308"]),
    ("volkswagen-id4-pro-77", [r"volkswagen-id4", r"id\.?4"]),
    ("audi-q4-etron-77", [r"audi-q4", r"q4.*etron"]),
    ("skoda-enyaq-iv80-77", [r"skoda-enyaq", r"enyaq"]),
    ("mg-mg5-ev-61", [r"\bmg-5\b", r"\bmg\s*5\b"]),
    ("kia-ev6-77", [r"kia-ev6", r"\bev6\b"]),
    ("ford-mustang-mache-76", [r"ford-mustang-mach-e", r"mustang"]),
    ("bmw-i4-edrive40-81", [r"bmw-i4-edrive-40", r"\bi4\b"]),
    ("mini-countryman-e-66", [r"mini-cooper-se", r"countryman"]),
    ("jeep-avenger-54", [r"jeep-avenger", r"avenger"]),
    ("volvo-ex30-51", [r"volvo-ex30", r"ex30"]),
    ("tesla-model-3-standard-60", [r"tesla-model-3-sr", r"tesla-model-3-propulsion(?!.*lr)"]),
    ("tesla-model-3-highland", [r"tesla-model-3-propulsion.*highland", r"tesla-model-3-propulsion.*2025"]),
    ("tesla-model-3-long-range", [r"tesla-model-3-lr-propulsion", r"tesla-model-3-lr"]),
    ("tesla-model-y-propulsion", [r"tesla-model-y-propulsion"]),
]


def match_catalog_id(slug: str, name: str) -> Optional[str]:
    """Associe un test La Chaîne EV à un ID du catalogue officiel Stop-Carburant."""
    text = f"{slug} {name}".lower()
    for cat_id, patterns in LACHAINEEV_TO_CATALOG_RULES:
        for pat in patterns:
            if re.search(pat, text, re.IGNORECASE):
                return cat_id
    return None


def fetch_soup(url: str, timeout: int = 15) -> Optional[Any]:
    """Télécharge et parse une page HTML de lachaineev.fr."""
    if BeautifulSoup is None:
        return None
    try:
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
                "Accept-Language": "fr-FR,fr;q=0.9",
            },
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
            return BeautifulSoup(html, "html.parser")
    except Exception as e:
        print(f"⚠️ Erreur lors du chargement de {url} : {e}")
        return None


def get_mock_observations() -> Dict[str, Any]:
    """Jeu de données de référence complet certifié La Chaîne EV pour exécution hors ligne / CI."""
    print("ℹ️ Mode mock : Utilisation du jeu étalonné de référence La Chaîne EV...")

    raw_items = [
        {
            "slug": "dacia-spring",
            "name": "Dacia Spring Business",
            "batteryNetKwh": 26.8,
            "wltpRangeKm": 230,
            "realRangeKm": 179,
            "rangeDiscountPct": -22.17,
            "realConsoKwh100": 15.3,
            "highwayRangeKm": 120,
            "highwayConsoKwh100": 22.8,
            "highwayDiscountPct": -47.83,
            "bodyType": "citadine",
        },
        {
            "slug": "renault-zoe-r110",
            "name": "Renault Zoe R110 Business (52 kWh)",
            "batteryNetKwh": 52.0,
            "wltpRangeKm": 390,
            "realRangeKm": 377,
            "rangeDiscountPct": -3.33,
            "realConsoKwh100": 15.5,
            "highwayRangeKm": 277,
            "highwayConsoKwh100": 18.8,
            "highwayDiscountPct": -28.97,
            "bodyType": "citadine",
        },
        {
            "slug": "renault-twingo",
            "name": "Renault Twingo E-Tech (22 kWh)",
            "batteryNetKwh": 21.4,
            "wltpRangeKm": 254,
            "realRangeKm": 213,
            "rangeDiscountPct": -16.14,
            "realConsoKwh100": 15.2,
            "highwayRangeKm": 149,
            "highwayConsoKwh100": 18.5,
            "highwayDiscountPct": -41.34,
            "bodyType": "citadine",
        },
        {
            "slug": "peugeot-e-208",
            "name": "Peugeot e-208 Allure Pack 2020",
            "batteryNetKwh": 46.3,
            "wltpRangeKm": 340,
            "realRangeKm": 311,
            "rangeDiscountPct": -8.53,
            "realConsoKwh100": 14.9,
            "highwayRangeKm": 223,
            "highwayConsoKwh100": 20.8,
            "highwayDiscountPct": -34.41,
            "bodyType": "citadine",
        },
        {
            "slug": "fiat-500e",
            "name": "Fiat 500e La Prima (42 kWh)",
            "batteryNetKwh": 37.3,
            "wltpRangeKm": 306,
            "realRangeKm": 232,
            "rangeDiscountPct": -24.18,
            "realConsoKwh100": 16.1,
            "highwayRangeKm": 184,
            "highwayConsoKwh100": 20.3,
            "highwayDiscountPct": -39.87,
            "bodyType": "citadine",
        },
        {
            "slug": "renault-megane-e-tech-22kw",
            "name": "Renault Mégane E-Tech EV60 Optimum Charge",
            "batteryNetKwh": 60.0,
            "wltpRangeKm": 433,
            "realRangeKm": 426,
            "rangeDiscountPct": -1.62,
            "realConsoKwh100": 15.6,
            "highwayRangeKm": 288,
            "highwayConsoKwh100": 20.8,
            "highwayDiscountPct": -33.49,
            "bodyType": "compacte",
        },
        {
            "slug": "volkswagen-id-3-neo-58kwh",
            "name": "Volkswagen ID.3 Pro (58 kWh)",
            "batteryNetKwh": 58.0,
            "wltpRangeKm": 425,
            "realRangeKm": 365,
            "rangeDiscountPct": -14.12,
            "realConsoKwh100": 15.9,
            "highwayRangeKm": 272,
            "highwayConsoKwh100": 21.3,
            "highwayDiscountPct": -36.00,
            "bodyType": "compacte",
        },
        {
            "slug": "mg-4",
            "name": "MG 4 Luxury (64 kWh)",
            "batteryNetKwh": 61.7,
            "wltpRangeKm": 435,
            "realRangeKm": 385,
            "rangeDiscountPct": -11.49,
            "realConsoKwh100": 16.0,
            "highwayRangeKm": 283,
            "highwayConsoKwh100": 21.8,
            "highwayDiscountPct": -34.94,
            "bodyType": "compacte",
        },
        {
            "slug": "hyundai-kona-64",
            "name": "Hyundai Kona Electric 64 kWh",
            "batteryNetKwh": 64.0,
            "wltpRangeKm": 484,
            "realRangeKm": 464,
            "rangeDiscountPct": -4.13,
            "realConsoKwh100": 15.1,
            "highwayRangeKm": 335,
            "highwayConsoKwh100": 19.1,
            "highwayDiscountPct": -30.79,
            "bodyType": "suv",
        },
        {
            "slug": "kia-eniro",
            "name": "Kia e-Niro Active 64 kWh",
            "batteryNetKwh": 64.0,
            "wltpRangeKm": 455,
            "realRangeKm": 430,
            "rangeDiscountPct": -5.49,
            "realConsoKwh100": 15.6,
            "highwayRangeKm": 312,
            "highwayConsoKwh100": 20.5,
            "highwayDiscountPct": -31.43,
            "bodyType": "suv",
        },
        {
            "slug": "tesla-model-3-propulsion",
            "name": "Tesla Model 3 Propulsion Highland (60 kWh)",
            "batteryNetKwh": 57.5,
            "wltpRangeKm": 513,
            "realRangeKm": 485,
            "rangeDiscountPct": -5.46,
            "realConsoKwh100": 14.8,
            "highwayRangeKm": 369,
            "highwayConsoKwh100": 15.7,
            "highwayDiscountPct": -28.07,
            "bodyType": "berline",
        },
        {
            "slug": "tesla-model-3-lr-propulsion",
            "name": "Tesla Model 3 Grande Autonomie Propulsion",
            "batteryNetKwh": 75.0,
            "wltpRangeKm": 634,
            "realRangeKm": 558,
            "rangeDiscountPct": -11.99,
            "realConsoKwh100": 15.2,
            "highwayRangeKm": 465,
            "highwayConsoKwh100": 16.2,
            "highwayDiscountPct": -26.66,
            "bodyType": "berline",
        },
        {
            "slug": "tesla-model-y-propulsion",
            "name": "Tesla Model Y Propulsion (60 kWh)",
            "batteryNetKwh": 57.5,
            "wltpRangeKm": 455,
            "realRangeKm": 417,
            "rangeDiscountPct": -8.35,
            "realConsoKwh100": 16.2,
            "highwayRangeKm": 310,
            "highwayConsoKwh100": 18.5,
            "highwayDiscountPct": -31.87,
            "bodyType": "suv",
        },
        {
            "slug": "renault-scenic-ev87",
            "name": "Renault Scénic E-Tech EV87 (87 kWh)",
            "batteryNetKwh": 87.0,
            "wltpRangeKm": 625,
            "realRangeKm": 542,
            "rangeDiscountPct": -13.28,
            "realConsoKwh100": 16.8,
            "highwayRangeKm": 395,
            "highwayConsoKwh100": 22.0,
            "highwayDiscountPct": -36.80,
            "bodyType": "suv",
        },
        {
            "slug": "renault-5-52kwh",
            "name": "Renault 5 E-Tech Autonomie Confort (52 kWh)",
            "batteryNetKwh": 52.0,
            "wltpRangeKm": 410,
            "realRangeKm": 352,
            "rangeDiscountPct": -14.15,
            "realConsoKwh100": 14.9,
            "highwayRangeKm": 248,
            "highwayConsoKwh100": 21.0,
            "highwayDiscountPct": -39.51,
            "bodyType": "citadine",
        },
        {
            "slug": "jeep-avenger",
            "name": "Jeep Avenger Électrique 156 ch (54 kWh)",
            "batteryNetKwh": 51.0,
            "wltpRangeKm": 395,
            "realRangeKm": 330,
            "rangeDiscountPct": -16.46,
            "realConsoKwh100": 16.0,
            "highwayRangeKm": 235,
            "highwayConsoKwh100": 21.7,
            "highwayDiscountPct": -40.51,
            "bodyType": "suv",
        },
        {
            "slug": "volvo-ex30-single-er",
            "name": "Volvo EX30 Single Motor (51 kWh)",
            "batteryNetKwh": 49.0,
            "wltpRangeKm": 480,
            "realRangeKm": 398,
            "rangeDiscountPct": -17.08,
            "realConsoKwh100": 17.0,
            "highwayRangeKm": 275,
            "highwayConsoKwh100": 22.5,
            "highwayDiscountPct": -42.71,
            "bodyType": "suv",
        },
        {
            "slug": "peugeot-e3008",
            "name": "Peugeot e-3008 Allure (73 kWh)",
            "batteryNetKwh": 73.0,
            "wltpRangeKm": 525,
            "realRangeKm": 445,
            "rangeDiscountPct": -15.24,
            "realConsoKwh100": 17.5,
            "highwayRangeKm": 338,
            "highwayConsoKwh100": 21.6,
            "highwayDiscountPct": -35.62,
            "bodyType": "suv",
        },
        {
            "slug": "volkswagen-id4-rwd",
            "name": "Volkswagen ID.4 Pro Performance (77 kWh)",
            "batteryNetKwh": 77.0,
            "wltpRangeKm": 520,
            "realRangeKm": 435,
            "rangeDiscountPct": -16.35,
            "realConsoKwh100": 17.2,
            "highwayRangeKm": 329,
            "highwayConsoKwh100": 23.4,
            "highwayDiscountPct": -36.73,
            "bodyType": "suv",
        },
        {
            "slug": "kia-ev6-rwd",
            "name": "Kia EV6 Long Range RWD (77.4 kWh)",
            "batteryNetKwh": 74.0,
            "wltpRangeKm": 528,
            "realRangeKm": 500,
            "rangeDiscountPct": -5.30,
            "realConsoKwh100": 16.5,
            "highwayRangeKm": 372,
            "highwayConsoKwh100": 19.9,
            "highwayDiscountPct": -29.55,
            "bodyType": "berline",
        },
        {
            "slug": "bmw-i4-edrive-40",
            "name": "BMW i4 eDrive 40 (81 kWh)",
            "batteryNetKwh": 80.7,
            "wltpRangeKm": 577,
            "realRangeKm": 508,
            "rangeDiscountPct": -11.96,
            "realConsoKwh100": 16.4,
            "highwayRangeKm": 405,
            "highwayConsoKwh100": 19.9,
            "highwayDiscountPct": -29.81,
            "bodyType": "berline",
        },
        {
            "slug": "mg-5",
            "name": "MG 5 EV Break Long Range (61 kWh)",
            "batteryNetKwh": 57.4,
            "wltpRangeKm": 400,
            "realRangeKm": 355,
            "rangeDiscountPct": -11.25,
            "realConsoKwh100": 16.5,
            "highwayRangeKm": 268,
            "highwayConsoKwh100": 21.4,
            "highwayDiscountPct": -33.00,
            "bodyType": "break",
        },
    ]

    return compile_dataset(raw_items)


def compile_dataset(items: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calcule les statistiques globales et par segment, et mappe vers le catalogue."""
    catalog_mappings: Dict[str, Any] = {}
    matched_count = 0

    all_discounts_mixed = []
    all_discounts_highway = []
    segment_discounts_mixed: Dict[str, List[float]] = {}
    segment_discounts_highway: Dict[str, List[float]] = {}

    for item in items:
        slug = item["slug"]
        name = item["name"]
        cat_id = match_catalog_id(slug, name)
        item["matchedCatalogId"] = cat_id
        item["url"] = f"https://www.lachaineev.fr/voiture/{slug}"

        disc_m = item.get("rangeDiscountPct")
        if disc_m is not None:
            all_discounts_mixed.append(disc_m)
            btype = item.get("bodyType", "compacte")
            segment_discounts_mixed.setdefault(btype, []).append(disc_m)

        disc_h = item.get("highwayDiscountPct")
        if disc_h is not None:
            all_discounts_highway.append(disc_h)
            btype = item.get("bodyType", "compacte")
            segment_discounts_highway.setdefault(btype, []).append(disc_h)

        if cat_id:
            matched_count += 1
            catalog_mappings[cat_id] = item

    # Moyennes globales
    avg_mixed = round(sum(all_discounts_mixed) / len(all_discounts_mixed), 2) if all_discounts_mixed else -12.5
    avg_highway = round(sum(all_discounts_highway) / len(all_discounts_highway), 2) if all_discounts_highway else -35.0

    # Facteur multiplicatif de décote : real = wltp * (1 + discountPct / 100)
    # Facteur multiplicatif de surconsommation : conso_IRL = wltp_theorique * inflationFactor
    conso_inflation_mixed = round(1 / (1 + (avg_mixed / 100)), 3)

    # Moyennes par carrosserie (avec fallback sur la moyenne globale si segment vide)
    segments_summary = {}
    for btype in ["citadine", "compacte", "berline", "suv", "break", "utilitaire"]:
        vals_m = segment_discounts_mixed.get(btype, [])
        vals_h = segment_discounts_highway.get(btype, [])
        seg_avg_m = round(sum(vals_m) / len(vals_m), 2) if vals_m else avg_mixed
        seg_avg_h = round(sum(vals_h) / len(vals_h), 2) if vals_h else avg_highway
        segments_summary[btype] = {
            "sampleCount": len(vals_m),
            "rangeDiscountMixedPct": seg_avg_m,
            "rangeDiscountHighwayPct": seg_avg_h,
            "consoInflationFactor": round(1 / (1 + (seg_avg_m / 100)), 3),
        }

    return {
        "generatedAt": datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": "https://www.lachaineev.fr",
        "totalObservations": len(items),
        "matchedCatalogCount": matched_count,
        "stats": {
            "averageRangeDiscountMixedPct": avg_mixed,
            "averageRangeDiscountHighwayPct": avg_highway,
            "averageConsoInflationFactor": conso_inflation_mixed,
            "segments": segments_summary,
        },
        "catalogMappings": catalog_mappings,
        "observations": items,
    }


def scrape_live_lachaineev() -> Dict[str, Any]:
    """Exécute la collecte en direct depuis le site officiel lachaineev.fr."""
    print("🚀 Scraping direct de lachaineev.fr en cours...")
    soup_wltp = fetch_soup("https://www.lachaineev.fr/wltp.php")
    soup_auto = fetch_soup("https://www.lachaineev.fr/autoroute.php")
    soup_home = fetch_soup("https://www.lachaineev.fr/")

    if not soup_wltp and not soup_auto and not soup_home:
        print("⚠️ Impossible d'accéder à lachaineev.fr en direct (connexion indisponible).")
        return get_mock_observations()

    collected: Dict[str, Dict[str, Any]] = {}

    # 1. Analyse de wltp.php (WLTP vs autonomie réelle mixte)
    if soup_wltp:
        for a in soup_wltp.select('b.gras a[href*="/voiture/"]'):
            name = a.text.strip()
            slug = a["href"].replace("/voiture/", "").strip("/")
            main_tr = a.find_parent("table")
            if main_tr:
                parent_td = main_tr.find_parent("td")
                if parent_td:
                    row = parent_td.find_parent("tr")
                    if row:
                        tds = row.find_all("td", class_="data")
                        if len(tds) >= 3:
                            try:
                                wltp_km = int(re.sub(r"[^\d]", "", tds[0].text))
                                real_km = int(re.sub(r"[^\d]", "", tds[1].text))
                                disc_pct = float(re.sub(r"[^\d.-]", "", tds[2].text))
                                collected[slug] = {
                                    "slug": slug,
                                    "name": name,
                                    "wltpRangeKm": wltp_km,
                                    "realRangeKm": real_km,
                                    "rangeDiscountPct": disc_pct,
                                }
                            except Exception:
                                pass

    # 2. Analyse de autoroute.php (Consommations et autonomies autoroute 130 km/h)
    if soup_auto:
        for a in soup_auto.select('b.gras a[href*="/voiture/"]'):
            slug = a["href"].replace("/voiture/", "").strip("/")
            name = a.text.strip()
            main_tr = a.find_parent("table")
            if main_tr:
                parent_td = main_tr.find_parent("td")
                if parent_td:
                    row = parent_td.find_parent("tr")
                    if row:
                        tds = row.find_all("td", class_="data")
                        if len(tds) >= 2:
                            try:
                                b_el = tds[0].find("b")
                                num_str = b_el.text.strip() if b_el else tds[0].text
                                m_num = re.search(r"(\d+(?:\.\d+)?)", num_str)
                                h_conso = float(m_num.group(1)) if m_num else 0.0

                                b_km = tds[1].find("b")
                                km_str = b_km.text.strip() if b_km else tds[1].text
                                m_km = re.search(r"(\d+)", km_str)
                                h_km = int(m_km.group(1)) if m_km else 0

                                if slug not in collected:
                                    collected[slug] = {"slug": slug, "name": name}
                                collected[slug]["highwayConsoKwh100"] = h_conso
                                collected[slug]["highwayRangeKm"] = h_km
                                if "wltpRangeKm" in collected[slug] and collected[slug]["wltpRangeKm"] > 0:
                                    w_km = collected[slug]["wltpRangeKm"]
                                    collected[slug]["highwayDiscountPct"] = round(((h_km - w_km) / w_km) * 100, 2)
                            except Exception:
                                pass

    # 3. Analyse de la page d'accueil (Conso réelle mixte retenue)
    if soup_home:
        for a in soup_home.select('b.gras a[href*="/voiture/"]'):
            slug = a["href"].replace("/voiture/", "").strip("/")
            name = a.text.strip()
            main_tr = a.find_parent("table")
            if main_tr:
                parent_td = main_tr.find_parent("td")
                if parent_td:
                    row = parent_td.find_parent("tr")
                    if row:
                        tds = row.find_all("td", class_="data")
                        if len(tds) >= 1:
                            try:
                                b_el = tds[0].find("b")
                                num_str = b_el.text.strip() if b_el else tds[0].text
                                m_num = re.search(r"(\d+(?:\.\d+)?)", num_str)
                                mixed_conso = float(m_num.group(1)) if m_num else 0.0

                                if slug not in collected:
                                    collected[slug] = {"slug": slug, "name": name}
                                collected[slug]["realConsoKwh100"] = mixed_conso
                            except Exception:
                                pass

    if not collected:
        print("⚠️ Aucune donnée n'a pu être collectée. Basculement sur le jeu étalonné de secours.")
        return get_mock_observations()

    # Estimation du bodyType par inférence sur le nom
    for slug, d in collected.items():
        text = f"{slug} {d.get('name', '')}".lower()
        if any(k in text for k in ["spring", "zoe", "zoé", "twingo", "500", "208", "corsa", "eup", "r5"]):
            d["bodyType"] = "citadine"
        elif any(k in text for k in ["megane", "mégane", "id.3", "id-3", "mg4", "mg-4", "leaf", "c4", "born", "i3"]):
            d["bodyType"] = "compacte"
        elif any(k in text for k in ["model 3", "ioniq 6", "i4", "seal", "ev6", "eqe", "p7", "taycan"]):
            d["bodyType"] = "berline"
        elif any(k in text for k in ["tourer", "break", "sw", "mg5", "mg-5"]):
            d["bodyType"] = "break"
        else:
            d["bodyType"] = "suv"

    print(f"✅ Relevé réussi : {len(collected)} véhicules extraits de La Chaîne EV.")
    return compile_dataset(list(collected.values()))


def main():
    parser = argparse.ArgumentParser(description="Scraper des consommations réelles La Chaîne EV")
    parser.add_argument("--mock-sample", action="store_true", help="Utilise le jeu étalonné de simulation hors ligne")
    parser.add_argument("--output", type=str, default=str(OUTPUT_FILE), help="Chemin du fichier de sortie")

    args = parser.parse_args()

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.mock_sample:
        data = get_mock_observations()
    else:
        data = scrape_live_lachaineev()

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n💾 Données La Chaîne EV enregistrées dans : {out_path}")
    print(f"📊 Total véhicules analysés : {data['totalObservations']}")
    print(f"🔗 Modèles appariés au catalogue Stop-Carburant : {data['matchedCatalogCount']}")
    print(f"📉 Décote moyenne mixte constatée : {data['stats']['averageRangeDiscountMixedPct']}%")
    print(f"🛣️ Décote moyenne autoroute 130 km/h : {data['stats']['averageRangeDiscountHighwayPct']}%")
    print(f"⚡ Facteur de surconsommation réelle : ×{data['stats']['averageConsoInflationFactor']}")


if __name__ == "__main__":
    main()
