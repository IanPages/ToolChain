from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import sys
import os
import asyncio

# Add agents directory to path to import functions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agents', 'core'))

from createChroma import subir_ficheros, crear_embeddings, cargar_documentos_desde_bytes,BASE_DIR
from RagWithDocGenerator import process_message_with_agent
from classes.ChatModels import ChatMessage, ChatResponse
from classes.FileModels import FileInfo,UploadResponse
from datetime import datetime
from langchain_chroma import Chroma


CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "database", "chroma_db")
COLLECTION_NAME = "pdfs"

app = FastAPI(
    title="ToolChain API",
    description="API para integración frontend con agentes RAG",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/")
async def root():
    return {"message": "ToolChain API - RAG Integration"}


@app.get("/files", response_model=List[FileInfo])
async def get_files():
    """
    Obtiene información sobre los archivos indexados en ChromaDB
    """
    print(BASE_DIR)
    print(CHROMA_DIR)
    try:
        embeddings = crear_embeddings()
        vectorstore = Chroma(
            persist_directory=CHROMA_DIR,
            collection_name=COLLECTION_NAME,
            embedding_function=embeddings,
        )

        # Get collection metadata
        collection = vectorstore._collection
        count = collection.count()

        # Try to get unique source files from metadata
        if count > 0:
            results = collection.get(include=["metadatas"])

            unique_sources = set()
            for metadata in results.get("metadatas", []):
                if metadata and "source" in metadata:
                    source = metadata["source"]
                    # Extract filename from path
                    filename = os.path.basename(source) if source else "unknown"
                    unique_sources.add(filename)

            return [
                FileInfo(name=source, count=count // len(unique_sources) if unique_sources else count)
                for source in unique_sources
            ]

        return []

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener archivos: {str(e)}")


@app.post("/upload", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Sube archivos PDF, los procesa y los indexa en ChromaDB
    """
    if not files:
        raise HTTPException(status_code=400, detail="No se proporcionaron archivos")

    documents_processed = 0
    total_documents = 0

    try:
        todos_documentos = []
        print(f"Archivos recibidos: {len(files)}")
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                print(f"Archivo ignorado (no PDF): {file.filename}")
                continue

            # Read file content
            content = await file.read()
            print(f"Archivo leído: {file.filename}, tamaño: {len(content)} bytes")

            # Load documents using the function from createChroma
            documentos = cargar_documentos_desde_bytes(content, file.filename)
            print(f"Documentos cargados: {len(documentos)}")

            # Add metadata with filename
            for doc in documentos:
                doc.metadata["source"] = file.filename
            todos_documentos.extend(documentos)
            documents_processed += len(documentos)
            total_documents += len(documentos)

        print(f"Total documentos a procesar: {total_documents}")
        if total_documents > 0:
            # Process documents using subir_ficheros
            subir_ficheros(todos_documentos)

        return UploadResponse(
            message=f"Se procesaron {len(files)} archivo(s) correctamente",
            files_processed=len(files),
            documents_indexed=total_documents
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivos: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    """
    Procesa un mensaje del usuario usando el agente RAG de RagWithDocGenerator
    """
    try:
        # Usar la función reutilizable de RagWithDocGenerator
        response = await process_message_with_agent(
            chat_message.message,
            use_mcp=True,
            thread_id=chat_message.session_id
        )
        print(chat_message.session_id)


        return ChatResponse(
            response=response,
            session_id=chat_message.session_id or str(hash(chat_message.message)),
            timestamp=datetime.now().isoformat()
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el chat: {str(e)}")


# Session storage for chat history (in-memory, replace with Redis for production)
chat_sessions = {}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
