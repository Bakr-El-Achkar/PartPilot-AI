from app.main import app


def test_ai_mechanic_routes_are_registered():
    schema = app.openapi()

    paths = set(
        schema.get(
            "paths",
            {}
        ).keys()
    )

    assert (
        "/api/ai-mechanic/sessions"
        in paths
    )

    assert (
        "/api/ai-mechanic/sessions/{session_id}"
        in paths
    )

    assert (
        "/api/ai-mechanic/sessions/{session_id}/messages"
        in paths
    )