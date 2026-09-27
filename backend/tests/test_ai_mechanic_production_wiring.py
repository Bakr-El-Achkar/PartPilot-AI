from app.services.ai_mechanic_service import (
    ai_mechanic_service,
)
from app.services.ollama_ai_mechanic_engine import (
    OllamaAIMechanicEngine,
)


def test_production_service_uses_ollama_engine():
    assert isinstance(
        ai_mechanic_service.ai_engine,
        OllamaAIMechanicEngine,
    )


def test_production_ollama_engine_has_configuration():
    engine = ai_mechanic_service.ai_engine

    assert engine.host
    assert engine.model