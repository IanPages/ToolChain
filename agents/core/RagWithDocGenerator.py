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

#modelo = ChatOllama(model="gemma4:26b", reasoning=True)
modelo = ChatOllama(model="gemma4:e2b", reasoning=True)

######

#SQLITESAVER PARA EL CHECKPOINTER

#######
thread_history = {}

PROMPT_SIST = """
    Eres un asistente inteligente que puede:
    1. Buscar información en la base de datos vectorial (RAG) usando la herramienta informacion_rag
    2. Generar documentos Word o PDF usando las herramientas del MCP document-generator
    
    Cuando el usuario pida generar un documento basado en información:
    - Primero usa informacion_rag para buscar la información relevante
    - Luego usa las herramientas de generación de documentos (gerar_documento_word o gerar_documento_pdf)
    - Asegúrate de pasar la información encontrada como contenido del documento
    
    IMPORTANTE - Cuando el usuario mencione archivos específicos (ej: "resumen de documento.pdf"):
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
            todas_herramientas = [informacion_rag] + mcp_tools
        else:
            todas_herramientas = [informacion_rag]

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
