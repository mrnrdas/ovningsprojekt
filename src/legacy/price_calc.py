"""
price_calc.py
Prisberäkning för ordrar, moderniserad från 2019 års version.
OBS: Rör inte avrundningen (_kapa), ekonomi har stämt av mot den.
"""

from __future__ import annotations

import datetime
import json
import logging
import os
import sys
from decimal import Decimal
from typing import Optional
import psycopg

MOMS = Decimal(25)
LOGG = os.path.join(os.path.dirname(__file__), "price_calc.log")
logger = logging.getLogger("price_calc")


class Pris:
    """Dataklass för beräknat pris."""

    def __init__(self, net: Decimal, vat: Decimal, total: Decimal) -> None:
        self.net = net
        self.vat = vat
        self.total = total

    def as_dict(self) -> dict[str, str]:
        return {"net": str(self.net), "vat": str(self.vat), "total": str(self.total)}


def _kapa(x: Decimal | float) -> Decimal:
    """Trunkerar till två decimaler utan avrundning uppåt.
    OBS: Rör ej - ekonomiavdelningen har stämt av mot denna logik.
    """
    val = Decimal(str(x) if isinstance(x, float) else x)
    return Decimal(int(val * 100)) / 100


def get_db_connection(database_url: str | None = None) -> psycopg.Connection:
    """Hämtar en ny databasanslutning på ett säkert sätt."""
    db_url = (
        database_url
        or os.environ.get("DATABASE_URL")
        or "postgresql://postgres:postgres@localhost:5432/butik"
    )
    return psycopg.connect(db_url, autocommit=True)


class _LazyConnection:
    """Ger bakåtkompatibilitet för skript (t.ex. jobs/nightly_report.py) som importerar `conn` direkt."""

    def __init__(self) -> None:
        self._conn: psycopg.Connection | None = None

    def _ensure(self) -> psycopg.Connection:
        if self._conn is None or self._conn.closed:
            self._conn = get_db_connection()
        return self._conn

    def cursor(self, *args, **kwargs):
        return self._ensure().cursor(*args, **kwargs)

    def close(self) -> None:
        if self._conn is not None and not self._conn.closed:
            self._conn.close()


# Bakåtkompatibel modul-nivå anslutning
conn = _LazyConnection()


def _log_price(order_id: int, total: Decimal) -> None:
    """Loggar beräkning utan att läcka personuppgifter."""
    try:
        with open(LOGG, "a", encoding="utf-8") as f:
            f.write(f"{datetime.datetime.now().isoformat()} {order_id} {total}\n")
    except Exception as exc:
        logger.debug("Kunde inte skriva till loggfil: %s", exc)


def calc_price(order_id: int, db_conn: Optional[psycopg.Connection] = None) -> Optional[Pris]:
    """Beräknar pris, rabatt och moms för en beställning med parametriserad SQL."""
    own_conn = False
    if db_conn is None:
        db_conn = get_db_connection()
        own_conn = True

    try:
        with db_conn.cursor() as cur:
            # 1. Hämta eventuell rabattkod (parametriserad fråga, skyddad mot SQL-injektion)
            cur.execute("SELECT discount_code FROM orders WHERE id = %s", (order_id,))
            order_row = cur.fetchone()
            if order_row is None:
                return None
            discount_code = order_row[0]

            # 2. Hämta alla orderrader (parametriserad fråga)
            cur.execute(
                "SELECT quantity, unit_price FROM order_lines WHERE order_id = %s",
                (order_id,),
            )
            rows = cur.fetchall()
            summa = Decimal(0)
            for quantity, unit_price in rows:
                summa += Decimal(quantity) * Decimal(unit_price)

            # 3. Applicera rabatt om giltig kod finns
            if discount_code:
                cur.execute(
                    "SELECT percent FROM discounts WHERE code = %s",
                    (discount_code,),
                )
                discount_row = cur.fetchone()
                if discount_row:
                    percent = Decimal(discount_row[0])
                    summa = summa - (summa * percent / Decimal(100))

            net = _kapa(summa)
            vat = _kapa(net * MOMS / Decimal(100))
            total = net + vat

            _log_price(order_id, total)
            return Pris(net, vat, total)
    finally:
        if own_conn:
            db_conn.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "order_id saknas"}))
        sys.exit(1)

    try:
        oid = int(sys.argv[1])
    except ValueError:
        print(json.dumps({"error": "ogiltigt id"}))
        sys.exit(1)

    p = calc_price(oid)
    if p is None:
        print(json.dumps({"error": "finns inte"}))
        sys.exit(1)

    print(json.dumps(p.as_dict()))
