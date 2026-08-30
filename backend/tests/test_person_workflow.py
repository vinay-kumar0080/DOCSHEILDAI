import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_person_name_screening_workflow_and_same_name_handling():
    # 1. TEST PERSON 1: John Doe (Airlines)
    resp1 = client.post("/api/v1/screenings", json={
        "domain": "airline",
        "document_type": "passport",
        "person_name": "John Doe",
        "travel_reference": { "ticket_number": "016-2491029481", "pnr": "Y7X9PQ" }
    })
    assert resp1.status_code == 200
    sc1 = resp1.json()
    assert sc1["person_name"] == "John Doe"
    assert sc1["domain"] == "airline"
    id1 = sc1["id"]

    # 2. TEST PERSON 2: Jane Smith (Immigration)
    resp2 = client.post("/api/v1/screenings", json={
        "domain": "immigration",
        "document_type": "passport",
        "person_name": "Jane Smith"
    })
    assert resp2.status_code == 200
    sc2 = resp2.json()
    assert sc2["person_name"] == "Jane Smith"
    assert sc2["domain"] == "immigration"
    id2 = sc2["id"]
    assert id1 != id2

    # Verify Jane's detail record has her name and no cross contamination
    detail2 = client.get(f"/api/v1/screenings/{id2}")
    assert detail2.status_code == 200
    assert detail2.json()["person_name"] == "Jane Smith"

    # 3. TEST PERSON 3: John Doe (Same name, new session allowed)
    resp3 = client.post("/api/v1/screenings", json={
        "domain": "airport_security",
        "document_type": "passport",
        "person_name": "John Doe"
    })
    assert resp3.status_code == 200
    sc3 = resp3.json()
    assert sc3["person_name"] == "John Doe"
    id3 = sc3["id"]
    # Verify separate UUID generated
    assert id3 != id1
    assert id3 != id2

    # 4. Search screenings by person name
    search_resp = client.get("/api/v1/screenings?search=John")
    assert search_resp.status_code == 200
    results = search_resp.json()
    assert len(results) >= 2
    for r in results:
        assert "John" in r["person_name"]

def test_notifications_and_settings():
    # 1. Test notifications listing and unread count
    notif_resp = client.get("/api/v1/notifications")
    assert notif_resp.status_code == 200

    unread_resp = client.get("/api/v1/notifications/unread-count")
    assert unread_resp.status_code == 200
    assert "unread_count" in unread_resp.json()

    # 2. Test settings get and patch
    settings_resp = client.get("/api/v1/settings")
    assert settings_resp.status_code == 200

    patch_resp = client.patch("/api/v1/settings", json={
        "preferences": {
            "retention_hours": 48,
            "language": "en"
        }
    })
    assert patch_resp.status_code == 200
    assert patch_resp.json()["preferences"]["retention_hours"] == 48
