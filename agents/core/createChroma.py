import os
import tempfile
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
import ocrmypdf



# Usar rutas absolutas para consistencia
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CHROMA_DIR = os.path.join(BASE_DIR,"..", "database", "chroma_db")
COLLECTION_NAME = "pdfs"



"""
Con esta función cargamos los documentos, pasamos de fichero a Documents
"""
def cargar_documentos(fichero: str):
    loader = PyPDFLoader(fichero)
    documentos = loader.load()
    return documentos


def cargar_documentos_desde_bytes(archivo_bytes: bytes, nombre_archivo: str):
    """
    Carga documentos desde bytes (para archivos subidos desde la API).
    Si el PDF no tiene texto extraíble (escaneado), aplica OCR automáticamente.

    Args:
        archivo_bytes: Contenido del archivo en bytes
        nombre_archivo: Nombre del archivo para metadata

    Returns:
        Lista de documentos LangChain
    """
    extension = os.path.splitext(nombre_archivo)[1] or '.pdf'
    tmp_paths = []

    try:
        # Guardar PDF original temporalmente
        with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
            tmp.write(archivo_bytes)
            tmp_path = tmp.name
            tmp_paths.append(tmp_path)

        loader = PyPDFLoader(tmp_path)
        documentos = loader.load()

        # Verificar si tiene texto extraíble (si está vacío, es un escaneo)
        texto_total = "".join([doc.page_content for doc in documentos]).strip()
        if not texto_total:
            # Aplicar OCR al PDF escaneado
            with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_ocr:
                tmp_ocr_path = tmp_ocr.name
                tmp_paths.append(tmp_ocr_path)

            ocrmypdf.ocr(tmp_path, tmp_ocr_path, force_ocr=True, progress_bar=False)

            # Recargar con el PDF que ahora tiene texto
            loader = PyPDFLoader(tmp_ocr_path)
            documentos = loader.load()

        return documentos
    finally:
        # Limpiar archivos temporales
        for path in tmp_paths:
            try:
                os.unlink(path)
            except OSError:
                pass

"""
Creamos los embeddings
"""
def crear_embeddings():

    embeddings = OllamaEmbeddings(
        model="mxbai-embed-large", # El modelo LLM a usar
        base_url="http://localhost:11434", # Esta es la URL de Ollama (local)
    )
    return embeddings


"""
Añadimos los embeddings a Chroma

"""
def crear_vectorstore(embeddings, documentos):
    """
    Si la colección ya existe en disco, la reutiliza.
    Si no existe, indexa los documentos.
    """
    # Text splitter para dividir documentos en chunks
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=300
    )

    # Dividir documentos en chunks
    chunks = text_splitter.split_documents(documentos)

    # Crear o cargar vectorstore
    vectorstore = Chroma(
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME
    )

    # Agregar chunks al vectorstore
    vectorstore.add_documents(chunks)

    return vectorstore


def subir_ficheros(documentos):
    """
    Procesa documentos ya cargados, crea embeddings y los almacena en ChromaDB.
    Función para usar desde la API con archivos subidos desde el frontend.

    Args:
        documentos: Lista de documentos LangChain ya procesados

    Returns:
        vectorstore: El vectorstore con los documentos indexados
    """
    embeddings = crear_embeddings()
    print("...Embeddings creados...")

    vectorstore = crear_vectorstore(embeddings, documentos)
    print(f" Indexados {len(documentos)} documentos en ChromaDB")

    return vectorstore


def eliminar_documento_por_nombre(nombre_archivo: str):
    """
    Elimina todos los documentos y sus vectorizaciones de ChromaDB 
    que correspondan a un nombre de archivo específico.

    Args:
        nombre_archivo: Nombre del archivo a eliminar (solo nombre, sin ruta)

    Returns:
        int: Número de documentos eliminados
    """
    embeddings = crear_embeddings()
    vectorstore = Chroma(
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
    )
    
    # Obtener la colección para buscar documentos por metadata
    collection = vectorstore._collection
    
    # Buscar documentos que tengan el nombre de archivo en su metadata
    # Primero obtenemos solo los IDs para poder eliminar
    results_ids = collection.get(
        where={"source": nombre_archivo}
    )
    
    documentos_eliminados = 0
    if results_ids["ids"]:
        # Eliminar los documentos por sus IDs
        collection.delete(ids=results_ids["ids"])
        documentos_eliminados = len(results_ids["ids"])
        print(f"Eliminados {documentos_eliminados} documentos del archivo '{nombre_archivo}'")
    else:
        print(f"No se encontraron documentos para el archivo '{nombre_archivo}'")
    
    return documentos_eliminados


RUTA_DATOS = "../ficheros/"

def main():
    todos_documentos = []

    for fichero in os.listdir(RUTA_DATOS):
            rutilla = os.path.join(RUTA_DATOS, fichero)
            print(f"Procesando: {fichero}")

            documentos = cargar_documentos(rutilla)
            todos_documentos.extend(documentos)

    embeddings = crear_embeddings()
    print("...LLM para embeddings listo...")

    crear_vectorstore(embeddings, todos_documentos)

    print("Ya tenemos chromadb creado!!")

if __name__ == "__main__":
    main()