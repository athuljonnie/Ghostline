"""
Large Language Model Service
"""
from typing import List, Dict
from langchain_groq import ChatGroq

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class LLMService:
    """LLM service using Groq"""
    
    def __init__(self, temperature: float = None, max_tokens: int = None):
        """
        Initialize LLM service
        
        Args:
            temperature: Model temperature (overrides settings)
            max_tokens: Max tokens (overrides settings)
        """
        self.temperature = temperature or settings.LLM_TEMPERATURE
        self.max_tokens = max_tokens or settings.LLM_MAX_TOKENS
        
        self.llm = ChatGroq(
            groq_api_key=settings.GROQ_API_KEY,
            model_name=settings.LLM_MODEL,
            temperature=self.temperature,
            max_tokens=self.max_tokens
        )
        logger.info(f"✅ LLM initialized: {settings.LLM_MODEL}")
    
    async def generate_response(
        self, 
        messages: List[Dict[str, str]], 
        system_prompt: str = None
    ) -> str:
        """
        Generate AI response
        
        Args:
            messages: Conversation history
            system_prompt: Optional system prompt override
            
        Returns:
            AI response text
        """
        try:
            # Build message context
            context = []
            
            if system_prompt:
                context.append({"role": "system", "content": system_prompt})
            
            context.extend(messages)
            
            logger.info(f"Generating response for {len(messages)} messages")
            
            # Call LLM
            response = self.llm.invoke(context)
            ai_text = response.content
            
            logger.info(f"✅ Generated response: '{ai_text[:50]}...'")
            return ai_text
            
        except Exception as e:
            logger.error(f"❌ LLM generation failed: {e}")
            raise
