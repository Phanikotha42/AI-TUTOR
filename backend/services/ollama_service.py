"""
Ollama Service - Handles communication with local Ollama LLM
"""
import os
import json
import httpx
from typing import AsyncGenerator, Optional

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3")

# Topics the AI tutor covers
AI_TOPICS = [
    "machine learning", "deep learning", "nlp", "natural language processing",
    "cnn", "convolutional", "rnn", "recurrent", "lstm", "transformer",
    "attention", "ai ethics", "computer vision", "reinforcement learning",
    "neural network", "generative ai", "gan", "diffusion", "data mining",
    "python", "pytorch", "tensorflow", "keras", "scikit", "bert", "gpt",
    "llm", "large language model", "embedding", "vector", "classification",
    "regression", "clustering", "gradient", "backpropagation", "overfitting",
    "regularization", "dropout", "batch normalization", "activation function",
    "robotics", "ai agent", "autonomous", "rag", "retrieval", "fine-tuning",
    "prompt engineering", "few-shot", "zero-shot", "transfer learning",
    "semantic", "sentiment", "object detection", "image segmentation",
    "speech recognition", "text generation", "summarization", "translation"
]


def is_ai_related(question: str) -> bool:
    """Check if the question is AI-related."""
    q_lower = question.lower()
    return any(topic in q_lower for topic in AI_TOPICS)


def build_system_prompt() -> str:
    return """You are an expert AI Tutor specializing exclusively in Artificial Intelligence topics.

You ONLY answer questions about: Machine Learning, Deep Learning, NLP, CNNs, RNNs, LSTMs, Transformers, 
AI Ethics, Computer Vision, Reinforcement Learning, Neural Networks, Generative AI, Data Mining, 
Python for AI, AI Agents, Robotics, LLMs, and related AI/ML topics.

For EVERY answer, structure your response EXACTLY like this:

**Explanation:**
[Clear, concise explanation in 2-3 sentences]

**Example:**
[A practical, concrete example]

**Key Takeaway:**
[One-sentence summary of the most important point]

Keep responses around 200 words. Be educational, clear, and beginner-friendly.
If the question is NOT about AI/ML topics, politely respond: "I specialize in Artificial Intelligence topics only. Please ask me about ML, Deep Learning, NLP, or other AI subjects!"
"""


async def generate_response(
    prompt: str,
    context: str = "",
    model: str = DEFAULT_MODEL
) -> str:
    """Generate a response from Ollama with context."""
    if not is_ai_related(prompt):
        return "I specialize in Artificial Intelligence topics only. Please ask me about ML, Deep Learning, NLP, or other AI subjects! 🤖"

    full_prompt = f"""Context from knowledge base:
{context if context else "No additional context available."}

Student's Question: {prompt}

Please provide a structured educational answer."""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": full_prompt,
                    "system": build_system_prompt(),
                    "stream": False,
                    "options": {
                        "temperature": 0.7,
                        "top_p": 0.9,
                        "num_predict": 512,
                    }
                }
            )
            response.raise_for_status()
            data = response.json()
            return data.get("response", "Sorry, I couldn't generate a response.")
    except httpx.ConnectError:
        return "⚠️ Ollama is not running. Please start Ollama with `ollama serve` and pull a model with `ollama pull llama3`."
    except httpx.TimeoutException:
        return "⚠️ Response timed out. The model may be loading. Please try again in a moment."
    except Exception as e:
        return f"⚠️ Error generating response: {str(e)}"


async def stream_response(
    prompt: str,
    context: str = "",
    model: str = DEFAULT_MODEL
) -> AsyncGenerator[str, None]:
    """Stream a response from Ollama token by token."""
    if not is_ai_related(prompt):
        yield "I specialize in Artificial Intelligence topics only. Please ask me about ML, Deep Learning, NLP, or other AI subjects! 🤖"
        return

    full_prompt = f"""Context from knowledge base:
{context if context else "No additional context available."}

Student's Question: {prompt}

Please provide a structured educational answer."""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": model,
                    "prompt": full_prompt,
                    "system": build_system_prompt(),
                    "stream": True,
                    "options": {"temperature": 0.7, "top_p": 0.9, "num_predict": 512}
                }
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if token := data.get("response", ""):
                                yield token
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
    except httpx.ConnectError:
        yield "⚠️ Ollama is not running. Please start with `ollama serve`."
    except Exception as e:
        yield f"⚠️ Error: {str(e)}"


async def get_available_models() -> list:
    """Get list of models installed in Ollama."""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            data = response.json()
            return [m["name"] for m in data.get("models", [])]
    except Exception:
        return []
