from app.seed import SPOTS


def test_health(client):
    assert client.get("/api/health").json() == {"status": "ok"}


def test_list_spots(client):
    spots = client.get("/api/spots").json()
    assert len(spots) == len(SPOTS)
    siurana = next(s for s in spots if s["slug"] == "siurana")
    assert siurana["route_count"] == 3
    assert -90 <= siurana["latitude"] <= 90


def test_spot_detail_lists_routes(client):
    spot_id = client.get("/api/spots").json()[0]["id"]
    spot = client.get(f"/api/spots/{spot_id}").json()
    assert spot["routes"]
    assert all(r["hold_count"] > 0 for r in spot["routes"])


def test_route_detail_has_ordered_holds(client):
    spot = client.get("/api/spots").json()[0]
    route_id = client.get(f"/api/spots/{spot['id']}").json()["routes"][0]["id"]
    route = client.get(f"/api/routes/{route_id}").json()
    sequences = [h["sequence"] for h in route["holds"]]
    assert sequences == sorted(sequences)
    assert route["spot"]["id"] == spot["id"]
    half_width = route["wall_width_m"] / 2
    for hold in route["holds"]:
        assert -half_width <= hold["x"] <= half_width
        assert 0 <= hold["y"] <= route["length_m"]
    assert any(h["is_crux"] for h in route["holds"])
    assert route["beta_notes"]


def test_missing_resources_return_404(client):
    assert client.get("/api/spots/9999").status_code == 404
    assert client.get("/api/routes/9999").status_code == 404


def test_add_beta_note(client):
    route = client.get("/api/routes/1").json()
    hold_id = route["holds"][3]["id"]
    res = client.post("/api/routes/1/beta", json={"author": "tester", "body": "Heel hook!", "hold_id": hold_id})
    assert res.status_code == 201
    assert res.json()["hold_id"] == hold_id
    notes = client.get("/api/routes/1").json()["beta_notes"]
    assert notes[0]["body"] == "Heel hook!"


def test_beta_note_validation(client):
    assert client.post("/api/routes/1/beta", json={"author": "", "body": "x"}).status_code == 422
    other = client.get("/api/routes/2").json()["holds"][0]["id"]
    assert client.post("/api/routes/1/beta", json={"author": "a", "body": "b", "hold_id": other}).status_code == 422
