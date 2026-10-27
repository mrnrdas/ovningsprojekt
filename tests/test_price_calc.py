import sys
import subprocess
import json
from decimal import Decimal
import os
import pytest

# Lägg till src/legacy i Python-sökvägen
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "legacy"))
from price_calc import calc_price, _kapa, Pris


def test_kapa_truncation():
    """Verifierar att _kapa trunkerar exakt utan avrundning uppåt."""
    assert _kapa(Decimal("10.559")) == Decimal("10.55")
    assert _kapa(Decimal("10.551")) == Decimal("10.55")
    assert _kapa(Decimal("100.00")) == Decimal("100.00")
    assert _kapa(Decimal("0.009")) == Decimal("0.00")


def test_calc_price_order_without_discount():
    """Karakteriseringstest för order 1042: 2x375 + 1x200 = 950 kr, ingen rabattkod."""
    p = calc_price(1042)
    assert p is not None
    assert p.net == Decimal("950.00") or p.net == Decimal("950")
    assert p.vat == Decimal("237.50") or p.vat == Decimal("237.5")
    assert p.total == Decimal("1187.50") or p.total == Decimal("1187.5")


def test_calc_price_order_with_discount():
    """Karakteriseringstest för order 1044: Tangentbord 199.90 kr, rabattkod VAR10 (10%)."""
    p = calc_price(1044)
    assert p is not None
    # 199.90 - 10% = 179.91 kr
    assert p.net == Decimal("179.91")
    # Moms 25% av 179.91 = 44.9775 -> trunkeras med _kapa till 44.97
    assert p.vat == Decimal("44.97")
    assert p.total == Decimal("224.88")


def test_calc_price_order_with_discount_1045():
    """Karakteriseringstest för order 1045: Webbkamera 649 kr, rabattkod GAMMAL15 (15%)."""
    p = calc_price(1045)
    assert p is not None
    # 649 - 15% = 551.65 kr
    assert p.net == Decimal("551.65")
    # Moms 25% av 551.65 = 137.9125 -> trunkeras till 137.91
    assert p.vat == Decimal("137.91")
    assert p.total == Decimal("689.56")


def test_calc_price_empty_order():
    """Karakteriseringstest för order 1043: inga orderrader."""
    p = calc_price(1043)
    assert p is not None
    assert p.net == Decimal(0)
    assert p.vat == Decimal(0)
    assert p.total == Decimal(0)


def test_calc_price_nonexistent_order():
    """Karakteriseringstest för obefintlig order: returnerar None."""
    assert calc_price(9999) is None


def test_cli_output():
    """Verifierar CLI-anropet som används av Node-bryggan legacyPrice.ts."""
    script = os.path.join(os.path.dirname(__file__), "..", "src", "legacy", "price_calc.py")
    res = subprocess.run([sys.executable, script, "1042"], capture_output=True, text=True)
    assert res.returncode == 0
    data = json.loads(res.stdout)
    assert data == {"net": "950", "vat": "237.5", "total": "1187.5"}

    # Obefintlig order
    res_missing = subprocess.run([sys.executable, script, "9999"], capture_output=True, text=True)
    assert res_missing.returncode == 1
    assert json.loads(res_missing.stdout) == {"error": "finns inte"}
