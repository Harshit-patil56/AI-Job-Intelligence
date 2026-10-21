"""Location normalization, alias resolution, and geographic tier classification.

Follows V1_SPECIFICATION and JOB_FILTERS_V1 rules:
- P1 Locations: Mumbai, Navi Mumbai, Thane, Pune
- P2 Locations: Bengaluru, Hyderabad
- Remote role detection
- Alias resolution (e.g. Bangalore -> Bengaluru, Bombay -> Mumbai)
"""

import re
from typing import NamedTuple
from app.models.schemas import LocationType


class LocationAnalysis(NamedTuple):
    raw_location: str
    normalized_location: str
    location_type: LocationType
    is_p1: bool
    is_p2: bool
    is_remote: bool
    matched_city: str | None


# Canonical city mapping dictionary
CITY_ALIASES: dict[str, list[str]] = {
    "Mumbai": [
        "mumbai",
        "bombay",
        "south mumbai",
        "andheri",
        "bkc",
        "bandra",
        "powai",
        "goregaon",
        "malad",
        "lower parel",
        "kurla",
        "dadar",
    ],
    "Navi Mumbai": [
        "navi mumbai",
        "new mumbai",
        "vashi",
        "airoli",
        "belapur",
        "ghansoli",
        "mahape",
    ],
    "Thane": [
        "thane",
        "thane west",
        "thane east",
        "ghodbunder",
    ],
    "Pune": [
        "pune",
        "poona",
        "hinjewadi",
        "hinjawadi",
        "magarpatta",
        "baner",
        "wakad",
        "kharadi",
        "viman nagar",
        "shivajinagar",
        "kothrud",
    ],
    "Bengaluru": [
        "bengaluru",
        "bangalore",
        "blr",
        "whitefield",
        "koramangala",
        "indiranagar",
        "electronic city",
        "bellandur",
        "marathahalli",
        "outer ring road",
        "orr",
        "hsr layout",
    ],
    "Hyderabad": [
        "hyderabad",
        "secunderabad",
        "hitec city",
        "gachibowli",
        "madhapur",
        "kondapur",
        "cyberabad",
    ],
}

P1_CITIES = {"Mumbai", "Navi Mumbai", "Thane", "Pune"}
P2_CITIES = {"Bengaluru", "Hyderabad"}

REMOTE_KEYWORDS = [
    "remote",
    "work from home",
    "wfh",
    "anywhere",
    "virtual",
    "telecommute",
    "distributed",
]

HYBRID_KEYWORDS = [
    "hybrid",
    "flexible",
]


def parse_location(raw_text: str | None) -> LocationAnalysis:
    """Normalize and classify location text into standard city hubs and remote types."""
    if not raw_text or not raw_text.strip():
        return LocationAnalysis(
            raw_location="",
            normalized_location="Unknown",
            location_type=LocationType.UNKNOWN,
            is_p1=False,
            is_p2=False,
            is_remote=False,
            matched_city=None,
        )

    text = raw_text.strip()
    lowered = text.lower()

    # 1. Detect Remote / Hybrid / On-site
    is_remote = any(re.search(rf"\b{re.escape(kw)}\b", lowered) for kw in REMOTE_KEYWORDS)
    is_hybrid = any(re.search(rf"\b{re.escape(kw)}\b", lowered) for kw in HYBRID_KEYWORDS)

    # 2. Match City Aliases: prioritize longer/more specific phrases first
    matched_city: str | None = None
    all_alias_pairs = []
    for canonical_city, aliases in CITY_ALIASES.items():
        for alias in aliases:
            all_alias_pairs.append((canonical_city, alias))

    # Sort aliases by length descending (e.g. 'navi mumbai' before 'mumbai')
    all_alias_pairs.sort(key=lambda x: len(x[1]), reverse=True)

    for canonical_city, alias in all_alias_pairs:
        if re.search(rf"\b{re.escape(alias)}\b", lowered):
            matched_city = canonical_city
            break

    # Determine location type
    if is_remote and not matched_city:
        loc_type = LocationType.REMOTE
    elif is_remote and matched_city:
        loc_type = LocationType.REMOTE
    elif is_hybrid:
        loc_type = LocationType.HYBRID
    elif matched_city:
        loc_type = LocationType.ON_SITE
    else:
        loc_type = LocationType.UNKNOWN

    is_p1 = matched_city in P1_CITIES
    is_p2 = matched_city in P2_CITIES

    # Construct normalized location string
    if matched_city:
        if matched_city in ("Mumbai", "Navi Mumbai", "Thane", "Pune"):
            norm_loc = f"{matched_city}, Maharashtra"
        elif matched_city == "Bengaluru":
            norm_loc = "Bengaluru, Karnataka"
        elif matched_city == "Hyderabad":
            norm_loc = "Hyderabad, Telangana"
        else:
            norm_loc = matched_city

        if is_remote:
            norm_loc += " (Remote)"
        elif is_hybrid:
            norm_loc += " (Hybrid)"
    elif is_remote:
        norm_loc = "Remote, India"
    else:
        # Fallback to sanitized raw string
        norm_loc = re.sub(r"\s+", " ", text).strip().title()

    return LocationAnalysis(
        raw_location=text,
        normalized_location=norm_loc,
        location_type=loc_type,
        is_p1=is_p1,
        is_p2=is_p2,
        is_remote=is_remote or (loc_type == LocationType.REMOTE),
        matched_city=matched_city,
    )
