"""
Upload Route - PDF upload and document management
"""
import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database.db import get_db, Document
from services.rag_service import ingest_pdf
from services.vector_service import delete_document_chunks, get_document_count
import aiofiles

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "./rag/uploaded_docs")
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


@router.post("/")
async def upload_pdf(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Upload a PDF and index it in the vector DB."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty file")

    # Save file
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Ingest into vector DB
    chunk_count = ingest_pdf(file_path, file.filename)

    if chunk_count == 0:
        os.remove(file_path)
        raise HTTPException(status_code=422, detail="Could not extract text from PDF")

    # Save to DB
    doc = Document(
        filename=file.filename,
        file_path=file_path,
        chunk_count=chunk_count
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    return {
        "message": f"Successfully uploaded and indexed {file.filename}",
        "document_id": doc.id,
        "filename": file.filename,
        "chunks_indexed": chunk_count
    }


@router.get("/documents")
async def list_documents(db: AsyncSession = Depends(get_db)):
    """List all uploaded documents."""
    result = await db.execute(select(Document).order_by(Document.uploaded_at.desc()))
    docs = result.scalars().all()
    return [
        {
            "id": d.id,
            "filename": d.filename,
            "chunk_count": d.chunk_count,
            "uploaded_at": d.uploaded_at.isoformat()
        }
        for d in docs
    ]


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a document and remove from vector DB."""
    result = await db.execute(select(Document).where(Document.id == doc_id))
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove from vector DB
    delete_document_chunks(doc.filename)

    # Remove file
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)
    await db.commit()
    return {"message": f"Deleted {doc.filename}"}


@router.get("/stats")
async def vector_stats():
    """Get vector DB statistics."""
    count = get_document_count()
    return {"total_chunks": count}
