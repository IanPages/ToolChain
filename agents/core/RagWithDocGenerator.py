import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage, AIMessage
from langchain.tools import tool
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os


CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "database", "chroma_db")
COLLECTION_NAME = "pdfs"

modelo = ChatOllama(model="gemma4:26b", reasoning=True)
#modelo = ChatOllama(model="gemma4:e2b", reasoning=True)

#Mantener hasta implementar en versiones futuras sqlite 
thread_history = {}

PROMPT_SIST = """
    Eres un asistente inteligente que puede:
    1. Buscar información en la base de datos vectorial (RAG) usando la herramienta informacion_rag
    2. Generar documentos Word o PDF usando las herramientas del MCP document-generator
    3. Generar audio a partir de texto usando la herramienta generar_audio
    
    Cuando el usuario pida generar un documento basado en información:
    - Primero usa informacion_rag para buscar la información relevante
    - Luego usa las herramientas de generación de documentos (gerar_documento_word o gerar_documento_pdf)
    - Asegúrate de pasar la información encontrada como contenido del documento
    
    Cuando el usuario pida generar audio:
    - Usa generar_audio para convertir texto a audio
    - Puedes usar información obtenida de informacion_rag como contenido para el audio
    - Proporciona un nombre descriptivo para el archivo de audio
    
    IMPORTANTE - Para generar documentos:
    - SIEMPRE proporciona un nombre de archivo válido en el parámetro 'nome_arquivo'
    - Usa nombres descriptivos sin espacios ni caracteres especiales (ej: "resumen_contenido.pdf", "examen_tema.pdf")
    - Para resúmenes usa: "resumen_[tema].pdf"
    - Para exámenes usa: "examen_[tema].pdf"
    - Para respuestas usa: "respuestas_[tema].pdf"
    - No digas donde esta almacenado y que puede descargarlo en esta url.
    
    IMPORTANTE - Para generar audio:
    - Usa nombres descriptivos para los archivos (ej: "resumen_audio.wav", "explicacion_tema.wav")
    - El audio se guardará automáticamente en el directorio backend/generated_documents
    
    IMPORTANTE - Cuando el usuario menciona archivos específicos (ej: "resumen de documento.pdf"):
    - Debes usar el parámetro 'sources' en informacion_rag para filtrar por esos archivos
    - Pasa sources como una lista con los nombres exactos de los archivos mencionados
    - Ejemplo: informacion_rag(query="resumen", sources=["documento.pdf", "otro.pdf"])
    
    No inventes información que no esté en la base de datos vectorial.
    Devuelve todas las respuestas en español.
    """


def crear_embeddings():
    embeddings = OllamaEmbeddings(
        model="mxbai-embed-large",
        base_url="http://localhost:11434",
    )
    return embeddings


def crear_retriever(vectorstore: Chroma):
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs={"k": 4}
    )
    return retriever


@tool
def informacion_rag(query: str, sources: list = None):
    """
    Función que devuelve información almacenada en el RAG.
    Úsala cuando necesites buscar información específica en los documentos indexados.
    
    Args:
        query: La consulta de búsqueda sobre la información que necesitas encontrar
        sources: Lista opcional de nombres de archivos/fuentes para filtrar la búsqueda.
                Si se proporciona, solo buscará en documentos de esas fuentes.
    
    Returns:
        Lista de documentos relevantes con su contenido y metadatos
    """

    print(f"[RAG DEBUG] '{query}'")

    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=crear_embeddings(),
    )

    #Buscamos top 10
    search_kwargs = {"k": 10}  
    
    retriever = vectorstore.as_retriever(
        search_type="similarity",
        search_kwargs=search_kwargs
    )
    resultado = retriever.invoke(query)
    print(f"[RAG DEBUG] Documentos encontrados: {len(resultado)}")


    # Si se especifican fuentes, filtrar manualmente los resultados
    if sources:
        resultado_filtrado = []
        for doc in resultado:
            doc_source = doc.metadata.get("source", "")
            # Verificar si el source contiene alguno de los nombres de archivo buscados
            for source_pattern in sources:
                if source_pattern in doc_source:
                    resultado_filtrado.append(doc)
                    break
        resultado = resultado_filtrado[:4] 
        print(f"[RAG DEBUG] Documentos después de filtrar por sources: {len(resultado)}")
    else:
        resultado = resultado[:4]
    
    return resultado


@tool
def generar_audio(texto: str, nombre_archivo: str = None, voice_id: str = "BCPuhhETu0nx5trUsFCB"):
    """
    Genera audio a partir de texto usando ElevenLabs API.
    
    Args:
        texto: El texto que se desea convertir a audio
        nombre_archivo: Nombre del archivo de audio a generar (opcional, se genera automáticamente si no se proporciona)
        voice_id: ID de voz de ElevenLabs (default: "rachel")
    
    Returns:
        str: Mensaje de confirmación con la ruta del archivo de audio generado
    """
    try:
        import os
        from dotenv import load_dotenv
        from elevenlabs import ElevenLabs
        from datetime import datetime
        import uuid
        
        # Cargar variables de entorno
        load_dotenv()
        api_key = os.getenv("ELEVEN_API")
        
        if not api_key:
            return "❌ Error: No se encontró ELEVEN_API en el archivo .env"
        
        # Validar que el texto no esté vacío
        if not texto or not texto.strip():
            return "Error: El texto no puede estar vacío"
        
        # Limitar el texto para ElevenLabs (permite más caracteres)
        texto_limitado = texto.strip()[:5000]
        print(texto_limitado)

        
        # Crear cliente de ElevenLabs
        client = ElevenLabs(api_key=api_key)
        
        # Generar audio
        response_generator = client.text_to_speech.convert(
            text=texto_limitado,
            voice_id=voice_id,
            output_format="mp3_44100_128"
        )
        
        # Concatenar todos los chunks del generador
        audio_data = b""
        for chunk in response_generator:
            audio_data += chunk
        
        print(f"Tamaño total del audio: {len(audio_data)} bytes")
        
        # Crear directorio de salida si no existe (backend/generated_documents)
        output_dir = os.path.join(os.path.dirname(__file__), "..", "..", "backend", "generated_documents")
        os.makedirs(output_dir, exist_ok=True)
        
        # Guardar el archivo de audio
        output_path = os.path.join(output_dir, nombre_archivo)
        
        # Escribir el archivo de audio
        with open(output_path, "wb") as f:
            f.write(audio_data)
        
        return f"✅ Audio generado exitosamente con ElevenLabs: {nombre_archivo}\n📁 Guardado en: backend/generated_documents/{nombre_archivo}\n🎤 Voz utilizada: {voice_id}"
        
    except Exception as e:
        print(f"ERROR ELEVENLABS: {str(e)}")
        print(f"TEXTO PROCESADO: {texto_limitado[:100]}...")
        return f"❌ Error al generar audio con ElevenLabs: {str(e)}"


async def process_message_with_agent(prompt: str, use_mcp: bool = False, thread_id: str = None):
    """
    Procesa un mensaje usando el agente RAG.
    Esta función puede ser llamada desde CLI o desde la API.

    Args:
        prompt: El mensaje del usuario
        use_mcp: Si True, incluye herramientas MCP de document-generator
        thread_id: ID del hilo de conversación para persistencia del historial

    Returns:
        Tupla (response, reasoning) con la respuesta y el razonamiento
    """
    try:
        if use_mcp:
            # Conectar al MCP de document-generator
            client = MultiServerMCPClient({
                "document-generator": {
                    "transport": "stdio",
                    "command": "npx",
                    "args": ["--yes", "--cache", "/tmp/.npx-cache", "document-generator-mcp@latest"]
                }
            })

            # Obtener herramientas del MCP
            mcp_tools = await client.get_tools()
            todas_herramientas = [informacion_rag, generar_audio] + mcp_tools
        else:
            todas_herramientas = [informacion_rag, generar_audio]

        # Crear agente
        agente = create_agent(
            model=modelo,
            tools=todas_herramientas,
            system_prompt=PROMPT_SIST
        )

        reasoning_content = ""
        final_response = ""

        # Obtener o crear historial de mensajes para el thread_id
        if thread_id:
            if thread_id not in thread_history:
                thread_history[thread_id] = []
            messages = thread_history[thread_id]
        else:
            messages = []

        messages.append(HumanMessage(prompt))

        async for paso in agente.astream({
            "messages": messages
        }, stream_mode="values"):
            ultimo_mensaje = paso["messages"][-1]
            if hasattr(ultimo_mensaje, "content"):
                final_response = ultimo_mensaje.content

        # Agregar la respuesta del asistente al historial
        if thread_id:
            messages.append(AIMessage(final_response))
            print(final_response)
            thread_history[thread_id] = messages

        return final_response

    except Exception as e:
        print(f"Error: {e}")

async def main():
    print("ToolChain RAG Agent - Modo Interactivo")
    print("   - Escribe 'end' para salir\n")
    
    while (prompt := input("> ")) != "end":
        response, reasoning = await process_message_with_agent(prompt, use_mcp=True)
        
        if reasoning:
            print("\n=== PENSANDO ===")
            print(reasoning)
        
        print("\n=== MENSAJE ===")
        print(response)


if __name__ == "__main__":
    asyncio.run(main())
