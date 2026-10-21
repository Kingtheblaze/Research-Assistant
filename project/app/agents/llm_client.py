"""
LLM Client Wrapper
Connects to local LM Studio (or any OpenAI-compatible server at http://localhost:1234/v1)
with robust JSON structured parsing and fallback handling.
"""

from __future__ import annotations
import json
import logging
import os
import re
from typing import Type, TypeVar, Optional, Dict, Any
from pydantic import BaseModel
import requests

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


def get_llm_config() -> Dict[str, Any]:
    """Load LLM configuration from environment or defaults."""
    return {
        "base_url": os.getenv("LM_STUDIO_BASE_URL", "http://localhost:1234/v1"),
        "api_key": os.getenv("OPENAI_API_KEY", "lm-studio"),
        "model": os.getenv("MODEL_NAME", "llama-3.1-8b-instruct"),
        "temperature": float(os.getenv("TEMPERATURE", "0.2")),
    }


def call_llm(prompt: str, system_message: str = "", temperature: float = 0.2, max_tokens: int = 2500) -> str:
    """
    Call the local LM Studio / OpenAI-compatible endpoint.
    If server is unavailable, returns empty string so agents use deterministic fallback logic.
    """
    config = get_llm_config()
    url = f"{config['base_url'].rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {config['api_key']}",
        "Content-Type": "application/json"
    }
    
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": config["model"],
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        else:
            logger.warning("LLM call returned status %d. Utilizing deterministic node synthesis.", response.status_code)
    except Exception as exc:
        logger.debug("Local LM Studio server not reachable at %s (%s). Falling back.", url, str(exc))

    return ""


def call_structured_llm(
    prompt: str,
    schema: Type[T],
    system_message: str = "",
    temperature: float = 0.2
) -> Optional[T]:
    """
    Call LLM requesting JSON matching the Pydantic schema and parse the output.
    """
    json_instructions = (
        f"\n\nYou MUST respond ONLY with valid JSON conforming to the following Pydantic schema:\n"
        f"{schema.model_json_schema()}\nDo NOT include markdown backticks or commentary."
    )
    full_prompt = prompt + json_instructions
    raw_response = call_llm(full_prompt, system_message=system_message, temperature=temperature)
    
    if not raw_response:
        return None

    try:
        # Strip potential markdown code blocks
        clean_json = raw_response.strip()
        if "```" in clean_json:
            match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", clean_json)
            if match:
                clean_json = match.group(1).strip()
        parsed = json.loads(clean_json)
        return schema.model_validate(parsed)
    except Exception as exc:
        logger.warning("Failed to parse structured LLM output into %s: %s", schema.__name__, str(exc))
        return None
