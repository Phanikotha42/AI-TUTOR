"""
Analytics Route - Learning progress and statistics
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from database.db import get_db, ChatHistory, ExamResult, Document

router = APIRouter()


@router.get("/")
async def get_analytics(db: AsyncSession = Depends(get_db)):
    """Get comprehensive analytics dashboard data."""

    # Chat stats
    chat_count = await db.scalar(select(func.count(ChatHistory.id)))

    # Exam stats
    exam_count = await db.scalar(select(func.count(ExamResult.id)))
    avg_score = await db.scalar(select(func.avg(ExamResult.score)))

    # Document stats
    doc_count = await db.scalar(select(func.count(Document.id)))

    # Recent exams
    exam_result = await db.execute(
        select(ExamResult).order_by(desc(ExamResult.created_at)).limit(10)
    )
    recent_exams = exam_result.scalars().all()

    # Score trend
    score_trend = [
        {"topic": e.topic, "score": e.score, "date": e.created_at.isoformat()}
        for e in recent_exams
    ]

    # Topic frequency from exams
    topic_counts = {}
    all_exams = await db.execute(select(ExamResult))
    for exam in all_exams.scalars().all():
        topic_counts[exam.topic] = topic_counts.get(exam.topic, 0) + 1

    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "summary": {
            "total_questions_asked": chat_count or 0,
            "total_exams_taken": exam_count or 0,
            "average_exam_score": round(avg_score or 0, 1),
            "documents_uploaded": doc_count or 0,
        },
        "score_trend": score_trend,
        "top_topics": [{"topic": t[0], "count": t[1]} for t in top_topics],
        "recent_activity": score_trend[:5]
    }


@router.get("/leaderboard")
async def get_leaderboard(db: AsyncSession = Depends(get_db)):
    """Get top scores by topic."""
    result = await db.execute(
        select(ExamResult)
        .order_by(desc(ExamResult.score))
        .limit(10)
    )
    exams = result.scalars().all()
    return [
        {
            "rank": i + 1,
            "topic": e.topic,
            "score": e.score,
            "date": e.created_at.isoformat()
        }
        for i, e in enumerate(exams)
    ]
