# ToolChain - Asistente Inteligente con RAG y Generación de Documentos

## Descripción del Problema

ToolChain resuelve el problema de gestión y consulta eficiente de grandes volúmenes de documentos PDF, permitiendo a los usuarios:

- **Indexar y buscar** contenido en múltiples documentos PDF de manera inteligente
- **Generar resúmenes, exámenes y otros documentos** basados en el contenido de los archivos
- **Convertir texto a audio** para facilitar el consumo de información
- **Interactuar conversacionalmente** con el contenido de los documentos mediante un asistente IA

La aplicación utiliza técnicas de RAG (Retrieval-Augmented Generation) para proporcionar respuestas precisas basadas exclusivamente en el contenido de los documentos indexados, evitando alucinaciones de la IA.

## Integración de Inteligencia Artificial

El sistema integra IA de múltiples formas:

### 1. **RAG (Retrieval-Augmented Generation)**
- **Vectorización**: Los documentos PDF se dividen en chunks y se convierten a embeddings usando `mxbai-embed-large` de Ollama
- **Almacenamiento**: ChromaDB persiste los embeddings para búsqueda semántica
- **Recuperación**: Cuando el usuario hace una pregunta, el sistema busca los chunks más relevantes en la base vectorial
- **Generación**: El modelo LLM (`gemma4:26b`) utiliza la información recuperada para generar respuestas contextuales

### 2. **Agente LangChain con Tools**
El sistema implementa un agente IA con acceso a herramientas especializadas:

- **`informacion_rag`**: Busca información en la base vectorial con filtrado por fuentes
- **`generar_audio`**: Convierte texto a audio usando Suno/Bark TTS
- **Herramientas MCP**: Conecta con `document-generator-mcp` para crear documentos Word/PDF

### 3. **OCR Automático**
- Detecta PDFs escaneados sin texto extraíble
- Aplica OCR automáticamente usando `ocrmypdf` para hacer el contenido searchable

## Arquitectura General

### Componentes Software

```
ToolChain/
├── frontend/              # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/    # Componentes modulares UI
│   │   ├── hooks/         # Custom hooks (useMainContent)
│   │   ├── services/      # Servicios API
│   │   └── modals/        # Modales de interacción
│   └── package.json
│
├── backend/              # FastAPI
│   ├── routers/          # Endpoints API
│   │   ├── chat.py       # /chat - Comunicación con agente
│   │   ├── files.py      # /files - Gestión de archivos
│   │   ├── generated_files.py  # Archivos generados
│   │   └── health.py     # Health check
│   ├── classes/          # Modelos Pydantic
│   └── main.py           # Entry point FastAPI
│
├── agents/               # Lógica de agentes IA
│   └── core/
│       ├── RagWithDocGenerator.py  # Gestión de tools y llamadas al agente
│       └── createChroma.py         # Gestión ficheros PDF y persistencia con ChromaDB
│
├── database/             # ChromaDB persistente
│   └── chroma_db/
│
└── config/
    └── requirements.txt  # Dependencias Python
```

### Flujo del Agente

```
1. Usuario sube PDF
   ↓
2. Backend recibe archivo (POST /upload)
   ↓
3. createChroma.py procesa PDF:
   - Extrae texto con PyPDFLoader
   - Si no hay texto → aplica OCR
   - Divide en chunks (1500 chars, 300 overlap)
   ↓
4. Genera embeddings con Ollama (mxbai-embed-large)
   ↓
5. Almacena en ChromaDB
   ↓
6. Usuario hace pregunta
   ↓
7. Frontend envía a /chat
   ↓
8. RagWithDocGenerator.process_message_with_agent:
   - Agente usa tool informacion_rag
   - Busca en ChromaDB (top 4 chunks)
   - Si se especifican sources, filtra por archivos
   ↓
9. LLM (gemma4:26b) genera respuesta
   ↓
10. Si usuario pide documento/audio:
    - Agente usa tools MCP o generar_audio
    - Genera archivo en backend/generated_documents
    ↓
11. Respuesta enviada al frontend
```

### Tools Utilizadas

#### LangChain Tools
- **`informacion_rag`**: Búsqueda semántica en ChromaDB con filtrado por fuentes
- **`generar_audio`**: TTS con Suno/Bark para generar audio en español

#### MCP Tools (document-generator-mcp)
- **`gerar_documento_word`**: Genera documentos Word
- **`gerar_documento_pdf`**: Genera documentos PDF

#### Tecnologías de Procesamiento
- **PyPDFLoader**: Extracción de texto de PDFs
- **OCRMyPDF**: OCR para PDFs escaneados
- **RecursiveCharacterTextSplitter**: División inteligente de documentos

## Tecnologías Utilizadas

### Frontend
- **React 19.2.5** - Framework UI
- **TypeScript 6.0.2** - Tipado estático
- **Vite 8.0.10** - Build tool
- **Framer Motion 12.38.0** - Animaciones
- **Lucide React 1.9.0** - Iconos

### Backend
- **FastAPI 0.115.0** - Framework API
- **Uvicorn 0.32.0** - Servidor ASGI
- **Pydantic 2.12.0** - Validación de datos

### IA & Machine Learning
- **LangChain** - Framework para agentes IA
- **LangGraph** - Orquestación de workflows
- **Ollama** - LLM local (gemma4:e2b, mxbai-embed-large)
- **ChromaDB** - Base vectorial
- **Bark (Suno)** - Text-to-Speech
- **Transformers (Hugging Face)** - Modelos NLP
- **PyTorch 2.9.0** - Framework deep learning

### Procesamiento de Documentos
- **pypdf** - Lectura de PDFs
- **ocrmypdf** - OCR para PDFs escaneados
- **tesseract-ocr** - Motor OCR (sistema)

### MCP (Model Context Protocol)
- **document-generator-mcp** - Generación de documentos
- **langchain_mcp_adapters** - Integración MCP con LangChain

## Instrucciones de Ejecución

### Prerrequisitos

1. **Python 3.9+**
2. **Node.js 18+**
3. **Ollama** instalado y ejecutándose
4. **Tesseract OCR** (sistema):
   - Linux: `sudo apt install tesseract-ocr tesseract-ocr-spa`
   - macOS: `brew install tesseract tesseract-lang`
5. **npm** (para MCP): `npm install -g document-generator-mcp`

### 1. Instalar Dependencias Python

```bash
cd ToolChain
pip install -r config/requirements.txt
```

### 2. Instalar Modelo Ollama

```bash
# Instalar Ollama si no lo tienes
curl -fsSL https://ollama.com/install.sh | sh

# Descargar modelos
ollama pull gemma4:26b
ollama pull mxbai-embed-large

# Iniciar Ollama
ollama serve
```

### 3. Iniciar Backend FastAPI

```bash
cd backend
python main.py
# O con uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El backend estará disponible en `http://localhost:8000`

### 4. Iniciar Frontend React

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### 5. Verificar Instalación

- **Health Check**: `http://localhost:8000/health`
- **API Docs**: `http://localhost:8000/docs`
- **Frontend**: `http://localhost:5173`

## Uso Básico

1. **Subir Documentos**:
   - Clic en el botón `+` en la sección "Archivos"
   - Seleccionar uno o más PDFs
   - El sistema procesará e indexará automáticamente

2. **Consultar Documentos**:
   - Escribir preguntas en el chat
   - El agente buscará información relevante en los documentos
   - Recibirás respuestas basadas exclusivamente en el contenido

3. **Generar Resúmenes**:
   - Clic en "Generar Resumen"
   - Seleccionar los archivos a resumir
   - El agente generará un PDF con el resumen

4. **Generar Exámenes**:
   - Clic en "Generar Examen"
   - Seleccionar los archivos de referencia
   - El agente creará un examen basado en el contenido

5. **Generar Audio**:
   - Clic en "Generar Audio"
   - Seleccionar archivos y especificar contenido
   - El sistema generará un archivo de audio

## Mejoras Futuras

### Funcionalidades
- [ ] Implementar persistencia de historial con SQLite/Redis
- [ ] Añadir soporte para más formatos de documentos (DOCX, TXT, etc.)
- [ ] Añadir sistema de usuarios y autenticación
- [ ] Permitir múltiples conversaciones/RAGs independientes
- [ ] Aumentar limite máximo de subida de fichero



