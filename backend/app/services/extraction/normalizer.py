import re
import string

class DataNormalizer:
    """
    NLP and Rule-based Data Normalizer for Indian land records.
    Normalizes names, addresses, survey numbers, dates, and amounts for
    consistent validation and high-precision duplicate matching.
    """

    HONORIFICS = {
        "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "shri", "sri", "smt", "smt.",
        "late", "dr", "dr.", "adv", "adv.", "shree"
    }

    @staticmethod
    def normalize_text(text: str) -> str:
        """Strip punctuation, excessive whitespaces, and convert to title case."""
        if not text:
            return ""
        cleaned = re.sub(r'[^\w\s]', ' ', text)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned.title()

    @classmethod
    def normalize_name(cls, name: str) -> str:
        """
        Normalizes personal names:
        - Removes honorifics (Shri, Smt, Late, Mr, etc.)
        - Expands single-letter abbreviations where possible or standardizes them
        - Removes punctuation and standardizes spacing and casing
        Examples:
          'RAHUL K. DAS' -> 'Rahul K Das'
          'Shri Rahul Kumar Das' -> 'Rahul Kumar Das'
        """
        if not name:
            return ""
        cleaned = re.sub(r'[^\w\s]', ' ', name).strip()
        tokens = cleaned.split()
        filtered = [t for t in tokens if t.lower() not in cls.HONORIFICS]
        if not filtered:
            filtered = tokens
        return " ".join(t.capitalize() for t in filtered)

    @staticmethod
    def normalize_survey_number(survey_no: str) -> str:
        """
        Standardizes survey/dag numbers.
        Examples:
          '123 / 4' -> '123/4'
          '123-4' -> '123/4'
          ' 123 / 4 A ' -> '123/4A'
        """
        if not survey_no:
            return ""
        s = survey_no.strip().upper()
        # Replace dashes or spaces around slashes
        s = re.sub(r'\s*[/\\-]\s*', '/', s)
        s = re.sub(r'\s+', '', s)
        return s

    @staticmethod
    def normalize_area(area_val: any) -> float:
        """Converts strings like '2.45 Acres', '2.45', '1-80' into standard float value."""
        if area_val is None:
            return 0.0
        if isinstance(area_val, (int, float)):
            return round(float(area_val), 3)
        match = re.search(r'([0-9]+(?:\.[0-9]+)?)', str(area_val).replace('-', '.'))
        if match:
            return round(float(match.group(1)), 3)
        return 0.0

    @staticmethod
    def normalize_address(address: str) -> str:
        """Normalizes addresses by removing postal prefixes and standardizing whitespace."""
        if not address:
            return ""
        addr = re.sub(r'\b(vill|village|po|p\.o\.|ps|p\.s\.|dist|district|block|taluk|taluka)\b[:.]?', '', address, flags=re.IGNORECASE)
        addr = re.sub(r'[^\w\s,]', ' ', addr)
        addr = re.sub(r'\s+', ' ', addr).strip()
        return addr.title()

    @staticmethod
    def normalize_registration_number(reg_no: str) -> str:
        """Standardizes registration numbers (e.g. REG-WB-2018-9941)."""
        if not reg_no:
            return ""
        cleaned = re.sub(r'[\s]+', '-', reg_no.strip().upper())
        return cleaned

normalizer = DataNormalizer()
