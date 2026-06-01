"""
Exam Service - Generate and evaluate AI MCQ exams
"""
import json
import re
from typing import List, Dict, Optional
from services.ollama_service import DEFAULT_MODEL
import httpx
import os

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")


MCQ_TOPICS = [
    "Machine Learning Fundamentals",
    "Deep Learning & Neural Networks",
    "Natural Language Processing",
    "Computer Vision",
    "Reinforcement Learning",
    "Transformers & Attention",
    "Generative AI & GANs",
    "AI Ethics & Fairness",
    "Python for ML",
    "Data Preprocessing"
]


async def generate_exam(topic: str, difficulty: str = "medium", num_questions: int = 10) -> List[Dict]:
    """Generate MCQ exam questions using Ollama."""
    prompt = f"""Generate exactly {num_questions} multiple choice questions about "{topic}" at {difficulty} difficulty level.

Return ONLY a valid JSON array. No markdown, no explanation, just the JSON array.

Format:
[
  {{
    "id": 1,
    "question": "What is...?",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correct_answer": "A",
    "explanation": "Brief explanation of why A is correct."
  }}
]

Topics should cover practical and theoretical aspects of {topic}."""

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 2048}
                }
            )
            data = response.json()
            raw = data.get("response", "[]")

            # Extract JSON from response
            json_match = re.search(r'\[.*\]', raw, re.DOTALL)
            if json_match:
                questions = json.loads(json_match.group())
                return questions[:num_questions]
            return _get_fallback_questions(topic)

    except Exception as e:
        print(f"Exam generation error: {e}")
        return _get_fallback_questions(topic)


def evaluate_exam(questions: List[Dict], answers: Dict[str, str]) -> Dict:
    """Evaluate submitted exam answers."""
    correct = 0
    results = []
    weak_areas = []

    for q in questions:
        q_id = str(q["id"])
        user_answer = answers.get(q_id, "").strip().upper()
        correct_answer = q.get("correct_answer", "").strip().upper()
        is_correct = user_answer == correct_answer

        if is_correct:
            correct += 1
        else:
            weak_areas.append(q.get("question", "")[:50])

        results.append({
            "id": q["id"],
            "question": q["question"],
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    total = len(questions)
    score = (correct / total * 100) if total > 0 else 0

    return {
        "score": round(score, 1),
        "correct": correct,
        "total": total,
        "results": results,
        "weak_areas": weak_areas[:5],
        "grade": _get_grade(score),
        "feedback": _get_feedback(score)
    }


def _get_grade(score: float) -> str:
    if score >= 90: return "A+"
    if score >= 80: return "A"
    if score >= 70: return "B"
    if score >= 60: return "C"
    if score >= 50: return "D"
    return "F"


def _get_feedback(score: float) -> str:
    if score >= 90: return "Excellent! You have a strong grasp of this topic! 🌟"
    if score >= 70: return "Good work! Review the missed topics to strengthen your knowledge. 📚"
    if score >= 50: return "Keep studying! Focus on the weak areas identified above. 💪"
    return "This topic needs more attention. Review the fundamentals and try again! 📖"


def _get_fallback_questions(topic: str) -> List[Dict]:
    """Fallback questions if LLM fails."""
    return [
        {
            "id": 1,
            "question": f"Which of the following best describes {topic}?",
            "options": [
                "A) A programming language",
                "B) A subfield of Artificial Intelligence",
                "C) A database management system",
                "D) An operating system"
            ],
            "correct_answer": "B",
            "explanation": f"{topic} is indeed a subfield of AI."
        }
    ]
