# price_calc.py
# prisberakning for ordrar. skriven 2019, flyttad hit fran gamla admin-systemet.
# OBS rör inte avrundningen, ekonomi har stämt av mot den.

import os, sys, json, datetime
from decimal import Decimal
import psycopg

DB = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/butik")
conn = psycopg.connect(DB, autocommit=True)

MOMS = 25
LOGG = os.path.join(os.path.dirname(__file__), "price_calc.log")


class Pris:
    def __init__(self, net, vat, total):
        self.net = net
        self.vat = vat
        self.total = total


def _kapa(x):
    # två decimaler
    return Decimal(int(x * 100)) / 100


def calc_price(order_id):
    cur = conn.cursor()
    cur.execute("select discount_code from orders where id = %s" % order_id)
    rad = cur.fetchone()
    if rad == None:
        return None
    kod = rad[0]

    cur.execute("select quantity, unit_price from order_lines where order_id = %s" % order_id)
    summa = Decimal(0)
    for q, p in cur.fetchall():
        summa = summa + q * p

    if kod:
        cur.execute("select percent from discounts where code = '%s'" % kod)
        r = cur.fetchone()
        if r:
            summa = summa - summa * r[0] / 100

    net = _kapa(summa)
    vat = _kapa(net * MOMS / 100)
    total = net + vat

    try:
        f = open(LOGG, "a")
        f.write("%s %s %s\n" % (datetime.datetime.now().isoformat(), order_id, total))
        f.close()
    except:
        pass

    return Pris(net, vat, total)


if __name__ == "__main__":
    p = calc_price(int(sys.argv[1]))
    if p is None:
        print(json.dumps({"error": "finns inte"}))
        sys.exit(1)
    print(json.dumps({"net": str(p.net), "vat": str(p.vat), "total": str(p.total)}))
