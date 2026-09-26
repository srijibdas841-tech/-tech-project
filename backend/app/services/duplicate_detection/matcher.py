import difflib
from app.services.extraction.normalizer import normalizer

try:
    from thefuzz import fuzz
    HAS_THEFUZZ = True
except ImportError:
    HAS_THEFUZZ = False

class StringMatcher:
    """Computes exact and fuzzy string similarity ratios."""

    @staticmethod
    def similarity_ratio(s1: str, s2: str) -> float:
        if not s1 or not s2:
            return 0.0
        s1_clean = s1.strip().lower()
        s2_clean = s2.strip().lower()
        if s1_clean == s2_clean:
            return 100.0

        if HAS_THEFUZZ:
            # Token set ratio handles token reordering like "Das Rahul Kumar" vs "Rahul Kumar Das"
            return float(fuzz.token_set_ratio(s1_clean, s2_clean))
        else:
            return difflib.SequenceMatcher(None, s1_clean, s2_clean).ratio() * 100.0

    @classmethod
    def compare_names(cls, name1: str, name2: str) -> float:
        n1 = normalizer.normalize_name(name1)
        n2 = normalizer.normalize_name(name2)
        return cls.similarity_ratio(n1, n2)

    @classmethod
    def compare_survey_numbers(cls, s1: str, s2: str) -> float:
        norm1 = normalizer.normalize_survey_number(s1)
        norm2 = normalizer.normalize_survey_number(s2)
        if norm1 == norm2:
            return 100.0
        # Check base survey number if sub-plots differ
        base1 = norm1.split('/')[0] if '/' in norm1 else norm1
        base2 = norm2.split('/')[0] if '/' in norm2 else norm2
        if base1 == base2 and base1:
            return 85.0
        return cls.similarity_ratio(norm1, norm2)

    @classmethod
    def compare_area(cls, a1: float, a2: float) -> float:
        if a1 is None or a2 is None or a1 <= 0 or a2 <= 0:
            return 0.0
        diff = abs(a1 - a2)
        max_val = max(a1, a2)
        if diff == 0:
            return 100.0
        # Percentage difference
        pct_diff = diff / max_val
        if pct_diff < 0.05: # within 5%
            return 95.0
        elif pct_diff < 0.10: # within 10%
            return 80.0
        elif pct_diff < 0.20:
            return 60.0
        return max(0.0, 100.0 - (pct_diff * 100.0))

matcher = StringMatcher()
