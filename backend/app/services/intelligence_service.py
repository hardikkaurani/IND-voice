"""Transaction Intelligence Service for multilingual natural speech parsing."""
import re
from typing import Optional, Dict, Tuple, Any
from backend.app.models.transaction import TransactionType
from backend.app.schemas.voice import ExtractedTransaction
from backend.app.integrations.gnani_evon import GnaniEvonClient
from backend.app.core.logging import logger

# Number word maps for Hindi / Hinglish / Marathi / English
UNITS = {
    "ek": 1, "एक": 1, "one": 1,
    "do": 2, "दोन": 2, "दो": 2, "two": 2,
    "teen": 3, "तीन": 3, "three": 3,
    "chaar": 4, "char": 4, "चार": 4, "four": 4,
    "paanch": 5, "panch": 5, "पाँच": 5, "पांच": 5, "five": 5,
    "chhah": 6, "che": 6, "छह": 6, "सहा": 6, "six": 6,
    "saat": 7, "सात": 7, "seven": 7,
    "aath": 8, "आठ": 8, "eight": 8,
    "nau": 9, "नव": 9, "नौ": 9, "nine": 9,
    "das": 10, "दहा": 10, "दस": 10, "ten": 10,
    "gyarah": 11, "ग्यारह": 11,
    "barah": 12, "बारह": 12,
    "terah": 13, "तेरह": 13,
    "chaudah": 14, "चौदह": 14,
    "pandrah": 15, "पंद्रह": 15,
    "solah": 16, "सोलह": 16,
    "satrah": 17, "सत्रह": 17,
    "atharah": 18, "अठारह": 18,
    "unnis": 19, "उन्नीस": 19,
    "bees": 20, "वीस": 20, "बीस": 20, "twenty": 20,
    "pachas": 50, "पन्नास": 50, "पचास": 50, "fifty": 50,
    "dedh": 1.5, "डेढ़": 1.5,
    "dhai": 2.5, "ढाई": 2.5
}

SCALES = {
    "sau": 100, "so": 100, "सौ": 100, "hundred": 100, "she": 100,
    "hazar": 1000, "hazaar": 1000, "हज़ार": 1000, "हजार": 1000, "thousand": 1000,
    "lakh": 100000, "लाख": 100000
}

CREDIT_TRIGGERS = [
    "udhaar", "udhar", "उधार", "उधारी", "baaki", "baki", "बाकी",
    "credit", "debt", "diya", "diye", "दिया", "दिए", "दिले",
    "likh", "likho", "likh lo", "खाते में लिखो", "खतावणी"
]

PAYMENT_TRIGGERS = [
    "wapas", "wapas kiye", "wapas diya", "वापस", "वापस किए", "परत",
    "jama", "jama kiya", "jama kiye", "जमा", "जमा केले",
    "paid", "payment", "chukta", "chuka", "चुकाया", "चुकवले",
    "mila", "mile", "मिला", "मिले", "मिळाले", "aaye", "आए", "आले"
]

STOP_WORDS = {
    "ko", "ne", "se", "ka", "ki", "ke", "par", "mein", "me", "hai", "hain", "tha", "the",
    "rupaye", "rupay", "rupya", "rs", "inr", "rupaiye", "रुपये", "रुपया", "ला", "ने", "चे",
    "ji", "bhai", "bhaiya", "saheb", "seth", "sethji"
}


class TransactionIntelligenceService:
    def __init__(self):
        self.evon_client = GnaniEvonClient()

    def parse_amount(self, text: str) -> Optional[int]:
        """
        Extracts monetary amount from text and returns value in integer paise.
        Supports digits, Hindi numerals, and spoken words.
        """
        clean_text = text.lower()

        # 1. Direct regex for digits (e.g. 500, 200.50, 1500)
        digit_match = re.search(r'(?:rs\.?|inr|₹)?\s*(\d+(?:,\d+)*(?:\.\d{1,2})?)\s*(?:rs|rupaye|rupees|/-)?', clean_text)
        if digit_match:
            try:
                num_str = digit_match.group(1).replace(",", "")
                val = float(num_str)
                if val > 0:
                    return int(round(val * 100))
            except ValueError:
                pass

        # 2. Devanagari numerals
        devanagari_digits = str.maketrans("०१२३४५६७८९", "0123456789")
        trans_text = clean_text.translate(devanagari_digits)
        digit_match_dev = re.search(r'(\d+(?:\.\d{1,2})?)', trans_text)
        if digit_match_dev and digit_match_dev.group(1) != clean_text:
            try:
                val = float(digit_match_dev.group(1))
                if val > 0:
                    return int(round(val * 100))
            except ValueError:
                pass

        # 3. Spoken natural numbers (e.g. "paanch sau", "do sau", "ek hazar")
        tokens = re.findall(r'[\w\u0900-\u097F]+', clean_text)
        current_sum = 0
        current_mult = 0

        for token in tokens:
            if token in UNITS:
                val = UNITS[token]
                current_mult = val
            elif token in SCALES:
                scale = SCALES[token]
                if current_mult == 0:
                    current_mult = 1
                current_sum += current_mult * scale
                current_mult = 0
            elif token in ["rupaye", "rupees", "रुपये", "rs"]:
                if current_mult > 0:
                    current_sum += current_mult
                    current_mult = 0

        if current_mult > 0:
            current_sum += current_mult

        if current_sum > 0:
            return int(round(current_sum * 100))

        return None

    def determine_direction(self, text: str) -> Optional[TransactionType]:
        """
        Determines if the transaction is CREDIT or PAYMENT based on linguistic markers.
        """
        lower = text.lower()
        has_payment = any(trigger in lower for trigger in PAYMENT_TRIGGERS)
        has_credit = any(trigger in lower for trigger in CREDIT_TRIGGERS)

        if has_payment and not has_credit:
            return TransactionType.PAYMENT
        elif has_credit and not has_payment:
            return TransactionType.CREDIT
        elif has_payment and has_credit:
            # Context disambiguation: "wapas kiye" dominates "diye"
            if "wapas" in lower or "jama" in lower:
                return TransactionType.PAYMENT
            return TransactionType.CREDIT

        return None

    def extract_customer_name(self, text: str) -> Optional[str]:
        """
        Extracts customer name from grammatical cues:
        - '<Name> ko paanch sau...' -> Rahul
        - '<Name> ne do sau...' -> Amit
        - '<Name> se paanch sau...' -> Suresh
        - '<Name> bhai/ji...' -> Ramesh
        """
        # Look for pattern: Name followed by postposition (ko, ne, se, la)
        pattern = re.search(r'^\s*([\w\u0900-\u097F]+(?:\s+[\w\u0900-\u097F]+)?)\s+(?:ko|ne|se|la|ने|को|से)\b', text, re.IGNORECASE)
        if pattern:
            candidate = pattern.group(1).strip()
            # Filter out non-names
            tokens = [t for t in candidate.split() if t.lower() not in STOP_WORDS]
            if tokens:
                return " ".join(t.capitalize() for t in tokens)

        # Fallback: look at the first 1-2 words if not a number or trigger
        words = text.strip().split()
        if words:
            first = words[0].strip(".,!?:")
            if (
                first.lower() not in UNITS and
                first.lower() not in SCALES and
                first.lower() not in STOP_WORDS and
                first.lower() not in CREDIT_TRIGGERS and
                first.lower() not in PAYMENT_TRIGGERS and
                not first.isdigit()
            ):
                return first.capitalize()

        return None

    async def extract_transaction(
        self,
        transcript: str,
        detected_language: Optional[str] = None
    ) -> ExtractedTransaction:
        """
        Extracts structured transaction details from speech transcript.
        Guarantees Section 2.C & 2.D invariants:
        Never assume ambiguous amounts, customer identities, or directions.
        """
        clean_transcript = transcript.strip()
        if not clean_transcript:
            return ExtractedTransaction(
                original_transcript="",
                needs_clarification=True,
                clarification_reason="Empty speech audio. Please speak clearly into the microphone."
            )

        # 1. Deterministic NLP Engine
        amount_paise = self.parse_amount(clean_transcript)
        direction = self.determine_direction(clean_transcript)
        customer_name = self.extract_customer_name(clean_transcript)

        # 2. Check Evon LLM if configured and ambiguities exist
        if (not customer_name or not amount_paise or not direction) and self.evon_client.is_available():
            llm_result = await self.evon_client.extract_transaction_llm(clean_transcript)
            if llm_result:
                if not customer_name and llm_result.get("customer_name"):
                    customer_name = str(llm_result["customer_name"]).strip()
                if not amount_paise and llm_result.get("amount_rupees"):
                    try:
                        amount_paise = int(round(float(llm_result["amount_rupees"]) * 100))
                    except (ValueError, TypeError):
                        pass
                if not direction and llm_result.get("transaction_type"):
                    tx_type = str(llm_result["transaction_type"]).upper()
                    if tx_type in [TransactionType.CREDIT.value, TransactionType.PAYMENT.value]:
                        direction = TransactionType(tx_type)

        # 3. Assess Ambiguities & Clarification Requirements
        needs_clarification = False
        clarification_reasons = []

        if not customer_name:
            needs_clarification = True
            clarification_reasons.append("Customer name not detected")

        if not amount_paise or amount_paise <= 0:
            needs_clarification = True
            clarification_reasons.append("Monetary amount not detected")

        if not direction:
            needs_clarification = True
            clarification_reasons.append("Transaction direction (Credit vs Payment) ambiguous")

        amount_rupees = round(amount_paise / 100.0, 2) if amount_paise else None

        # Build natural description
        description = None
        if direction and customer_name and amount_rupees:
            if direction == TransactionType.CREDIT:
                description = f"Credit given to {customer_name}"
            else:
                description = f"Payment received from {customer_name}"

        confidence = 0.95 if not needs_clarification else 0.50

        return ExtractedTransaction(
            customer_name=customer_name,
            amount_paise=amount_paise,
            amount_rupees=amount_rupees,
            transaction_type=direction,
            description=description,
            currency="INR",
            confidence=confidence,
            language=detected_language or "hi-IN",
            original_transcript=clean_transcript,
            needs_clarification=needs_clarification,
            clarification_reason="; ".join(clarification_reasons) if clarification_reasons else None
        )
