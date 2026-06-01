"""
Exam Route - Generate and submit AI exams
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from database.db import get_db, ExamResult
from services.exam_service import generate_exam, evaluate_exam, MCQ_TOPICS

router = APIRouter()


class GenerateExamRequest(BaseModel):
    topic: str
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 10


class SubmitExamRequest(BaseModel):
    topic: str
    questions: List[Dict]
    answers: Dict[str, str]


@router.get("/topics")
async def get_topics():
    """Get available exam topics."""
    return {"topics": MCQ_TOPICS}


@router.post("/generate")
async def create_exam(request: GenerateExamRequest):
    """Generate a new exam."""
    if request.num_questions < 1 or request.num_questions > 20:
        raise HTTPException(status_code=400, detail="Number of questions must be 1-20")

    questions = await generate_exam(
        topic=request.topic,
        difficulty=request.difficulty,
        num_questions=request.num_questions
    )

    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate exam questions")

    return {
        "topic": request.topic,
        "difficulty": request.difficulty,
        "questions": questions,
        "total": len(questions)
    }


@router.post("/submit")
async def submit_exam(request: SubmitExamRequest, db: AsyncSession = Depends(get_db)):
    """Submit exam answers and get evaluation."""
    if not request.questions:
        raise HTTPException(status_code=400, detail="No questions provided")

    evaluation = evaluate_exam(request.questions, request.answers)

    # Save result to DB
    result = ExamResult(
        topic=request.topic,
        score=evaluation["score"],
        total_questions=evaluation["total"],
        correct_answers=evaluation["correct"],
        weak_areas=evaluation["weak_areas"]
    )
    db.add(result)
    await db.commit()

    return evaluation


@router.get("/history")
async def exam_history(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Get exam history."""
    result = await db.execute(
        select(ExamResult).order_by(desc(ExamResult.created_at)).limit(limit)
    )
    exams = result.scalars().all()
    return [
        {
            "id": e.id,
            "topic": e.topic,
            "score": e.score,
            "correct": e.correct_answers,
            "total": e.total_questions,
            "weak_areas": e.weak_areas or [],
            "created_at": e.created_at.isoformat()
        }
        for e in exams
    ]
