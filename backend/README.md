# ToolChain Backend API

Backend FastAPI para integración del frontend con los agentes RAG y ChromaDB.

## Instalación

```bash
cd backend
pip install -r requirements.txt
```

## Ejecución

```bash
python main.py
```

O con uvicorn directamente:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

### GET `/`
- Descripción: Root endpoint
- Respuesta: `{"message": "ToolChain API - RAG Integration"}`

### GET `/health`
- Descripción: Health check
- Respuesta: `{"status": "healthy"}`

### GET `/files`
- Descripción: Obtiene información sobre archivos indexados en ChromaDB
- Respuesta: `List[FileInfo]`
  ```json
  [
    {
      "name": "documento.pdf",
      "count": 150
    }
  ]
  ```

### POST `/upload`
- Descripción: Sube archivos PDF, los procesa y los indexa en ChromaDB
- Content-Type: `multipart/form-data`
- Body: Archivos PDF (multipart)
- Respuesta: `UploadResponse`
  ```json
  {
    "message": "Se procesaron 2 archivo(s) correctamente",
    "files_processed": 2,
    "documents_indexed": 300
  }
  ```

## Integración con Frontend

El frontend debe hacer requests a `http://localhost:8000` con los siguientes ejemplos:

### Obtener archivos
```typescript
const response = await fetch('http://localhost:8000/files');
const files = await response.json();
```

### Subir archivos
```typescript
const formData = new FormData();
files.forEach(file => formData.append('files', file));

const response = await fetch('http://localhost:8000/upload', {
  method: 'POST',
  body: formData
});
const result = await response.json();
```

## Dependencias

- FastAPI 0.115.0
- Uvicorn 0.32.0
- Pydantic 2.9.0
- python-multipart 0.0.12
- aiofiles 24.1.0
- LangChain (del proyecto agents)
