from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from typing import List
from urllib.parse import unquote
import os

from classes.FileModels import FileInfo, DeleteResponse

router = APIRouter(prefix="/generated-files", tags=["generated-files"])


@router.get("", response_model=List[FileInfo])
async def get_generated_files():
    """
    Obtiene información sobre los archivos generados por la IA en la carpeta backend/generated_documents
    """
    try:
        generated_dir = os.path.join(os.path.dirname(__file__), "..", "generated_documents")
        
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


@router.get("/{filename}")
async def get_generated_file(filename: str):
    """
    Sirve un archivo generado para su visualización o descarga
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
        filename_decoded = unquote(filename)

        generated_dir = os.path.join(os.path.dirname(__file__), "..", "generated_documents")
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


@router.delete("/{filename}", response_model=DeleteResponse)
async def delete_generated_file(filename: str):
    """
    Elimina un archivo generado de la carpeta outputs
    """
    try:
        # Decodificar el filename para manejar espacios y caracteres especiales
        filename_decoded = unquote(filename)

        generated_dir = os.path.join(os.path.dirname(__file__), "..", "generated_documents")
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
