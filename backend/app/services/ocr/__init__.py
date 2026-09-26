from app.services.ocr.base import BaseOCRProvider
from app.services.ocr.transarect_provider import TransarectProvider
from app.services.ocr.demo_provider import DemoOCRProvider
from app.services.ocr.service import OCRService, ocr_service

__all__ = ["BaseOCRProvider", "TransarectProvider", "DemoOCRProvider", "OCRService", "ocr_service"]
