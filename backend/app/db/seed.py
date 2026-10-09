"""Sample data: real climbing areas with procedurally generated hold maps.

Spot coordinates are real. Route lines and their hold layouts are generated
deterministically from a seed so the 3D viewer has something to show; they are
illustrative and must not be used as real beta.
"""

import random

from sqlmodel import Session, select

from app.models import BetaNote, Hold, HoldKind, HoldUsage, Route, RouteStyle, Spot

from .seed_data import (
    AUTHORS,
    CRUX_BETA,
    CRUX_NOTES,
    EASY_HAND_KINDS,
    FOOT_NOTES,
    HAND_BETA,
    HAND_NOTES,
    HARD_HAND_KINDS,
    ROUTE_NOTES,
    SIZE_RANGE_CM,
    SPOTS,
    RouteSeed,
)


def wall_width(route: RouteSeed) -> float:
    return 4.0 if route.style == RouteStyle.boulder else 6.0


def _pull_direction(kind: HoldKind, rng: random.Random) -> float:
    if kind == HoldKind.undercling:
        return 180 + rng.uniform(-20, 20)
    if kind == HoldKind.sidepull:
        return rng.choice([-90, 90]) + rng.uniform(-15, 15)
    return rng.uniform(-30, 30)


def _hand_kind(difficulty: float, rng: random.Random) -> HoldKind:
    pool = HARD_HAND_KINDS if rng.random() < difficulty else EASY_HAND_KINDS
    return rng.choice(pool)


def _size(kind: HoldKind, difficulty: float, rng: random.Random) -> float:
    low, high = SIZE_RANGE_CM[kind]
    # Harder routes skew towards the small end of each range.
    t = rng.random() * (1 - 0.6 * difficulty)
    return round(low + (high - low) * t, 1)


def generate_holds(route: RouteSeed, seed: int) -> list[Hold]:
    """Lay out a plausible line of hand and foot holds up the wall."""
    rng = random.Random(seed)
    half_width = wall_width(route) / 2 - 0.4
    top = route.length_m - 0.3
    step = (0.45 if route.style == RouteStyle.boulder else 0.6) + 0.35 * route.difficulty
    crux_start = top * rng.uniform(0.55, 0.75)
    crux_end = crux_start + max(1.0, top * 0.1)

    holds: list[Hold] = []
    seq = 0

    def add(**kwargs) -> Hold:
        nonlocal seq
        seq += 1
        hold = Hold(sequence=seq, **kwargs)
        holds.append(hold)
        return hold

    # Start: two feet, then two matched-ish hands.
    for side in (-1, 1):
        add(x=round(side * 0.35, 2), y=0.35, kind=HoldKind.foothold, usage=HoldUsage.foot,
            size_cm=_size(HoldKind.foothold, route.difficulty, rng), pull_direction_deg=0)
    for side in (-1, 1):
        kind = _hand_kind(route.difficulty * 0.6, rng)
        add(x=round(side * 0.3, 2), y=1.5, kind=kind, usage=HoldUsage.hand,
            size_cm=_size(kind, route.difficulty, rng),
            pull_direction_deg=round(_pull_direction(kind, rng), 1),
            note="Start: both hands here." if side == 1 else None)

    x = 0.0
    y = 1.5
    side = 1
    while y + step * 0.5 < top:
        y = min(top, y + step * rng.uniform(0.75, 1.25))
        x = max(-half_width, min(half_width, x + rng.uniform(-0.6, 0.6)))
        hand_x = max(-half_width, min(half_width, x + side * rng.uniform(0.15, 0.4)))
        in_crux = crux_start <= y <= crux_end

        foot_kind = HoldKind.foothold if rng.random() < 0.75 else HoldKind.edge
        add(x=round(hand_x - side * rng.uniform(0.1, 0.5), 2),
            y=round(max(0.2, y - rng.uniform(1.0, 1.4)), 2),
            kind=foot_kind, usage=HoldUsage.foot,
            size_cm=_size(foot_kind, route.difficulty, rng), pull_direction_deg=0,
            note=rng.choice(FOOT_NOTES) if rng.random() < 0.08 else None)

        kind = _hand_kind(min(1.0, route.difficulty + (0.3 if in_crux else 0)), rng)
        size = _size(kind, route.difficulty, rng)
        if in_crux:
            size = round(max(SIZE_RANGE_CM[kind][0], size * 0.7), 1)
            note = rng.choice(CRUX_NOTES) if rng.random() < 0.6 else None
        else:
            note = rng.choice(HAND_NOTES) if rng.random() < 0.18 else None
        add(x=round(hand_x, 2), y=round(y, 2), kind=kind,
            usage=HoldUsage.both if kind == HoldKind.jug and rng.random() < 0.3 else HoldUsage.hand,
            size_cm=size, pull_direction_deg=round(_pull_direction(kind, rng), 1),
            is_crux=in_crux, note=note)
        side = -side

    finish = "Top out: mantle and walk off." if route.style == RouteStyle.boulder else "Finish jug. Clip the chains."
    add(x=round(x, 2), y=round(top, 2), kind=HoldKind.jug, usage=HoldUsage.hand,
        size_cm=_size(HoldKind.jug, 0, rng), pull_direction_deg=0, note=finish)
    return holds


def generate_beta_notes(route: Route, rng: random.Random) -> list[BetaNote]:
    notes = [BetaNote(author=rng.choice(AUTHORS), body=rng.choice(ROUTE_NOTES))]
    holds = sorted(route.holds, key=lambda h: h.sequence)
    crux = [h for h in holds if h.is_crux and h.usage != HoldUsage.foot]
    if crux:
        notes.append(BetaNote(author=rng.choice(AUTHORS), hold_id=crux[0].id, body=rng.choice(CRUX_BETA)))
    hands = [h for h in holds[4:-1] if h.usage != HoldUsage.foot and not h.is_crux]
    if hands:
        notes.append(BetaNote(author=rng.choice(AUTHORS), hold_id=rng.choice(hands).id, body=rng.choice(HAND_BETA)))
    return notes


def seed_database(session: Session) -> bool:
    """Populate an empty database. Returns True if data was inserted."""
    if session.exec(select(Spot)).first() is not None:
        return False

    surface_seed = 1000
    for spot_data in SPOTS:
        spot = Spot(**{k: v for k, v in spot_data.items() if k != "routes"})
        session.add(spot)
        for route_seed in spot_data["routes"]:
            surface_seed += 7
            route = Route(
                spot=spot,
                name=route_seed.name,
                grade=route_seed.grade,
                style=route_seed.style,
                length_m=route_seed.length_m,
                wall_angle_deg=route_seed.wall_angle_deg,
                wall_width_m=wall_width(route_seed),
                surface_seed=surface_seed,
                first_ascent=route_seed.first_ascent,
                description=route_seed.description,
            )
            route.holds = generate_holds(route_seed, surface_seed)
            session.add(route)
    session.commit()

    # Beta notes reference hold ids, so they are added once holds are persisted.
    rng = random.Random(42)
    for route in session.exec(select(Route)).all():
        for note in generate_beta_notes(route, rng):
            note.route_id = route.id
            session.add(note)
    session.commit()
    return True


def reset_and_seed() -> None:
    """Drop every table, recreate the schema and load the sample data."""
    from sqlmodel import SQLModel

    from .session import engine

    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_database(session)


if __name__ == "__main__":
    reset_and_seed()
    print("Database reset and seeded.")
