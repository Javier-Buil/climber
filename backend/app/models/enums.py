from enum import Enum


class RouteStyle(str, Enum):
    sport = "sport"
    trad = "trad"
    boulder = "boulder"


class HoldKind(str, Enum):
    jug = "jug"
    crimp = "crimp"
    sloper = "sloper"
    pinch = "pinch"
    pocket = "pocket"
    edge = "edge"
    undercling = "undercling"
    sidepull = "sidepull"
    foothold = "foothold"


class HoldUsage(str, Enum):
    hand = "hand"
    foot = "foot"
    both = "both"
