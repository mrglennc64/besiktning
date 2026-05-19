r"""Seed a fully-filled demo apartment protokoll.

Run from apps/api/ with:
    .\.venv\Scripts\python.exe scripts\seed_demo.py
"""
from __future__ import annotations

import json
import sys
import urllib.request

API = "http://127.0.0.1:8000"


def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        f"{API}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    p = call("POST", "/protokoll", {"template": "apartment"})
    pid = p["id"]
    print(f"created {p['number']}  id={pid}")

    demo = {
        "data": {
            "header": {
                "lagenhetsadress": "Storgatan 12, lgh 1402",
                "besiktningsdatum": "2026-05-19",
                "besiktningstyp": "avflyttning",
                "hyresgast_avflyttande": "Anna Lindström",
                "hyresgast_inflyttande": "Erik Bergman",
                "bostadsrattsforening": "BRF Vasakvarteret",
                "telefon": "08-555 123 45",
                "lagenhets_id": "1402",
                "lagenhetstyp": "3 rok, 78 m²",
                "besiktningsman": "Glenn Carter",
                "kontaktperson": "Maria Holm",
                "kontakt_telefon": "070-123 45 67",
                "inflyttningsdatum": "2026-06-01",
                "utflyttningsdatum": "2026-05-31",
            },
            "rooms": {
                "hall": {
                    "golv": {"parkett": 2},
                    "vaggar": {"malade": 1},
                    "tak": {"malat": 1},
                    "snickerier": {"dorrkarmar_foder": 2, "lister": 2},
                    "ovriga_detaljer": {
                        "dorrar": 1, "las": 1, "trosklar": 2,
                        "strombrytare": 1, "vagguttag": 1,
                    },
                    "anmarkningar": "Mindre skrapmärken på parkett vid entrédörren.",
                },
                "kok": {
                    "golv": {"klinker": 1},
                    "vaggar": {"kakel": 1, "malade": 2},
                    "tak": {"malat": 2},
                    "snickerier": {"fonster_inkl_smyg": 1, "paneler": 1, "lister": 2},
                    "ovriga_detaljer": {
                        "dorrar": 1, "las": 1, "kranar": 2,
                        "strombrytare": 1, "vagguttag": 1,
                        "fonsterrutor": 1, "radiatorer": 1, "brandvarnare": 1,
                    },
                    "anmarkningar": "Köksblandare droppar svagt – åtgärd rekommenderas.",
                },
                "badrum_1": {
                    "golv": {"klinker": 1},
                    "vaggar": {"kakel": 3},
                    "tak": {"malat": 2},
                    "ovriga_detaljer": {
                        "dorrar": 2, "las": 2, "trosklar": 2, "kranar": 2,
                        "strombrytare": 1, "vagguttag": 1, "radiatorer": 1,
                    },
                    "anmarkningar": "Spricka i kakelplatta bakom WC – åtgärd krävs före inflyttning.",
                },
                "vardagsrum": {
                    "golv": {"parkett": 1},
                    "vaggar": {"tapet": 1},
                    "tak": {"malat": 1},
                    "snickerier": {"fonster_inkl_smyg": 1, "lister": 1},
                    "ovriga_detaljer": {
                        "dorrar": 1, "strombrytare": 1, "vagguttag": 1,
                        "fonsterrutor": 1, "radiatorer": 1,
                    },
                },
                "sovrum_1": {
                    "golv": {"parkett": 2},
                    "vaggar": {"malade": 1},
                    "tak": {"malat": 1},
                    "ovriga_detaljer": {
                        "dorrar": 1, "strombrytare": 1, "vagguttag": 1,
                        "fonsterrutor": 1, "radiatorer": 1,
                    },
                    "anmarkningar": "Parkett behöver oljas inom kort.",
                },
            },
            "utrustning": {
                "tvattstall": 1, "wc_stol": 1, "badkar": 2, "dusch": 1,
                "badrumsskap": 2, "spis": 1, "kokslakt_kapa": 1,
                "kylskap": 1, "frys": 1, "diskbank": 1, "diskmaskin": 2,
                "bankutrustning": 1, "skaputrustning": 2,
                "golvvarme": 1,
            },
            "avslutning": {
                "kommentarer": (
                    "Lägenheten i överlag gott skick. Mindre brister noterade "
                    "i kök och badrum. Spricka i badrumskakel åtgärdas av "
                    "föreningen innan inflyttning."
                ),
                "ersatts_av_hyresgast": 1500,
                "nycklar_antal": 3,
                "nycklar_aterlamnade": True,
                "utrymda_och_stadade": True,
            },
            "signaturer": {
                "avflyttande_hyresgast": {
                    "namn": "Anna Lindström",
                    "datum": "2026-05-19",
                },
                "besiktningsman": {
                    "namn": "Glenn Carter",
                    "datum": "2026-05-19",
                },
            },
        }
    }

    patched = call("PATCH", f"/protokoll/{pid}", demo)
    print(f"seeded address={patched['data']['header']['lagenhetsadress']}")
    print(f"  rooms={list(patched['data']['rooms'].keys())}")
    print(f"  utrustning items={len(patched['data']['utrustning'])}")
    print()
    print(f"OPEN  ->  http://127.0.0.1:3000/protokoll/{pid}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
