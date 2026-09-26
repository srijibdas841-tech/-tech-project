from abc import ABC, abstractmethod
from typing import Dict, Any, List

class BaseOCRProvider(ABC):
    """Abstract Base Class for OCR providers (Transarect, Demo/Mock, Tesseract, etc.)"""

    @abstractmethod
    def extract_text(self, file_path: str, language: str = "en") -> Dict[str, Any]:
        """
        Extract raw text and word-level/line-level bounding boxes and confidences.
        Returns:
            {
                "full_text": str,
                "confidence": float (0-100),
                "words": List[{"text": str, "confidence": float, "box": [x1, y1, x2, y2]}],
                "provider": str
            }
        """
        pass
