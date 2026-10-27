-- Fiktiv testdata. Inga riktiga personer, e-postadresserna använder domänen example.com.

INSERT INTO customers (id, name, email) VALUES
  (1, 'Alva Lind',        'alva.lind@example.com'),
  (2, 'Bror Ek',          'bror.ek@example.com'),
  (3, 'Cecilia Sand',     'cecilia.sand@example.com'),
  (4, 'David Berg',       'david.berg@example.com'),
  (5, 'Elin Strand',      'elin.strand@example.com'),
  (6, 'Farid Haddad',     'farid.haddad@example.com'),
  (7, 'Greta Holm',       'greta.holm@example.com'),
  (8, 'Hugo Nyström',     'hugo.nystrom@example.com');
SELECT setval('customers_id_seq', 100);

INSERT INTO discounts (code, percent, valid_from, valid_to) VALUES
  ('VAR10',   10, '2026-01-01', '2026-12-31'),
  ('SOMMAR20', 20, '2026-06-01', '2026-08-31'),
  ('GAMMAL15', 15, '2024-01-01', '2024-12-31');

-- Beställningar 1042 till 1044 används i föreläsningarnas exempel på karakteriseringstester.
INSERT INTO orders (id, customer_id, status, discount_code, created_at) VALUES
  (1040, 1, 'shipped',   NULL,       '2026-09-02 10:15:00+02'),
  (1041, 2, 'shipped',   'SOMMAR20', '2026-08-14 16:40:00+02'),
  (1042, 1, 'paid',      NULL,       '2026-10-01 09:05:00+02'),
  (1043, 3, 'new',       NULL,       '2026-10-03 13:20:00+02'),
  (1044, 4, 'paid',      'VAR10',    '2026-10-05 18:45:00+02'),
  (1045, 5, 'paid',      'GAMMAL15', '2026-10-07 11:30:00+02'),
  (1046, 6, 'cancelled', NULL,       '2026-10-08 08:10:00+02'),
  (1047, 2, 'new',       NULL,       '2026-10-10 20:55:00+02');
SELECT setval('orders_id_seq', 2000);

INSERT INTO order_lines (order_id, product, quantity, unit_price) VALUES
  (1040, 'Hörlurar',        1, 899.00),
  (1041, 'Laddkabel USB-C', 3, 129.00),
  (1041, 'Powerbank',       1, 349.00),
  (1042, 'Skrivbordslampa', 2, 375.00),
  (1042, 'Musmatta',        1, 200.00),
  (1044, 'Tangentbord',     1, 199.90),
  (1045, 'Webbkamera',      1, 649.00),
  (1046, 'Hörlurar',        1, 899.00),
  (1047, 'Laddkabel USB-C', 1, 129.00),
  (1047, 'Musmatta',        2, 200.00);
SELECT setval('order_lines_id_seq', 5000);
