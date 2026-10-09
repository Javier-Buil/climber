from app.db.seed_data import SPOTS
from tests.conftest import API


def test_list_spots(client):
    spots = client.get(f"{API}/spots").json()
    assert len(spots) == len(SPOTS)
    siurana = next(s for s in spots if s["slug"] == "siurana")
    assert siurana["route_count"] == 3
    assert -90 <= siurana["latitude"] <= 90


def test_spot_detail_lists_routes(client):
    spot_id = client.get(f"{API}/spots").json()[0]["id"]
    spot = client.get(f"{API}/spots/{spot_id}").json()
    assert spot["routes"]
    assert all(r["hold_count"] > 0 for r in spot["routes"])


def test_missing_spot_returns_404(client):
    assert client.get(f"{API}/spots/9999").status_code == 404
