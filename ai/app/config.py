import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # FastAPI Configurations
    APP_NAME: str = "L0 Chatbot AI Service"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000
    
    # Ollama AI Core configurations
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_CHAT_MODEL: str = os.getenv("OLLAMA_CHAT_MODEL", "llama3.2")
    OLLAMA_EMBED_MODEL: str = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")
    
    # RAG Vector DB Configs
    FAISS_INDEX_DIR: str = os.getenv("FAISS_INDEX_DIR", "data/faiss_index")
    VECTOR_DIMENSION: int = 768  # nomic-embed-text generates 768-dim vectors
    
    # Database sync configs
    SQLITE_DB_PATH: str = os.getenv("SQLITE_DB_PATH", "../chatbot.sqlite")
    
    # Shared JWT Secret key for microservice authentication
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super_secret_jwt_key_12345!")

    
    class Config:
        env_file = ".env"

settings = Settings()
