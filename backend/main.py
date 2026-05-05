from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import sys
import os
import asyncio
from urllib.parse import unquote
from fastapi.responses import FileResponse

# Add agents directory to path to import functions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'agents', 'core'))

from createChroma import subir_ficheros, crear_embeddings, cargar_documentos_desde_bytes, eliminar_documento_por_nombre, BASE_DIR
from RagWithDocGenerator import process_message_with_agent
from classes.ChatModels import ChatMessage, ChatResponse
from classes.FileModels import FileInfo, UploadResponse, DeleteResponse
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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
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


@app.delete("/delete/{filename}", response_model=DeleteResponse)
async def delete_file(filename: str):
    """
    Elimina un archivo y todas sus vectorizaciones de ChromaDB
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
        from urllib.parse import unquote
        filename_decoded = unquote(filename)
        
        print(f"Buscando archivo para eliminar: '{filename_decoded}'")
        
        # Eliminar documentos de ChromaDB
        documentos_eliminados = eliminar_documento_por_nombre(filename_decoded)
        
        if documentos_eliminados == 0:
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontraron documentos para el archivo '{filename_decoded}'"
            )
        
        return DeleteResponse(
            message=f"Archivo '{filename_decoded}' eliminado correctamente",
            file_deleted=filename_decoded,
            documents_removed=documentos_eliminados
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al eliminar el archivo: {str(e)}"
        )


@app.get("/generated-files", response_model=List[FileInfo])
async def get_generated_files():
    """
    Obtiene información sobre los archivos generados por la IA en la carpeta generated_documents
    """
    try:
        generated_dir = os.path.join(os.path.dirname(__file__), "generated_documents")
        
        if not os.path.exists(generated_dir):
            return []
        
        files = []
        for filename in os.listdir(generated_dir):
            file_path = os.path.join(generated_dir, filename)
            if os.path.isfile(file_path):
                # Obtener información del archivo
                stat = os.stat(file_path)
                files.append(FileInfo(
                    name=filename,
                    count=1  # Cada archivo generado cuenta como 1 documento
                ))
        
        return sorted(files, key=lambda x: x.name)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener archivos generados: {str(e)}")

@app.get("/generated-files/{filename}")
async def get_generated_file(filename: str):
    """
    Sirve un archivo generado para su visualización o descarga
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
        filename_decoded = unquote(filename)
 
        generated_dir = os.path.join(os.path.dirname(__file__), "generated_documents")
        file_path = os.path.join(generated_dir, filename_decoded)
 
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontró el archivo generado '{filename_decoded}'"
            )
 
        # Determinar el MIME type basado en la extensión
        if filename_decoded.lower().endswith('.pdf'):
            media_type = "application/pdf"
        else:
            media_type = "application/octet-stream"
 
        return FileResponse(
            file_path,
            media_type=media_type,
            filename=filename_decoded,
            headers={"Content-Disposition": "inline"}
        )
 
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al servir el archivo generado: {str(e)}"
        )


@app.delete("/generated-files/{filename}", response_model=DeleteResponse)
async def delete_generated_file(filename: str):
    """
    Elimina un archivo generado de la carpeta generated_documents
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
        from urllib.parse import unquote
        filename_decoded = unquote(filename)
        
        generated_dir = os.path.join(os.path.dirname(__file__), "generated_documents")
        file_path = os.path.join(generated_dir, filename_decoded)
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"No se encontró el archivo generado '{filename_decoded}'"
            )
        
        os.remove(file_path)
        
        return DeleteResponse(
            message=f"Archivo generado '{filename_decoded}' eliminado correctamente",
            file_deleted=filename_decoded,
            documents_removed=1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error al eliminar el archivo generado: {str(e)}"
        )


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
