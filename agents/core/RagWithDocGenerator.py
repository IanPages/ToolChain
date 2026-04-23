import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain.agents import create_agent
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_core.messages import HumanMessage
from langchain.tools import tool
from langchain_text_splitters import RecursiveCharacterTextSplitter


CHROMA_DIR = "../../database/chroma_db"
COLLECTION_NAME = "pdfs"

modelo = ChatOllama(model="gemma4:26b", reasoning=True)

PROMPT_SIST = """
    Eres un asistente inteligente que puede:
    1. Buscar información en la base de datos vectorial (RAG) usando la herramienta informacion_rag
    2. Generar documentos Word o PDF usando las herramientas del MCP document-generator
    
    Cuando el usuario pida generar un documento basado en información:
    - Primero usa informacion_rag para buscar la información relevante
    - Luego usa las herramientas de generación de documentos (gerar_documento_word o gerar_documento_pdf)
    - Asegúrate de pasar la información encontrada como contenido del documento
    
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
def informacion_rag(query: str):
    """
    Función que devuelve información almacenada en el RAG.
    Úsala cuando necesites buscar información específica en los documentos indexados.
    
    Args:
        query: La consulta de búsqueda sobre la información que necesitas encontrar
    
    Returns:
        Lista de documentos relevantes con su contenido y metadatos
    """
    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=crear_embeddings(),
    )
    retriever = crear_retriever(vectorstore)
    resultado = retriever.invoke(query)
    
    # Mostrar información de debug
    resultado2 = vectorstore.similarity_search_with_score(query, k=4)
    for indice, documento in enumerate(resultado2):
        print(f"📄 Documento {indice}: {documento[0].metadata.get('source', 'unknown')} (score: {documento[1]:.4f})")
    
    return resultado


async def main():
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
    
    print("🔧 Herramientas MCP cargadas:")
    for tool in mcp_tools:
        print(f"   - {tool.name}")
    
    # Combinar herramientas RAG + MCP
    todas_herramientas = [informacion_rag] + mcp_tools
    
    # Crear agente con todas las herramientas
    agente = create_agent(
        model=modelo,
        tools=todas_herramientas,
        system_prompt=PROMPT_SIST
    )
    
    print("\nEscribe lo que necesites")
    print("   - 'Escribe \"end\" para salir'\n")
    
    while (prompt := input("> ")) != "end":
        async for paso in agente.astream({
            "messages": [
                HumanMessage(prompt)
            ]
        }, stream_mode="values"):
            ultimo_mensaje = paso["messages"][-1]
            
            hayRazonamiento = ""
            if hasattr(ultimo_mensaje, "additional_kwargs"):
                hayRazonamiento = ultimo_mensaje.additional_kwargs.get("reasoning_content", "")
            
            if hayRazonamiento:
                print("\n=== 🧠 PENSANDO ===")
                print(hayRazonamiento)
            
            print("\n=== 💬 MENSAJE ===")
            ultimo_mensaje.pretty_print()


if __name__ == "__main__":
    asyncio.run(main())
