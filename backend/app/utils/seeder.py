import json
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.config import settings
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.land_record import LandRecord
from app.models.validation import ValidationResult
from app.models.duplicate import DuplicateCandidate
from app.models.audit import AuditLog
from app.auth.security import get_password_hash

def seed_database(db: Session):
    """Populates the database with realistic Indian land records, documents, users, and duplicate pairs."""
    
    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding users...")
    users = [
        User(
            name="Smt. Ananya Sen, IAS",
            email="admin@landrecords.gov.in",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN
        ),
        User(
            name="Shri Rajeshwar Verma",
            email="officer@landrecords.gov.in",
            password_hash=get_password_hash("officer123"),
            role=UserRole.OFFICER
        ),
        User(
            name="Pooja Kulkarni",
            email="reviewer@landrecords.gov.in",
            password_hash=get_password_hash("reviewer123"),
            role=UserRole.REVIEWER
        )
    ]
    db.add_all(users)
    db.commit()

    print("Seeding documents...")
    sample_docs_meta = [
        ("WB_RoR_Khatian_104.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "PURBA MEDINIPUR RECORD OF RIGHTS KHATIAN 104 RAHUL KUMAR DAS"),
        ("MH_Satbara_712_312.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "VILLAGE FORM VII XII HAVELI PUNE SURESH RAMCHANDRA PATIL"),
        ("KA_RTC_Bhoomi_45.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "BHOOMI ONLINE RTC ANEKAL BENGALURU RAMESH CHANDRA GOWDA"),
        ("UP_Khatauni_215.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "hi", "उत्तर प्रदेश सरकार खतौनी मलिहाबाद लखनऊ रमेश सिंह"),
        ("WB_RoR_Moyna_Duplicate_Test.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "PURBA MEDINIPUR RECORD OF RIGHTS KHATIAN 287 RAHUL K DAS"),
        ("MH_Satbara_Disputed_Area.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "HAVELI PUNE SATBARA VIKRAM DESHMUKH AREA 0 ACRES"),
        ("WB_Patta_Deed_188.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "bn", "পশ্চিমবঙ্গ সরকার ভূমি সংস্কার দলিল পার্থ চট্টোপাধ্যায়"),
        ("KA_RTC_Hosakote_56.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "BHOOMI RTC HOSAKOTE BENGALURU MANJUNATH REDDY"),
        ("UP_Khatauni_Sitapur_99.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "REVENUE BOARD UP SITAPUR KHATAUNI DINESH SHARMA"),
        ("MH_Satbara_Baramati_14.pdf", "image/jpeg", "COMPLETED", "COMPLETED", "en", "BARAMATI PUNE 7 12 EXTRACT AJAY JAGTAP")
    ]

    created_docs = []
    for f_name, f_type, ocr_st, proc_st, lang, text in sample_docs_meta:
        doc = Document(
            file_name=f_name,
            file_path=f"uploads/{f_name}",
            file_type=f_type,
            upload_date=datetime.utcnow() - timedelta(days=len(created_docs) * 2),
            OCR_status=ocr_st,
            processing_status=proc_st,
            extracted_text=text,
            language=lang
        )
        db.add(doc)
        created_docs.append(doc)
    db.commit()

    print("Seeding 20+ realistic land records across West Bengal, Maharashtra, Karnataka, and Uttar Pradesh...")
    records_data = [
        # 1. Verified Record (Base West Bengal)
        {
            "owner_name": "Rahul Kumar Das",
            "father_or_guardian_name": "Bijoy Krishna Das",
            "address": "Village Moyna, P.O. Moyna, Block Moyna, Purba Medinipur, West Bengal - 721629",
            "village": "Moyna",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "123/4",
            "plot_number": "45",
            "area": 2.45,
            "land_type": "Agricultural",
            "registration_number": "REG-WB-2018-9941",
            "mutation_number": "MUT-2019-0412",
            "document_date": "14/08/2019",
            "source_document": created_docs[0].id,
            "OCR_confidence": 95.5,
            "validation_score": 96.0,
            "duplicate_score": 15.0,
            "status": "VERIFIED"
        },
        # 2. Conflicting / Potential Duplicate of Record 1 (92% match)
        {
            "owner_name": "RAHUL K. DAS",
            "father_or_guardian_name": "Bijoy K. Das",
            "address": "Village Moyna, Block Moyna, District Purba Medinipur, West Bengal",
            "village": "Moyna",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "123/4",
            "plot_number": "45",
            "area": 2.40,
            "land_type": "Agricultural",
            "registration_number": "REG-WB-2023-1102",
            "mutation_number": "MUT-2023-8841",
            "document_date": "05/01/2023",
            "source_document": created_docs[4].id,
            "OCR_confidence": 92.0,
            "validation_score": 65.0,
            "duplicate_score": 92.5,
            "status": "PENDING_REVIEW"
        },
        # 3. Verified Record (Maharashtra)
        {
            "owner_name": "Suresh Ramchandra Patil",
            "father_or_guardian_name": "Ramchandra Shivaji Patil",
            "address": "Flat 402, Shanti Kunj, Wagholi, Taluka Haveli, Pune, Maharashtra - 412207",
            "village": "Wagholi",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "88/2A",
            "plot_number": "12",
            "area": 1.80,
            "land_type": "Agricultural",
            "registration_number": "REG-MH-2020-5512",
            "mutation_number": "MUT-2020-0881",
            "document_date": "22/11/2020",
            "source_document": created_docs[1].id,
            "OCR_confidence": 93.8,
            "validation_score": 94.5,
            "duplicate_score": 10.0,
            "status": "VERIFIED"
        },
        # 4. Verified Record (Karnataka)
        {
            "owner_name": "Ramesh Chandra Gowda",
            "father_or_guardian_name": "M. Gowda",
            "address": "Sarjapura Main Road, Sompura Village, Anekal Taluk, Bengaluru Urban, Karnataka",
            "village": "Sompura",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "survey_number": "45/1",
            "plot_number": "3B",
            "area": 3.20,
            "land_type": "Agricultural",
            "registration_number": "REG-KA-2017-7721",
            "mutation_number": "MUT-2017-1044",
            "document_date": "05/03/2017",
            "source_document": created_docs[2].id,
            "OCR_confidence": 91.0,
            "validation_score": 92.0,
            "duplicate_score": 12.0,
            "status": "VERIFIED"
        },
        # 5. Verified Record (Uttar Pradesh)
        {
            "owner_name": "Ramesh Singh",
            "father_or_guardian_name": "Harish Chandra Singh",
            "address": "Village Kakori, Tehsil Malihabad, District Lucknow, Uttar Pradesh",
            "village": "Kakori",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "survey_number": "215/1",
            "plot_number": "78",
            "area": 1.50,
            "land_type": "Agricultural",
            "registration_number": "REG-UP-2021-3319",
            "mutation_number": "MUT-2021-0914",
            "document_date": "19/07/2021",
            "source_document": created_docs[3].id,
            "OCR_confidence": 94.2,
            "validation_score": 95.0,
            "duplicate_score": 8.0,
            "status": "VERIFIED"
        },
        # 6. Validation Error: Invalid Zero Area
        {
            "owner_name": "Vikram Deshmukh",
            "father_or_guardian_name": "Eknath Deshmukh",
            "address": "Haveli Road, Pune, Maharashtra",
            "village": "Wagholi",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "94/3",
            "plot_number": "18",
            "area": 0.0,
            "land_type": "Commercial",
            "registration_number": "REG-MH-2022-7719",
            "mutation_number": "MUT-2022-0041",
            "document_date": "12/04/2022",
            "source_document": created_docs[5].id,
            "OCR_confidence": 88.0,
            "validation_score": 40.0,
            "duplicate_score": 20.0,
            "status": "PENDING_REVIEW"
        },
        # 7. Low OCR Confidence Record requiring Review
        {
            "owner_name": "Partha Chatterjee",
            "father_or_guardian_name": "Nirmal Chatterjee",
            "address": "Moyna Bazar, Purba Medinipur, West Bengal",
            "village": "Moyna",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "310/2",
            "plot_number": "14",
            "area": 0.85,
            "land_type": "Residential",
            "registration_number": "REG-WB-2016-1204",
            "mutation_number": "MUT-2016-5591",
            "document_date": "10/01/2016",
            "source_document": created_docs[6].id,
            "OCR_confidence": 64.5,
            "validation_score": 88.0,
            "duplicate_score": 5.0,
            "status": "PENDING_REVIEW"
        },
        # 8. Potential Duplicate pair in Maharashtra (78% match)
        {
            "owner_name": "Suresh R. Patil",
            "father_or_guardian_name": "Ramchandra S. Patil",
            "address": "Wagholi, Pune, Maharashtra",
            "village": "Wagholi",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "88/2",
            "plot_number": "12",
            "area": 1.78,
            "land_type": "Agricultural",
            "registration_number": "REG-MH-2023-4411",
            "mutation_number": "MUT-2023-1120",
            "document_date": "17/02/2023",
            "source_document": created_docs[1].id,
            "OCR_confidence": 92.1,
            "validation_score": 75.0,
            "duplicate_score": 88.0,
            "status": "PENDING_REVIEW"
        },
        # 9-22 More diverse Indian records
        {
            "owner_name": "Manjunath Reddy",
            "father_or_guardian_name": "N. Narayana Reddy",
            "address": "Hosakote Town, Bengaluru Rural, Karnataka",
            "village": "Hosakote",
            "district": "Bengaluru Rural",
            "state": "Karnataka",
            "survey_number": "56/1B",
            "plot_number": "9",
            "area": 4.10,
            "land_type": "Agricultural",
            "registration_number": "REG-KA-2019-3302",
            "mutation_number": "MUT-2019-8921",
            "document_date": "08/09/2019",
            "source_document": created_docs[7].id,
            "OCR_confidence": 96.0,
            "validation_score": 97.0,
            "duplicate_score": 10.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Dinesh Sharma",
            "father_or_guardian_name": "Ram Dulare Sharma",
            "address": "Sitapur Road, Malihabad, Lucknow, Uttar Pradesh",
            "village": "Malihabad",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "survey_number": "99/4",
            "plot_number": "22",
            "area": 2.15,
            "land_type": "Mango Orchard",
            "registration_number": "REG-UP-2018-4491",
            "mutation_number": "MUT-2018-0341",
            "document_date": "29/03/2018",
            "source_document": created_docs[8].id,
            "OCR_confidence": 91.5,
            "validation_score": 93.0,
            "duplicate_score": 14.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Ajay Jagtap",
            "father_or_guardian_name": "Balasaheb Jagtap",
            "address": "Baramati, District Pune, Maharashtra",
            "village": "Baramati",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "14/7",
            "plot_number": "3",
            "area": 5.60,
            "land_type": "Sugarcane Farmland",
            "registration_number": "REG-MH-2015-8812",
            "mutation_number": "MUT-2015-4419",
            "document_date": "14/06/2015",
            "source_document": created_docs[9].id,
            "OCR_confidence": 94.0,
            "validation_score": 95.0,
            "duplicate_score": 5.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Soumen Mukherjee",
            "father_or_guardian_name": "Tapan Mukherjee",
            "address": "Tamluk Town, Purba Medinipur, West Bengal",
            "village": "Tamluk",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "402/1",
            "plot_number": "6",
            "area": 0.45,
            "land_type": "Commercial",
            "registration_number": "REG-WB-2021-9988",
            "mutation_number": "MUT-2021-1240",
            "document_date": "11/11/2021",
            "source_document": None,
            "OCR_confidence": 93.2,
            "validation_score": 94.0,
            "duplicate_score": 8.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Siddharth Rao",
            "father_or_guardian_name": "Venkatesh Rao",
            "address": "Electronic City Phase 2, Anekal, Bengaluru Urban, Karnataka",
            "village": "Doddathoguru",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "survey_number": "118/3",
            "plot_number": "41",
            "area": 1.10,
            "land_type": "Residential",
            "registration_number": "REG-KA-2022-5501",
            "mutation_number": "MUT-2022-7712",
            "document_date": "04/05/2022",
            "source_document": None,
            "OCR_confidence": 97.0,
            "validation_score": 96.5,
            "duplicate_score": 12.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Priyanka Yadav",
            "father_or_guardian_name": "Sanjay Yadav",
            "address": "Mohanlalganj, Lucknow, Uttar Pradesh",
            "village": "Mohanlalganj",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "survey_number": "77/2",
            "plot_number": "15",
            "area": 3.80,
            "land_type": "Agricultural",
            "registration_number": "REG-UP-2020-1122",
            "mutation_number": "MUT-2020-9943",
            "document_date": "18/12/2020",
            "source_document": None,
            "OCR_confidence": 95.1,
            "validation_score": 96.0,
            "duplicate_score": 7.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Anil Kadam",
            "father_or_guardian_name": "Shantaram Kadam",
            "address": "Khed Shivapur, Pune, Maharashtra",
            "village": "Shivapur",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "205/8",
            "plot_number": "21",
            "area": 2.90,
            "land_type": "Agricultural",
            "registration_number": "REG-MH-2019-3321",
            "mutation_number": "MUT-2019-5504",
            "document_date": "23/08/2019",
            "source_document": None,
            "OCR_confidence": 92.5,
            "validation_score": 93.0,
            "duplicate_score": 15.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Debabrata Mondal",
            "father_or_guardian_name": "Subhas Mondal",
            "address": "Haldia Port Region, Purba Medinipur, West Bengal",
            "village": "Haldia",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "512/9",
            "plot_number": "33",
            "area": 1.65,
            "land_type": "Industrial",
            "registration_number": "REG-WB-2020-4402",
            "mutation_number": "MUT-2020-8811",
            "document_date": "09/02/2020",
            "source_document": None,
            "OCR_confidence": 90.5,
            "validation_score": 91.0,
            "duplicate_score": 6.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Kavitha Murthy",
            "father_or_guardian_name": "K. Murthy",
            "address": "Whitefield Outer Circle, Bengaluru Urban, Karnataka",
            "village": "Kadugodi",
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "survey_number": "33/5",
            "plot_number": "10A",
            "area": 0.75,
            "land_type": "Commercial",
            "registration_number": "REG-KA-2021-8890",
            "mutation_number": "MUT-2021-3321",
            "document_date": "16/09/2021",
            "source_document": None,
            "OCR_confidence": 96.8,
            "validation_score": 98.0,
            "duplicate_score": 4.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Mahesh Chandra Gupta",
            "father_or_guardian_name": "Badri Prasad Gupta",
            "address": "Aliganj, Lucknow, Uttar Pradesh",
            "village": "Aliganj",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "survey_number": "144/2",
            "plot_number": "5",
            "area": 0.50,
            "land_type": "Residential",
            "registration_number": "REG-UP-2019-7711",
            "mutation_number": "MUT-2019-4402",
            "document_date": "27/06/2019",
            "source_document": None,
            "OCR_confidence": 94.0,
            "validation_score": 95.0,
            "duplicate_score": 9.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Sunita Sanjay Shinde",
            "father_or_guardian_name": "Sanjay V. Shinde",
            "address": "Bhor, District Pune, Maharashtra",
            "village": "Bhor",
            "district": "Pune",
            "state": "Maharashtra",
            "survey_number": "62/1",
            "plot_number": "7",
            "area": 3.40,
            "land_type": "Agricultural",
            "registration_number": "REG-MH-2018-1190",
            "mutation_number": "MUT-2018-9901",
            "document_date": "15/10/2018",
            "source_document": None,
            "OCR_confidence": 93.0,
            "validation_score": 94.0,
            "duplicate_score": 11.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Amitava Roy",
            "father_or_guardian_name": "Bimalendu Roy",
            "address": "Contai Central, Purba Medinipur, West Bengal",
            "village": "Contai",
            "district": "Purba Medinipur",
            "state": "West Bengal",
            "survey_number": "819/3",
            "plot_number": "19",
            "area": 1.20,
            "land_type": "Agricultural",
            "registration_number": "REG-WB-2022-3341",
            "mutation_number": "MUT-2022-7789",
            "document_date": "03/08/2022",
            "source_document": None,
            "OCR_confidence": 92.4,
            "validation_score": 93.5,
            "duplicate_score": 13.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Basavaraj Bommai",
            "father_or_guardian_name": "S. Bommai",
            "address": "Nelamangala, Bengaluru Rural, Karnataka",
            "village": "Nelamangala",
            "district": "Bengaluru Rural",
            "state": "Karnataka",
            "survey_number": "190/4",
            "plot_number": "88",
            "area": 6.75,
            "land_type": "Agricultural",
            "registration_number": "REG-KA-2016-5541",
            "mutation_number": "MUT-2016-1102",
            "document_date": "19/04/2016",
            "source_document": None,
            "OCR_confidence": 95.0,
            "validation_score": 96.0,
            "duplicate_score": 8.0,
            "status": "VERIFIED"
        },
        {
            "owner_name": "Geeta Devi Mishra",
            "father_or_guardian_name": "Awadhesh Mishra",
            "address": "Bakshi Ka Talab, Lucknow, Uttar Pradesh",
            "village": "BKT",
            "district": "Lucknow",
            "state": "Uttar Pradesh",
            "survey_number": "311/1",
            "plot_number": "14",
            "area": 2.30,
            "land_type": "Agricultural",
            "registration_number": "REG-UP-2017-9912",
            "mutation_number": "MUT-2017-4451",
            "document_date": "14/01/2017",
            "source_document": None,
            "OCR_confidence": 91.0,
            "validation_score": 92.5,
            "duplicate_score": 10.0,
            "status": "VERIFIED"
        }
    ]

    created_records = []
    for rd in records_data:
        lr = LandRecord(**rd)
        db.add(lr)
        created_records.append(lr)
    db.commit()

    print("Adding field-by-field validation results...")
    # Add validation details for Record 1 (Valid)
    r1_validations = [
        ("Owner Name", "Rahul Kumar Das", "VALID", 98.0, "Verified against voter & cadastral registry."),
        ("Survey Number", "123/4", "VALID", 96.0, "Cadastral boundaries match GIS survey sheet."),
        ("Area", "2.45 Acres", "VALID", 99.0, "Parcel area matches parent partition deed."),
        ("Mutation Number", "MUT-2019-0412", "VALID", 95.0, "Mutation sanctioned by BL&LRO Moyna.")
    ]
    for fn, ev, vs, cf, vm in r1_validations:
        db.add(ValidationResult(
            land_record_id=created_records[0].id,
            field_name=fn,
            extracted_value=ev,
            validation_status=vs,
            confidence=cf,
            validation_message=vm
        ))

    # Add validation details for Record 2 (Conflict with Record 1)
    r2_validations = [
        ("Owner Name", "RAHUL K. DAS", "VALID", 90.0, "Name normalized to Rahul Kumar Das."),
        ("Survey Number", "123/4", "CONFLICT", 35.0, f"Cadastral Conflict: Survey 123/4 in Moyna is already registered to 'Rahul Kumar Das' (Record #{created_records[0].id})."),
        ("Area", "2.40 Acres", "MISMATCH", 68.0, "Area 2.40 differs from parent record area 2.45 Acres."),
        ("Mutation Number", "MUT-2023-8841", "WARNING", 75.0, "Pending verification of original sale deed.")
    ]
    for fn, ev, vs, cf, vm in r2_validations:
        db.add(ValidationResult(
            land_record_id=created_records[1].id,
            field_name=fn,
            extracted_value=ev,
            validation_status=vs,
            confidence=cf,
            validation_message=vm
        ))

    # Add validation details for Record 6 (Area zero error)
    r6_validations = [
        ("Owner Name", "Vikram Deshmukh", "VALID", 95.0, "Owner identity found in tahsildar registry."),
        ("Survey Number", "94/3", "VALID", 92.0, "Cadastral parcel exists in Wagholi."),
        ("Area", "0.0 Acres", "INVALID", 0.0, "Invalid land area: 0.0 Acres. Parcel area must be greater than zero.")
    ]
    for fn, ev, vs, cf, vm in r6_validations:
        db.add(ValidationResult(
            land_record_id=created_records[5].id,
            field_name=fn,
            extracted_value=ev,
            validation_status=vs,
            confidence=cf,
            validation_message=vm
        ))

    db.commit()

    print("Adding duplicate candidates...")
    # Candidate 1: Record 2 vs Record 1 (92.5% similarity)
    dup1 = DuplicateCandidate(
        record_id=created_records[1].id,
        matched_record_id=created_records[0].id,
        similarity_score=92.5,
        matching_fields=json.dumps(["Owner Name", "Father's Name", "Village", "Survey Number", "Plot Number"]),
        status="POTENTIAL_DUPLICATE",
        reviewer_comment="High similarity across cadastral numbers and owner name. Requires field officer deed verification."
    )
    # Candidate 2: Record 8 vs Record 3 (88.0% similarity)
    dup2 = DuplicateCandidate(
        record_id=created_records[7].id,
        matched_record_id=created_records[2].id,
        similarity_score=88.0,
        matching_fields=json.dumps(["Owner Name", "Father's Name", "Village", "Survey Number", "Area"]),
        status="POTENTIAL_DUPLICATE",
        reviewer_comment="Possible re-registration or mutation split for Patil family parcel."
    )
    db.add_all([dup1, dup2])
    db.commit()

    print("Adding initial audit logs...")
    audits = [
        AuditLog(
            user_id=users[0].id,
            action="SYSTEM_INIT",
            record_id=None,
            details="System initialization and cadastral registry database migration completed."
        ),
        AuditLog(
            user_id=users[1].id,
            action="AUTO_VERIFY",
            record_id=created_records[0].id,
            details="Automated confidence check passed (96.0%). Record marked as VERIFIED."
        ),
        AuditLog(
            user_id=users[2].id,
            action="FLAGGED_DUPLICATE",
            record_id=created_records[1].id,
            details=f"Automated duplicate detection flagged Record #{created_records[1].id} against Record #{created_records[0].id} with 92.5% similarity."
        ),
        AuditLog(
            user_id=users[1].id,
            action="FLAGGED_VALIDATION_ERROR",
            record_id=created_records[5].id,
            details="Validation rule 'Area Parcel Validity' failed with 0.0 Acres. Routed to Review Queue."
        )
    ]
    db.add_all(audits)
    db.commit()
    print("Database seeding completed successfully!")

def seed_trust_certificates(db: Session):
    """Seeds initial Buyer Trust Certificates for realistic testing if none exist."""
    import json
    from app.models.trust_certificate import TrustCertificate
    from app.models.audit import AuditLog
    from app.models.land_record import LandRecord
    from app.models.user import User, UserRole
    from app.api.certificates import evaluate_trust_tier
    from app.utils.gis_data import get_gis_for_record

    if db.query(TrustCertificate).count() > 0:
        return

    officer = db.query(User).filter(User.role == UserRole.OFFICER).first()
    officer_name = officer.name if officer else "Shri Rajeshwar Verma"
    officer_id = officer.id if officer else None

    target_configs = [
        (1, "BTC-2026-WB-0001-DEMO01"),
        (3, "BTC-2026-MH-0003-DEMO02"),
        (2, "BTC-2026-WB-0002-FLAG01")
    ]

    for rec_id, cert_id in target_configs:
        rec = db.query(LandRecord).filter(LandRecord.id == rec_id).first()
        if not rec:
            continue

        trust_status, trust_score, checkpoints, advisories = evaluate_trust_tier(rec)

        lat = rec.latitude
        lng = rec.longitude
        poly_str = rec.gis_polygon
        if not lat or not poly_str:
            gis_data = get_gis_for_record(rec)
            lat = gis_data["latitude"]
            lng = gis_data["longitude"]
            poly_str = json.dumps(gis_data["coordinates"])

        gmaps_url = f"https://www.google.com/maps?q={lat},{lng}&z=18"
        qr_data = f"/verify/{cert_id}"

        cert = TrustCertificate(
            certificate_id=cert_id,
            record_id=rec.id,
            trust_status=trust_status,
            trust_score=trust_score,
            owner_name=rec.owner_name,
            father_or_guardian_name=rec.father_or_guardian_name,
            plot_number=rec.plot_number,
            survey_number=rec.survey_number,
            khatian_number=rec.khatian_number,
            area=rec.area,
            land_type=rec.land_type,
            village=rec.village,
            district=rec.district,
            state=rec.state,
            registration_number=rec.registration_number,
            mutation_number=rec.mutation_number,
            latitude=lat,
            longitude=lng,
            gis_boundary_type=rec.gis_boundary_type or "POLYGON",
            gis_polygon=poly_str,
            google_maps_url=gmaps_url,
            OCR_confidence=rec.OCR_confidence or 0.0,
            validation_score=rec.validation_score or 0.0,
            duplicate_score=rec.duplicate_score or 0.0,
            record_status=rec.status,
            verification_summary=json.dumps(checkpoints),
            buyer_advisories=json.dumps(advisories),
            qr_data=qr_data,
            generated_by_user_id=officer_id,
            generated_by_name=officer_name,
            issued_at=datetime.utcnow() - timedelta(days=2),
            valid_until=datetime.utcnow() + timedelta(days=363)
        )
        db.add(cert)
        db.commit()

        # Add Audit log
        audit = AuditLog(
            user_id=officer_id,
            action="GENERATE_TRUST_CERTIFICATE",
            record_id=rec.id,
            timestamp=cert.issued_at,
            details=json.dumps({
                "certificate_id": cert_id,
                "trust_status": trust_status,
                "trust_score": trust_score,
                "officer_name": officer_name,
                "village": rec.village,
                "plot_number": rec.plot_number,
                "survey_number": rec.survey_number
            })
        )
        db.add(audit)
        db.commit()

    print("Seeded initial Buyer Trust Certificates successfully.")
