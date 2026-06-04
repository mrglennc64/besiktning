from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_overlatelse_schema_served():
    r = client.get("/schemas/overlatelse")
    assert r.status_code == 200
    assert r.json()["$id"] == "https://besiktning.app/schemas/overlatelse.json"


def test_create_overlatelse_protokoll():
    r = client.post("/protokoll", json={"template": "overlatelse"})
    assert r.status_code == 201
    assert r.json()["template"] == "overlatelse"
