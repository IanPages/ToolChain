from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import sys
import os
from urllib.parse import unquote

# Add agents directory to path to import functions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'agents', 'core'))

from createChroma import subir_ficheros, crear_embeddings, cargar_documentos_desde_bytes, eliminar_documento_por_nombre, BASE_DIR
from classes.FileModels import FileInfo, UploadResponse, DeleteResponse
from langchain_chroma import Chroma

router = APIRouter(tags=["files"])

CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "database", "chroma_db")
COLLECTION_NAME = "pdfs"


@router.get("/files", response_model=List[FileInfo])
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


@router.post("/upload", response_model=UploadResponse)
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


@router.delete("/delete/{filename}", response_model=DeleteResponse)
async def delete_file(filename: str):
    """
    Elimina un archivo y todas sus vectorizaciones de ChromaDB
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
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
