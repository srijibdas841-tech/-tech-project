import json
import logging
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.land_record import LandRecord

logger = logging.getLogger(__name__)

# Realistic Geodetic Coordinates & Cadastral Boundaries for Indian Land Records
# Coordinates mapped to authentic village/tehsil geography across WB, MH, KA, and UP
GIS_PARCEL_CATALOG = {
    # 1. Moyna, Purba Medinipur, West Bengal - Record 1 (Verified base parcel)
    "WB_MOYNA_45": {
        "khatian_number": "104",
        "latitude": 22.2542,
        "longitude": 87.7795,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.25485, 87.77880],
            [22.25510, 87.78015],
            [22.25380, 87.78030],
            [22.25360, 87.77895]
        ],
        "adjacent_plots": {
            "north": "Plot 44 (Khatian 102, S. Das)",
            "south": "Gram Panchayat Road (12m width)",
            "east": "Plot 46 (Khatian 109, M. Roy)",
            "west": "Irrigation Canal Branch 04"
        },
        "cadastral_survey_ref": "BanglarBhumi Cadastre Sheet No. Moyna-08, Scale 1:2000"
    },
    # 2. Moyna, Purba Medinipur - Record 2 (Conflict/Duplicate of Record 1)
    "WB_MOYNA_45_DUP": {
        "khatian_number": "287",
        "latitude": 22.2543,
        "longitude": 87.7796,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.25488, 87.77885],
            [22.25508, 87.78010],
            [22.25382, 87.78028],
            [22.25365, 87.77898]
        ],
        "adjacent_plots": {
            "north": "Plot 44 (Disputed boundary claim)",
            "south": "Gram Panchayat Road",
            "east": "Plot 46",
            "west": "Irrigation Canal Branch 04"
        },
        "cadastral_survey_ref": "BanglarBhumi Cadastre Sheet No. Moyna-08 (Overlapping Boundary Flagged)"
    },
    # 3. Wagholi, Haveli, Pune, Maharashtra - Record 3 (Patil Agricultural parcel)
    "MH_WAGHOLI_12": {
        "khatian_number": "312",
        "latitude": 18.5810,
        "longitude": 73.9835,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.58165, 73.98270],
            [18.58185, 73.98425],
            [18.58045, 73.98440],
            [18.58025, 73.98285]
        ],
        "adjacent_plots": {
            "north": "Survey 88/1 (Kulkarni Farmland)",
            "south": "Wagholi-Lohegaon DP Road (24m)",
            "east": "Survey 88/2B (Shinde Land)",
            "west": "Survey 87 (Government Grazing Reserve)"
        },
        "cadastral_survey_ref": "Mahabhulekh Satbara GIS Survey Grid Taluka Haveli 88"
    },
    # 4. Sompura, Anekal, Bengaluru Urban, Karnataka - Record 4 (Gowda RTC parcel)
    "KA_SOMPURA_3B": {
        "khatian_number": "45",
        "latitude": 12.8375,
        "longitude": 77.7432,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [12.83840, 77.74230],
            [12.83865, 77.74410],
            [12.83670, 77.74430],
            [12.83645, 77.74250]
        ],
        "adjacent_plots": {
            "north": "Hissa 45/2 (Reddy Property)",
            "south": "Sarjapura Main Link Road",
            "east": "Survey 46 (Industrial Buffer Zone)",
            "west": "Survey 44 (Nanja Wetland)"
        },
        "cadastral_survey_ref": "Karnataka Bhoomi Cadastral Map Anekal Taluk Sheet 45"
    },
    # 5. Kakori, Malihabad, Lucknow, Uttar Pradesh - Record 5 (Singh Mango Orchard)
    "UP_KAKORI_78": {
        "khatian_number": "215",
        "latitude": 26.8935,
        "longitude": 80.7968,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [26.89425, 80.79590],
            [26.89445, 80.79770],
            [26.89280, 80.79785],
            [26.89260, 80.79605]
        ],
        "adjacent_plots": {
            "north": "Plot 77 (Khatauni 214, Verma Farm)",
            "south": "Village Cart Track (Chakmarg)",
            "east": "Plot 79 (Bagh Mango Grove)",
            "west": "Plot 74 (Pond / Talab)"
        },
        "cadastral_survey_ref": "UP Bhulekh Bhu-Naksha Shajra Sheet Malihabad 215"
    },
    # 6. Wagholi, Pune - Record 6 (Disputed Deshmukh Commercial parcel)
    "MH_WAGHOLI_18": {
        "khatian_number": "94",
        "latitude": 18.5830,
        "longitude": 73.9850,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.58360, 73.98430],
            [18.58375, 73.98570],
            [18.58240, 73.98585],
            [18.58225, 73.98445]
        ],
        "adjacent_plots": {
            "north": "Survey 94/2 (Industrial Shed)",
            "south": "Service Road",
            "east": "Survey 95 (Commercial Complex)",
            "west": "Survey 94/1"
        },
        "cadastral_survey_ref": "Mahabhulekh Pune Sub-Division Cadastre 94/3"
    },
    # 7. Moyna, Purba Medinipur - Record 7 (Chatterjee Residential)
    "WB_MOYNA_14": {
        "khatian_number": "188",
        "latitude": 22.2560,
        "longitude": 87.7810,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.25655, 87.78045],
            [22.25670, 87.78155],
            [22.25550, 87.78165],
            [22.25535, 87.78055]
        ],
        "adjacent_plots": {
            "north": "Plot 13 (Residential House)",
            "south": "Moyna Bazar Main Road",
            "east": "Plot 15 (Commercial Shop)",
            "west": "Municipal Lane"
        },
        "cadastral_survey_ref": "BanglarBhumi Mouza Moyna Sheet 12"
    },
    # 8. Wagholi, Pune - Record 8 (Patil Family Duplicate)
    "MH_WAGHOLI_12_DUP": {
        "khatian_number": "314",
        "latitude": 18.5808,
        "longitude": 73.9832,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.58150, 73.98260],
            [18.58170, 73.98415],
            [18.58030, 73.98430],
            [18.58010, 73.98275]
        ],
        "adjacent_plots": {
            "north": "Survey 88/1",
            "south": "Wagholi-Lohegaon DP Road",
            "east": "Survey 88/2B",
            "west": "Survey 87"
        },
        "cadastral_survey_ref": "Mahabhulekh Haveli Cadastral Boundary (Duplicate Investigation)"
    },
    # 9. Hosakote, Bengaluru Rural - Record 9 (Reddy Agricultural parcel)
    "KA_HOSAKOTE_9": {
        "khatian_number": "56",
        "latitude": 13.0725,
        "longitude": 77.7995,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [13.07350, 77.79850],
            [13.07380, 77.80060],
            [13.07150, 77.80080],
            [13.07120, 77.79870]
        ],
        "adjacent_plots": {
            "north": "Survey 56/1A (Fruit Orchard)",
            "south": "Hosakote-Chintamani SH",
            "east": "Survey 57 (Gramatana)",
            "west": "Survey 55 (Dry Farmland)"
        },
        "cadastral_survey_ref": "Bhoomi Karnataka Cadastre Hosakote 56/1B"
    },
    # 10. Malihabad, Lucknow - Record 10 (Sharma Mango Orchard)
    "UP_MALIHABAD_22": {
        "khatian_number": "99",
        "latitude": 26.9215,
        "longitude": 80.7120,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [26.92245, 80.71100],
            [26.92270, 80.71310],
            [26.92060, 80.71330],
            [26.92035, 80.71120]
        ],
        "adjacent_plots": {
            "north": "Plot 21 (Dasheri Mango Orchard)",
            "south": "Village Road",
            "east": "Plot 23 (Farmhouse)",
            "west": "Drainage Nala"
        },
        "cadastral_survey_ref": "UP Bhu-Naksha Malihabad Tehsil Sheet 99"
    },
    # 11. Baramati, Pune - Record 11 (Jagtap Sugarcane Farmland)
    "MH_BARAMATI_3": {
        "khatian_number": "14",
        "latitude": 18.1535,
        "longitude": 74.5785,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.15480, 74.57720],
            [18.15510, 74.57990],
            [18.15230, 74.58010],
            [18.15200, 74.57740]
        ],
        "adjacent_plots": {
            "north": "Survey 14/6 (Canal Irrigated Land)",
            "south": "Nira Canal Right Bank Road",
            "east": "Survey 15 (Sugar Cooperative)",
            "west": "Survey 14/8 (Farmland)"
        },
        "cadastral_survey_ref": "Mahabhulekh Baramati Cadastral Grid 14/7"
    },
    # 12. Tamluk, Purba Medinipur - Record 12 (Mukherjee Commercial)
    "WB_TAMLUK_6": {
        "khatian_number": "402",
        "latitude": 22.2995,
        "longitude": 87.9265,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.30020, 87.92590],
            [22.30035, 87.92720],
            [22.29880, 87.92735],
            [22.29865, 87.92605]
        ],
        "adjacent_plots": {
            "north": "Plot 5 (National Highway 116)",
            "south": "Municipal Drainage Line",
            "east": "Plot 7 (Commercial Showroom)",
            "west": "Plot 4 (Petrol Pump)"
        },
        "cadastral_survey_ref": "BanglarBhumi Tamluk Urban Cadastre 402/1"
    },
    # 13. Doddathoguru, Bengaluru Urban - Record 13 (Rao Residential)
    "KA_DODDATHOGURU_41": {
        "khatian_number": "118",
        "latitude": 12.8465,
        "longitude": 77.6665,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.84730, 77.66570],  # Normalized below
            [22.84750, 77.66735],
            [22.84570, 77.66750],
            [22.84550, 77.66585]
        ],
        "adjacent_plots": {
            "north": "Survey 118/2 (Residential Layout)",
            "south": "Electronic City Access Road (18m)",
            "east": "Survey 118/4 (Apartments)",
            "west": "Survey 117 (IT Park Zone)"
        },
        "cadastral_survey_ref": "Bhoomi Anekal Cadastre 118/3"
    },
    # 14. Mohanlalganj, Lucknow - Record 14 (Yadav Farmland)
    "UP_MOHANLALGANJ_15": {
        "khatian_number": "77",
        "latitude": 26.6725,
        "longitude": 80.9995,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [26.67360, 80.99840],
            [26.67385, 81.00070],
            [26.67140, 81.00090],
            [26.67115, 80.99860]
        ],
        "adjacent_plots": {
            "north": "Plot 14 (Agricultural Land)",
            "south": "Village Panchayat Road",
            "east": "Plot 16 (Pond catchment)",
            "west": "Chak Road"
        },
        "cadastral_survey_ref": "UP Bhulekh Mohanlalganj Sheet 77/2"
    },
    # 15. Shivapur, Pune - Record 15 (Kadam Farmland)
    "MH_SHIVAPUR_21": {
        "khatian_number": "205",
        "latitude": 18.3535,
        "longitude": 73.8465,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.35445, 73.84550],
            [18.35470, 73.84760],
            [18.35260, 73.84780],
            [18.35235, 73.84570]
        ],
        "adjacent_plots": {
            "north": "Survey 205/7 (Farmland)",
            "south": "NH-48 Service Lane",
            "east": "Survey 206 (River Basin buffer)",
            "west": "Survey 205/9"
        },
        "cadastral_survey_ref": "Mahabhulekh Haveli Shivapur 205/8"
    },
    # 16. Haldia Port Region, WB - Record 16 (Mondal Industrial)
    "WB_HALDIA_33": {
        "khatian_number": "512",
        "latitude": 22.0685,
        "longitude": 88.0685,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [22.06940, 88.06760],
            [22.06960, 88.06950],
            [22.06760, 88.06970],
            [22.06740, 88.06780]
        ],
        "adjacent_plots": {
            "north": "Plot 32 (Port Authority Land)",
            "south": "Haldia Industrial Corridor (40m)",
            "east": "Plot 34 (Chemical Terminal)",
            "west": "Railway Siding Track"
        },
        "cadastral_survey_ref": "BanglarBhumi Haldia Port Cadastre 512/9"
    },
    # 17. Kadugodi, Bengaluru - Record 17 (Murthy Commercial)
    "KA_KADUGODI_10A": {
        "khatian_number": "33",
        "latitude": 12.9995,
        "longitude": 77.7625,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [13.00025, 77.76180],
            [13.00045, 77.76330],
            [12.99880, 77.76345],
            [12.99860, 77.76195]
        ],
        "adjacent_plots": {
            "north": "Survey 33/4 (Commercial Complex)",
            "south": "Whitefield Main Road",
            "east": "Survey 33/5B",
            "west": "Metro Corridor Buffer"
        },
        "cadastral_survey_ref": "Bhoomi Bengaluru Urban Kadugodi 33/5"
    },
    # 18. Aliganj, Lucknow - Record 18 (Gupta Residential)
    "UP_ALIGANJ_5": {
        "khatian_number": "144",
        "latitude": 26.8915,
        "longitude": 80.9425,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [26.89205, 80.94190],
            [26.89220, 80.94320],
            [26.89095, 80.94330],
            [26.89080, 80.94200]
        ],
        "adjacent_plots": {
            "north": "Plot 4 (Sector Road 15m)",
            "south": "Residential Plot 6",
            "east": "Commercial Complex Aliganj",
            "west": "Municipal Park"
        },
        "cadastral_survey_ref": "UP Bhulekh Lucknow Urban Cadastre 144/2"
    },
    # 19. Bhor, Pune - Record 19 (Shinde Farmland)
    "MH_BHOR_7": {
        "khatian_number": "62",
        "latitude": 18.1495,
        "longitude": 73.8455,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [18.15070, 73.84430],
            [18.15100, 73.84685],
            [18.14835, 73.84705],
            [18.14805, 73.84450]
        ],
        "adjacent_plots": {
            "north": "Survey 62/2 (Paddy Farmland)",
            "south": "Bhor-Mahad Road",
            "east": "Survey 63 (Forest Edge)",
            "west": "Survey 61 (Stream / Odha)"
        },
        "cadastral_survey_ref": "Mahabhulekh Bhor Cadastral Map 62/1"
    },
    # 20. Contai, Purba Medinipur - Record 20 (Roy Agricultural)
    "WB_CONTAI_19": {
        "khatian_number": "819",
        "latitude": 21.7795,
        "longitude": 87.7525,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [21.78030, 87.75165],
            [21.78055, 87.75345],
            [21.77870, 87.75360],
            [21.77845, 87.75180]
        ],
        "adjacent_plots": {
            "north": "Plot 18 (Betel Vine Plantation)",
            "south": "Village PWD Road",
            "east": "Plot 20 (Pond / Dighi)",
            "west": "Irrigation Canal"
        },
        "cadastral_survey_ref": "BanglarBhumi Contai Central Cadastre 819/3"
    },
    # 21. Nelamangala, Bengaluru Rural - Record 21 (Bommai Farmland)
    "KA_NELAMANGALA_88": {
        "khatian_number": "190",
        "latitude": 13.0995,
        "longitude": 77.3905,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [13.10110, 77.38890],
            [13.10145, 77.39230],
            [13.09800, 77.39260],
            [13.09765, 77.38920]
        ],
        "adjacent_plots": {
            "north": "Survey 190/3 (Arecanut Farm)",
            "south": "NH-75 Tollway Buffer Zone",
            "east": "Survey 191 (Grama Niveshana)",
            "west": "Survey 189 (Water Body Reserve)"
        },
        "cadastral_survey_ref": "Bhoomi Nelamangala Taluk Sheet 190/4"
    },
    # 22. Bakshi Ka Talab, Lucknow - Record 22 (Mishra Farmland)
    "UP_BKT_14": {
        "khatian_number": "311",
        "latitude": 27.0135,
        "longitude": 80.8995,
        "gis_boundary_type": "POLYGON",
        "coordinates": [
            [27.01445, 27.01445 < 50 and 80.89850 or 80.89850],
            [27.01470, 80.90065],
            [27.01260, 80.90085],
            [27.01235, 80.89870]
        ],
        "adjacent_plots": {
            "north": "Plot 13 (Wheat Farmland)",
            "south": "Sitapur Highway Service Road",
            "east": "Plot 15 (Agricultural Tubewell)",
            "west": "Gram Sabha Waste Land"
        },
        "cadastral_survey_ref": "UP Bhulekh Tehsil BKT Sheet 311/1"
    }
}

# Fix coordinate for Record 13 (latitude was typed 22 instead of 12)
GIS_PARCEL_CATALOG["KA_DODDATHOGURU_41"]["coordinates"] = [
    [12.84730, 77.66570],
    [12.84750, 77.66735],
    [12.84570, 77.66750],
    [12.84550, 77.66585]
]

# Fix coordinate for Record 22
GIS_PARCEL_CATALOG["UP_BKT_14"]["coordinates"] = [
    [27.01445, 80.89850],
    [27.01470, 80.90065],
    [27.01260, 80.90085],
    [27.01235, 80.89870]
]

def generate_synthetic_polygon(center_lat: float, center_lng: float, area_acres: float = 1.5):
    """Generates a closed 4-corner polygon around a centroid proportional to acreage."""
    # 1 acre ~= 4046.86 m2 -> roughly 63m x 63m.
    # At latitude ~20 deg, 1 deg lat ~= 110.5 km = 110,500 m; 1 deg lng ~= 104 km = 104,000 m.
    delta_lat = (0.0005 * max(0.4, min(3.0, (area_acres / 2.0) ** 0.5)))
    delta_lng = (0.0006 * max(0.4, min(3.0, (area_acres / 2.0) ** 0.5)))
    
    return [
        [round(center_lat + delta_lat, 6), round(center_lng - delta_lng, 6)],
        [round(center_lat + delta_lat * 1.1, 6), round(center_lng + delta_lng * 1.1, 6)],
        [round(center_lat - delta_lat, 6), round(center_lng + delta_lng, 6)],
        [round(center_lat - delta_lat * 1.05, 6), round(center_lng - delta_lng * 0.95, 6)]
    ]

# Default coordinates for known villages/districts in India
DISTRICT_COORDS_FALLBACK = {
    ("Purba Medinipur", "West Bengal"): (22.2542, 87.7795),
    ("Pune", "Maharashtra"): (18.5793, 73.9822),
    ("Bengaluru Urban", "Karnataka"): (12.8375, 77.7432),
    ("Bengaluru Rural", "Karnataka"): (13.0725, 77.7995),
    ("Lucknow", "Uttar Pradesh"): (26.8920, 80.7950)
}

def get_gis_for_record(record: LandRecord) -> dict:
    """Returns GIS parcel attributes for a given record, matching catalog or generating realistic values."""
    key = None
    v = (record.village or "").strip().lower()
    p = (record.plot_number or "").strip()
    s = (record.survey_number or "").strip()

    if "moyna" in v:
        if record.id == 2 or record.duplicate_score > 80:
            key = "WB_MOYNA_45_DUP"
        elif p == "14" or "310" in s:
            key = "WB_MOYNA_14"
        else:
            key = "WB_MOYNA_45"
    elif "wagholi" in v:
        if p == "18" or "94" in s:
            key = "MH_WAGHOLI_18"
        elif record.duplicate_score > 80:
            key = "MH_WAGHOLI_12_DUP"
        else:
            key = "MH_WAGHOLI_12"
    elif "sompura" in v:
        key = "KA_SOMPURA_3B"
    elif "kakori" in v:
        key = "UP_KAKORI_78"
    elif "hosakote" in v:
        key = "KA_HOSAKOTE_9"
    elif "malihabad" in v:
        key = "UP_MALIHABAD_22"
    elif "baramati" in v:
        key = "MH_BARAMATI_3"
    elif "tamluk" in v:
        key = "WB_TAMLUK_6"
    elif "doddathoguru" in v or "electronic city" in (record.address or "").lower():
        key = "KA_DODDATHOGURU_41"
    elif "mohanlalganj" in v:
        key = "UP_MOHANLALGANJ_15"
    elif "shivapur" in v:
        key = "MH_SHIVAPUR_21"
    elif "haldia" in v:
        key = "WB_HALDIA_33"
    elif "kadugodi" in v or "whitefield" in (record.address or "").lower():
        key = "KA_KADUGODI_10A"
    elif "aliganj" in v:
        key = "UP_ALIGANJ_5"
    elif "bhor" in v:
        key = "MH_BHOR_7"
    elif "contai" in v:
        key = "WB_CONTAI_19"
    elif "nelamangala" in v:
        key = "KA_NELAMANGALA_88"
    elif "bkt" in v or "bakshi" in v:
        key = "UP_BKT_14"

    if key and key in GIS_PARCEL_CATALOG:
        return GIS_PARCEL_CATALOG[key]

    # Fallback coordinate generator
    base_lat, base_lng = DISTRICT_COORDS_FALLBACK.get(
        (record.district, record.state),
        (22.2542, 87.7795)
    )
    # Slight deterministic jitter based on record.id so each plot has unique placement
    jitter_lat = ((record.id * 17) % 100) * 0.0004
    jitter_lng = ((record.id * 23) % 100) * 0.0004
    c_lat = round(base_lat + jitter_lat, 6)
    c_lng = round(base_lng + jitter_lng, 6)
    
    return {
        "khatian_number": f"{100 + (record.id * 7) % 800}",
        "latitude": c_lat,
        "longitude": c_lng,
        "gis_boundary_type": "POLYGON",
        "coordinates": generate_synthetic_polygon(c_lat, c_lng, record.area or 1.5),
        "adjacent_plots": {
            "north": f"Plot {record.plot_number or 'A'}-N",
            "south": "Access Road / Chak",
            "east": f"Plot {record.plot_number or 'B'}-E",
            "west": "Field Boundary"
        },
        "cadastral_survey_ref": f"{record.state} Revenue Cadastre {record.district} Block"
    }

def migrate_and_seed_gis(db: Session):
    """
    Ensures columns exist in land_records and updates existing rows with GIS location data.
    Runs seamlessly on startup without breaking any existing table schemas or workflows.
    """
    bind = db.get_bind()
    dialect_name = bind.dialect.name

    # Check which columns are missing
    missing_cols = []
    required_cols = {
        "khatian_number": "VARCHAR(50)",
        "latitude": "FLOAT",
        "longitude": "FLOAT",
        "gis_polygon": "TEXT",
        "gis_boundary_type": "VARCHAR(50) DEFAULT 'POLYGON'"
    }

    try:
        if dialect_name == "sqlite":
            res = db.execute(text("PRAGMA table_info(land_records);")).fetchall()
            existing_cols = {r[1] for r in res}
        else:
            res = db.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='land_records';")).fetchall()
            existing_cols = {r[0] for r in res}

        for col, col_type in required_cols.items():
            if col not in existing_cols:
                logger.info(f"Adding missing GIS column '{col}' to land_records...")
                try:
                    db.execute(text(f"ALTER TABLE land_records ADD COLUMN {col} {col_type};"))
                    db.commit()
                except Exception as ex:
                    logger.warning(f"Could not add column {col}: {ex}")
                    db.rollback()
    except Exception as e:
        logger.warning(f"Column inspection error: {e}")

    # Now populate GIS fields for records where latitude or gis_polygon is null
    try:
        records = db.query(LandRecord).all()
        updated_count = 0
        for rec in records:
            if not rec.latitude or not rec.gis_polygon or not rec.khatian_number:
                gis = get_gis_for_record(rec)
                rec.latitude = gis["latitude"]
                rec.longitude = gis["longitude"]
                rec.gis_polygon = json.dumps(gis["coordinates"])
                rec.gis_boundary_type = gis.get("gis_boundary_type", "POLYGON")
                if not rec.khatian_number:
                    rec.khatian_number = gis.get("khatian_number", f"{rec.id + 100}")
                updated_count += 1
        
        if updated_count > 0:
            db.commit()
            logger.info(f"Successfully populated GIS spatial and polygon data for {updated_count} land records!")
    except Exception as e:
        logger.error(f"Error seeding GIS data to records: {e}")
        db.rollback()

def format_gis_record(rec: LandRecord) -> dict:
    """Formats a LandRecord into the comprehensive LandRecordGisOut response."""
    coords = []
    if rec.gis_polygon:
        try:
            coords = json.loads(rec.gis_polygon)
        except Exception:
            coords = []

    # If coordinates are missing or invalid, generate them from centroid
    if not coords and rec.latitude and rec.longitude:
        coords = generate_synthetic_polygon(rec.latitude, rec.longitude, rec.area or 1.5)

    # Compute bounding box
    bounds = None
    if coords and len(coords) > 0:
        lats = [c[0] for c in coords if len(c) >= 2]
        lngs = [c[1] for c in coords if len(c) >= 2]
        if lats and lngs:
            bounds = {
                "north": max(lats),
                "south": min(lats),
                "east": max(lngs),
                "west": min(lngs)
            }

    # Fetch GIS catalog metadata if available
    gis_meta = get_gis_for_record(rec)

    # Construct Google Maps link
    lat = rec.latitude or (bounds["south"] if bounds else 22.2542)
    lng = rec.longitude or (bounds["west"] if bounds else 87.7795)
    gmaps_url = f"https://www.google.com/maps?q={lat},{lng}&z=18"

    return {
        "id": rec.id,
        "owner_name": rec.owner_name,
        "father_or_guardian_name": rec.father_or_guardian_name,
        "district": rec.district,
        "state": rec.state,
        "village": rec.village,
        "survey_number": rec.survey_number,
        "plot_number": rec.plot_number or "N/A",
        "khatian_number": rec.khatian_number or gis_meta.get("khatian_number", "N/A"),
        "area": rec.area,
        "land_type": rec.land_type,
        "registration_number": rec.registration_number,
        "mutation_number": rec.mutation_number,
        "document_date": rec.document_date,
        "status": rec.status,
        "OCR_confidence": rec.OCR_confidence,
        "validation_score": rec.validation_score,
        "duplicate_score": rec.duplicate_score,
        "latitude": lat,
        "longitude": lng,
        "gis_boundary_type": rec.gis_boundary_type or "POLYGON",
        "coordinates": coords,
        "google_maps_url": gmaps_url,
        "bounds": bounds,
        "cadastral_metadata": {
            "spatial_reference": "EPSG:4326 (WGS 84)",
            "adjacent_plots": gis_meta.get("adjacent_plots", {}),
            "cadastral_survey_ref": gis_meta.get("cadastral_survey_ref", f"{rec.state} Cadastral Directorate"),
            "perimeter_meters": round(2 * ((rec.area * 4046.86) ** 0.5) * 2, 2) if rec.area else 250.0,
            "area_sq_meters": round((rec.area or 1.0) * 4046.86, 2)
        }
    }
