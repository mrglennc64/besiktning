from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_healthz():
    r = client.get("/healthz")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_apartment_schema_loads():
    r = client.get("/schemas/apartment")
    assert r.status_code == 200
    body = r.json()
    assert body["$id"] == "https://besiktning.app/schemas/apartment.json"
    # the apartment template includes a "rooms" section with at least Hall
    assert "rooms" in body["properties"]
    assert "hall" in body["properties"]["rooms"]["properties"]


def test_create_patch_get_protokoll():
    # create
    r = client.post("/protokoll", json={"template": "apartment"})
    assert r.status_code == 201
    pid = r.json()["id"]
    assert r.json()["number"].startswith("GC-")
    assert r.json()["status"] == "draft"

    # autosave a small chunk
    r = client.patch(
        f"/protokoll/{pid}",
        json={"data": {"header": {"lagenhetsadress": "Storgatan 1"}}},
    )
    assert r.status_code == 200
    assert r.json()["data"]["header"]["lagenhetsadress"] == "Storgatan 1"

    # round-trip
    r = client.get(f"/protokoll/{pid}")
    assert r.status_code == 200
    assert r.json()["data"]["header"]["lagenhetsadress"] == "Storgatan 1"


def test_get_missing_returns_404():
    r = client.get("/protokoll/00000000-0000-0000-0000-000000000000")
    assert r.status_code == 404
