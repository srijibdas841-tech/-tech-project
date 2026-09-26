import os
from PIL import Image, ImageDraw, ImageFont
from app.config import settings

def generate_sample_deed_image(filename: str, title: str, subtitle: str, fields: list, state_stamp: str):
    width = 900
    height = 1200
    
    # Parchment / off-white paper color
    img = Image.new("RGB", (width, height), color=(250, 248, 240))
    draw = ImageDraw.Draw(img)

    # Outer official decorative border
    draw.rectangle([(20, 20), (width - 20, height - 20)], outline=(120, 90, 40), width=3)
    draw.rectangle([(28, 28), (width - 28, height - 28)], outline=(180, 150, 90), width=1)

    # Header Stamp Box
    draw.rectangle([(50, 50), (width - 50, 140)], fill=(240, 235, 220), outline=(100, 70, 30), width=2)
    
    # State Revenue Stamp Seal
    draw.ellipse([(70, 60), (130, 120)], outline=(160, 40, 40), width=3)
    draw.text((78, 82), "GOVT", fill=(160, 40, 40))
    
    draw.text((160, 65), title.upper(), fill=(40, 40, 40))
    draw.text((160, 95), subtitle, fill=(80, 80, 80))
    draw.text((width - 220, 80), f"[{state_stamp}]", fill=(140, 30, 30))

    # Divider
    draw.line([(50, 160), (width - 50, 160)], fill=(120, 90, 40), width=2)

    # Document details table
    y = 190
    draw.text((50, y), "OFFICIAL RECORD OF RIGHTS / REGISTER OF DEEDS", fill=(20, 20, 80))
    y += 40

    for label, val in fields:
        # Alternating row highlights
        draw.rectangle([(50, y - 4), (width - 50, y + 26)], fill=(245, 243, 235) if (y // 35) % 2 == 0 else (255, 255, 255))
        draw.text((60, y), f"{label}:", fill=(60, 60, 60))
        draw.text((320, y), str(val), fill=(10, 10, 10))
        y += 34

    # Bottom official seal & watermark
    y += 40
    draw.rectangle([(60, y), (280, y + 90)], outline=(50, 100, 50), width=2)
    draw.text((70, y + 15), "OFFICIALLY VERIFIED", fill=(50, 100, 50))
    draw.text((70, y + 40), "CADASTRAL SURVEY DEPT", fill=(70, 120, 70))
    draw.text((70, y + 65), "REVENUE ADMINISTRATION", fill=(70, 120, 70))

    draw.rectangle([(width - 320, y), (width - 60, y + 90)], outline=(140, 40, 40), width=2)
    draw.text((width - 300, y + 20), "DIGITALLY ATTESTED", fill=(140, 40, 40))
    draw.text((width - 300, y + 50), "GOVERNMENT OF INDIA", fill=(140, 40, 40))

    save_path = settings.SAMPLE_DIR / filename
    img.save(save_path, "JPEG", quality=90)
    
    # Also save to uploads directory so it can be served directly
    upload_path = settings.UPLOAD_DIR / filename
    img.save(upload_path, "JPEG", quality=90)
    print(f"Generated sample document deed: {filename}")

def generate_all_samples():
    settings.SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    
    samples = [
        (
            "WB_RoR_Khatian_104.pdf",
            "GOVERNMENT OF WEST BENGAL - REVENUE DEPT",
            "Record of Rights (RoR) / Khatian Extract - Block Moyna",
            [
                ("Owner Name", "RAHUL KUMAR DAS"),
                ("Father / Guardian Name", "BIJOY KRISHNA DAS"),
                ("Permanent Address", "Village Moyna, Block Moyna, Purba Medinipur, WB - 721629"),
                ("Village / Mauza", "Moyna (J.L. No. 42)"),
                ("District & State", "Purba Medinipur, West Bengal"),
                ("Dag / Survey Number", "123/4"),
                ("Plot / Khasra Number", "45"),
                ("Area of Land Parcel", "2.45 Acres"),
                ("Land Classification", "Agricultural (Shali)"),
                ("Registration Deed No", "REG-WB-2018-9941"),
                ("Mutation Case Number", "MUT-2019-0412"),
                ("Date of Recording", "14/08/2019")
            ],
            "WB LAND RECORD"
        ),
        (
            "MH_Satbara_712_312.pdf",
            "GOVERNMENT OF MAHARASHTRA - REVENUE DEPT",
            "Village Form VII-XII (7/12 Satbara Extract) - Taluka Haveli",
            [
                ("Kabjedar / Owner Name", "SURESH RAMCHANDRA PATIL"),
                ("Father's Name", "RAMCHANDRA SHIVAJI PATIL"),
                ("Residential Address", "Flat 402, Shanti Kunj, Wagholi, Haveli, Pune - 412207"),
                ("Village / Gram", "Wagholi"),
                ("Taluka & District", "Haveli, Pune, Maharashtra"),
                ("Survey / Gut Number", "88/2A"),
                ("Plot / Hissa Number", "12"),
                ("Total Parcel Area", "1.80 Acres"),
                ("Land Use Type", "Bagayat (Agricultural)"),
                ("Deed Registration No", "REG-MH-2020-5512"),
                ("Mutation Entry No", "MUT-2020-0881"),
                ("Document Date", "22/11/2020")
            ],
            "MAHA-BHULEKH"
        ),
        (
            "KA_RTC_Bhoomi_45.pdf",
            "GOVERNMENT OF KARNATAKA - REVENUE DEPT",
            "Bhoomi RTC Pahani Record of Rights - Taluk Anekal",
            [
                ("Owner / Khatadar", "RAMESH CHANDRA GOWDA"),
                ("Father's Name", "M. GOWDA"),
                ("Address", "Sarjapura Main Road, Sompura Village, Anekal, Bengaluru"),
                ("Village / Hobli", "Sompura, Sarjapura Hobli"),
                ("Taluk & District", "Anekal, Bengaluru Urban, Karnataka"),
                ("Survey Number", "45/1"),
                ("Plot / Hissa Number", "3B"),
                ("Total Extent / Area", "3.20 Acres"),
                ("Land Classification", "Dry Land (Kushki)"),
                ("Registration Document", "REG-KA-2017-7721"),
                ("Mutation Register No", "MUT-2017-1044"),
                ("Execution Date", "05/03/2017")
            ],
            "BHOOMI RTC"
        ),
        (
            "UP_Khatauni_215.pdf",
            "GOVERNMENT OF UTTAR PRADESH - REVENUE BOARD",
            "Khatauni (Adhikar Abhilekh) - Tehsil Malihabad",
            [
                ("Khatedar Name", "RAMESH SINGH"),
                ("Father's Name", "HARISH CHANDRA SINGH"),
                ("Address", "Village Kakori, Tehsil Malihabad, District Lucknow, UP"),
                ("Gram / Village", "Kakori"),
                ("Tehsil & District", "Malihabad, Lucknow, Uttar Pradesh"),
                ("Khasra / Gata (Survey No)", "215/1"),
                ("Plot Number", "78"),
                ("Rakba / Total Area", "1.50 Acres"),
                ("Land Type", "Agricultural (Krishi)"),
                ("Registration Number", "REG-UP-2021-3319"),
                ("Mutation Number", "MUT-2021-0914"),
                ("Date of Entry", "19/07/2021")
            ],
            "UP BHULEKH"
        ),
        (
            "WB_RoR_Moyna_Duplicate_Test.pdf",
            "GOVERNMENT OF WEST BENGAL - REVENUE DEPT",
            "Record of Rights Duplicate Candidate File",
            [
                ("Name of Owner", "RAHUL K. DAS"),
                ("Father's Name", "BIJOY K. DAS"),
                ("Address", "Moyna Village, District Purba Medinipur, WB"),
                ("Village (Mauza)", "Moyna"),
                ("District & State", "Purba Medinipur, West Bengal"),
                ("Dag / Survey Number", "123/4"),
                ("Plot Number", "45"),
                ("Area of Land", "2.40 Acres"),
                ("Land Classification", "Agricultural"),
                ("Registration Deed", "REG-WB-2023-1102"),
                ("Mutation Case No", "MUT-2023-8841"),
                ("Date", "05/01/2023")
            ],
            "DUPLICATE TEST"
        )
    ]

    for fn, t, st, f, seal in samples:
        generate_sample_deed_image(fn, t, st, f, seal)

if __name__ == "__main__":
    generate_all_samples()
