import os
import logging
from typing import Dict, Any
from app.services.ocr.base import BaseOCRProvider
from app.services.ocr.transarect_provider import TransarectProvider
from app.services.ocr.demo_provider import DemoOCRProvider

logger = logging.getLogger(__name__)

class OCRService:
    """
    Modular OCR Service manager.
    Coordinates preprocessing, selects the optimal OCR provider,
    and falls back cleanly if external cloud OCR is unavailable.
    """

    def __init__(self, provider_name: str = "demo"):
        self.providers: Dict[str, BaseOCRProvider] = {
            "transarect": TransarectProvider(),
            "demo": DemoOCRProvider()
        }
        self.active_provider_name = provider_name

    def set_provider(self, provider_name: str):
        if provider_name in self.providers:
            self.active_provider_name = provider_name
        else:
            raise ValueError(f"Unknown OCR provider: {provider_name}")

    def process_document(self, file_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Executes document OCR using active provider, with graceful fallback to Demo provider.
        """
        provider = self.providers.get(self.active_provider_name, self.providers["demo"])
        try:
            return provider.extract_text(file_path, language=language)
        except Exception as e:
            logger.warning(f"Provider {self.active_provider_name} failed ({e}). Falling back to DemoOCRProvider.")
            return self.providers["demo"].extract_text(file_path, language=language)

ocr_service = OCRService()
