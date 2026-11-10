"""Gnani Evon Foundation Model Integration Boundary.

Evon (gnani/gnani-evon-v3.3-30B-A3B) is an open-weights sovereign AI model hosted on
Hugging Face. When deployed via high-throughput inference engines (vLLM, SGLang, TGI,
or Hugging Face Dedicated Endpoints), it conforms to an OpenAI-compatible API schema.
"""
from typing import Optional, Dict, Any
import httpx
from backend.app.core.config import settings
from backend.app.core.logging import logger


class GnaniEvonClient:
    """Evon inference endpoint wrapper for LLM-based entity extraction."""

    def __init__(self):
        self.base_url = settings.EVON_API_BASE_URL.rstrip("/") if settings.EVON_API_BASE_URL else None
        self.api_key = settings.EVON_API_KEY
        self.model_name = settings.EVON_MODEL_NAME

    def is_available(self) -> bool:
        """Checks if a valid Evon inference endpoint is configured."""
        return bool(self.base_url)

    async def extract_transaction_llm(self, transcript: str) -> Optional[Dict[str, Any]]:
        """
        Calls Evon chat completions endpoint if available.
        """
        if not self.is_available():
            return None

        endpoint = f"{self.base_url}/chat/completions"
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        prompt = (
            "You are an Indian business ledger parser. Extract JSON with keys: "
            "customer_name (string), amount_rupees (number), transaction_type ('CREDIT' or 'PAYMENT'), "
            "description (string). Transcript: " + transcript
        )

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": "You output only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.0
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(endpoint, json=payload, headers=headers)
                if res.status_code == 200:
                    import json
                    content = res.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
        except Exception as e:
            logger.warning(f"Evon LLM endpoint call failed: {e}. Falling back to rule-based engine.")
        return None
