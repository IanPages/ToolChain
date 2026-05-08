from fastapi import APIRouter, HTTPException
from typing import Dict
from datetime import datetime
import sys
import os

# Add agents directory to path to import functions
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'agents', 'core'))

from RagWithDocGenerator import process_message_with_agent
from classes.ChatModels import ChatMessage, ChatResponse

router = APIRouter(prefix="/chat", tags=["chat"])

# Session storage for chat history (in-memory, replace with Redis for production)
chat_sessions: Dict[str, list] = {}


@router.post("", response_model=ChatResponse)
async def chat(chat_message: ChatMessage):
    """
    Procesa un mensaje del usuario usando el agente RAG de RagWithDocGenerator
    """
    try:
        print(chat_message.session_id)
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
