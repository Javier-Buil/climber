from tests.conftest import API


def test_route_detail_has_ordered_holds(client):
    spot = client.get(f"{API}/spots").json()[0]
    route_id = client.get(f"{API}/spots/{spot['id']}").json()["routes"][0]["id"]
    route = client.get(f"{API}/routes/{route_id}").json()
    sequences = [h["sequence"] for h in route["holds"]]
    assert sequences == sorted(sequences)
    assert route["spot"]["id"] == spot["id"]
    half_width = route["wall_width_m"] / 2
    for hold in route["holds"]:
        assert -half_width <= hold["x"] <= half_width
        assert 0 <= hold["y"] <= route["length_m"]
    assert any(h["is_crux"] for h in route["holds"])
    assert route["beta_notes"]


def test_missing_route_returns_404(client):
    assert client.get(f"{API}/routes/9999").status_code == 404
    assert client.post(f"{API}/routes/9999/beta", json={"author": "a", "body": "b"}).status_code == 404


def test_add_beta_note(client):
    route = client.get(f"{API}/routes/1").json()
    hold_id = route["holds"][3]["id"]
    res = client.post(f"{API}/routes/1/beta", json={"author": "tester", "body": "Heel hook!", "hold_id": hold_id})
    assert res.status_code == 201
    assert res.json()["hold_id"] == hold_id
    notes = client.get(f"{API}/routes/1").json()["beta_notes"]
    assert notes[0]["body"] == "Heel hook!"


def test_beta_note_validation(client):
    assert client.post(f"{API}/routes/1/beta", json={"author": "", "body": "x"}).status_code == 422
    other = client.get(f"{API}/routes/2").json()["holds"][0]["id"]
    res = client.post(f"{API}/routes/1/beta", json={"author": "a", "body": "b", "hold_id": other})
    assert res.status_code == 422
