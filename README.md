# Intelligent Land Record Digitization & Validation System

**Smart India Hackathon 2026 Working Prototype**  
**Problem Statement ID:** SIH26018  
**Team:** #TECH

---

## Quick Start (How to Run)

You can run the entire system with any of the following convenient entry points:

### Option 1: Python Runner (Recommended)
From the project root:
```bash
python run.py
```
* Automatically starts the FastAPI backend and unified React frontend SPA on `http://127.0.0.1:8000`.
* Automatically launches your default web browser to the dashboard.
* Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

### Option 2: Windows Double-Click / Command Prompt
Double-click `run.bat` or run:
```cmd
run.bat
```

### Option 3: PowerShell
```powershell
.\run.ps1
```

---

## Runner Commands & Modes

| Command | Purpose |
| :--- | :--- |
| `python run.py` | Starts the unified application (SPA + API) on port `8000` and opens browser. |
| `python run.py --dev` | Runs FastAPI backend (`:8000`) and Vite frontend dev server (`:5173`) concurrently. |
| `python run.py --test` | Executes the complete 10-step end-to-end automated verification test suite. |
| `python run.py --port 8080` | Runs on custom port (e.g. `8080`). |
| `python run.py --no-browser` | Runs server without auto-opening the web browser. |

---

## Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Land Revenue Officer** | `officer@landrecords.gov.in` | `officer123` |
| **System Administrator** | `admin@landrecords.gov.in` | `admin123` |

---

## GIS-Based Land Search & Map Location (New Feature)

The system includes an integrated **GIS Cadastral Land Search & Interactive Google Maps** viewer:
* **Cadastral Attribute Search**: Search parcels by **Plot Number**, **Survey / Dag Number**, **Khatian / Khatauni Number**, **Village**, **District**, and **State**.
* **5-Stage Integrated Cadastre Workflow**: 
  `Land Search → Identify Plot → GIS Location → Google Maps → View Plot Details`
* **Interactive Map Layers**: High-resolution **Google Hybrid Satellite**, **Google Roadmap**, and **Google Terrain** aerial views.
* **Cadastral Polygon Highlighting**: Visualizes exact parcel boundary polygons with corner survey beacons, centroid pin with pulsing radar beacon, and adjacent parcels.
* **View on Google Maps**: 1-click navigation to open the identified plot directly in official Google Maps.
* **GeoJSON Export**: Instant spatial export of boundary polygons in standard EPSG:4326 (WGS 84).

---

## Buyer Trust Certificate & Public Verification (New Feature)

The platform provides an official **Buyer Trust Certificate** to assist prospective property buyers in conducting transparent pre-purchase conveyancing and due-diligence verification:
* **One-Click Certificate Generation**: Available on the verified land record details page after document validation, duplicate detection, confidence scoring, and GIS spatial verification.
* **Buyer-Friendly Trust Status**: Clear, tamper-evident classification:
  * **Verified** (Green — High-confidence deed transcription and clear cadastral title space)
  * **Verified with Conditions** (Amber — Conditionally cleared pending physical boundary survey or sub-registrar search)
  * **Requires Further Verification** (Red — Potential duplicate collision, area discrepancy, or active dispute)
* **GIS Cadastral Integration**: Verified georeferenced centroid coordinates, parcel boundary polygon coordinates, boundary vertices count, and a direct 1-click **“View on Google Maps”** link.
* **Instant QR Code Verification**: Unique scannable 2D QR code on every certificate linking directly to the platform's public certificate verification portal.
* **Public Certificate Verification Portal**: Dedicated verification interface (`/verify/{certificate_id}`) allowing any prospective buyer to enter or scan a Certificate ID to cross-check authenticity, view the live registry status, and read forensic checkpoints.
* **Export & Sharing Options**: Download Trust Certificate as PDF, Print Certificate (A4 formatted), Share Certificate link, and Copy Certificate ID.
* **Mandatory Statutory Notice**: Prominently displays the required buyer protection disclaimer clarifying that the certificate summarizes platform verification results without constituting an autonomous government title guarantee.
* **Tamper-Evident Audit Trail**: Every certificate issuance is immutably logged with Certificate ID, issuance timestamp, record reference, trust status, and the authorized officer's identity.

---

## Direct OCR Provider Testing

To test the OCR module directly:
```bash
python backend/app/services/ocr/transarect_provider.py
```
* If `TRANSARECT_API_KEY` is not set, the system transparently falls back to `DemoOCRProvider` with high-confidence recognition for certified land deed samples (West Bengal, Bihar, UP, Maharashtra records).

---

## Project Structure

```
├── run.py                 # Main unified entry point
├── run.bat                # Windows double-clickable launcher
├── run.ps1                # PowerShell launcher
├── README.md              # Project documentation
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/           # REST API endpoints (auth, records, duplicates, review)
│   │   ├── database/      # SQLAlchemy session & models
│   │   ├── services/
│   │   │   ├── ocr/       # Transarect & Demo OCR engines
│   │   │   ├── extraction/# NLP parser & field normalizer
│   │   │   ├── duplicate/ # Multi-factor similarity & duplicate detector
│   │   │   └── scoring/   # Composite confidence scoring engine
│   ├── test_pipeline.py   # 10-step verification test suite
│   ├── sample_documents/  # Pre-bundled certified land deed samples
│   └── land_records.db    # Seeded SQLite database (Postgres fallback)
└── frontend/              # Vite + React UI
    ├── src/               # React components, pages, analytics
    └── dist/              # Pre-compiled SPA bundle served by FastAPI
```
