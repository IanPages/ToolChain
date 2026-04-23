import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from  langchain_classic.retrievers import ParentDocumentRetriever
from langchain_classic.storage import LocalFileStore
from langchain_classic.storage._lc_store import create_kv_docstore



CHROMA_DIR = "../../database/chroma_db"
COLLECTION_NAME = "pdfs"



"""
Con esta función cargamos los documentos, pasamos de fichero a Documents
"""
def cargar_documentos(fichero: str):
    loader = PyPDFLoader(fichero)
    documentos = loader.load() 
    return documentos

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
    ls = LocalFileStore("../../database/padres_store")

    parent_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )

    child_splitter = RecursiveCharacterTextSplitter(
        chunk_size=400,
        chunk_overlap=50
    )

    # Podéis usar este nétodo también, pero con menos control.
    # Si ya existe la colección la va a duplicar, así que
    vectorstore = Chroma(
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
        collection_name=COLLECTION_NAME
    )

    retriever = ParentDocumentRetriever(
        vectorstore=vectorstore,
        docstore=create_kv_docstore(ls),
        child_splitter=child_splitter,
        parent_splitter=parent_splitter

    )
    
    retriever.add_documents(documentos)


    return retriever

RUTA_DATOS = "../ficheros/"

def main():

    for fichero in os.listdir(RUTA_DATOS):
            rutilla = os.path.join(RUTA_DATOS, fichero)
            print(f"Procesando: {fichero}")

            documentos = cargar_documentos(rutilla)
            
    embeddings = crear_embeddings()

    print("...LLM para embeddings listo...")

    crear_vectorstore(embeddings,documentos)

    print("Ya tenemos chromadb creado!!")

if __name__ == "__main__":
    main()