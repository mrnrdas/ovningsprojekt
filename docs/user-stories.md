# User stories

Välj en av dessa för den nya funktionen i kursprojektet. Ingen av dem är byggd. Skriv acceptanskriterier i formen Givet/När/Så innan du börjar.

1. **Omförsök utan dubbla beställningar.** Som kund vill jag kunna skicka om en beställning när nätet strular, utan att den läggs två gånger.
2. **Avbryta en beställning.** Som kund vill jag kunna avbryta en beställning inom 30 minuter efter att jag lagt den.
3. **Lista med sidindelning.** Som kund vill jag se mina beställningar sidvis och kunna filtrera på status.
4. **Rabattkod.** Som kund vill jag kunna lägga en giltig rabattkod på en beställning som inte är betald.
5. **Byta leveransadress.** Som kund vill jag kunna byta leveransadress tills beställningen har skickats.
6. **Lagersaldo.** Som butik vill vi att en beställning nekas om någon vara inte finns i lager.
7. **Kundsökning.** Som kundtjänst vill vi kunna söka kunder på namn eller e-post.
8. **Export.** Som kund vill jag kunna ladda ner mina beställningar som en CSV-fil.

Några av dem kräver ändringar i databasen. Gör dem som migreringar i steg som går att backa.

---

## Vald funktion: 2. Avbryta en beställning

**Som kund vill jag kunna avbryta en beställning inom 30 minuter efter att jag lagt den.**

### Acceptanskriterier (Givet / När / Så)

#### Scenario 1: Lyckad avbrytning inom 30 minuter
- **Givet** att en inloggad kund har lagt en beställning för mindre än 30 minuter sedan och beställningens status tillåter avbrytning (`new` eller `paid`).
- **När** kunden skickar `POST /orders/:id/cancel` med sitt giltiga `X-Customer-Id`.
- **Så** svarar API:t med HTTP `200 OK`.
- **Och** beställningens status uppdateras till `cancelled`.
- **Och** fältet `cancelledAt` sätts till aktuell tidpunkt.

#### Scenario 2: Tidsgränsen på 30 minuter har passerat
- **Givet** att mer än 30 minuter har förflutit sedan beställningen lades (`created_at`).
- **När** kunden skickar `POST /orders/:id/cancel` med sitt `X-Customer-Id`.
- **Så** svarar API:t med HTTP `409 Conflict`.
- **Och** felkoden är `conflict` med ett meddelande om att 30-minutersfristen har löpt ut.
- **Och** beställningens status förblir oförändrad i databasen.

#### Scenario 3: Beställningen har redan skickats eller är redan avbruten
- **Givet** att beställningen har status `shipped` eller `cancelled`.
- **När** kunden skickar `POST /orders/:id/cancel`.
- **Så** svarar API:t med HTTP `409 Conflict`.
- **Och** felkoden är `conflict` med ett meddelande om att beställningen inte kan avbrytas.

#### Scenario 4: Annan kunds beställning (behörighetskontroll)
- **Givet** att beställningen tillhör kund A.
- **När** kund B anropar `POST /orders/:id/cancel` med sitt eget `X-Customer-Id`.
- **Så** svarar API:t med HTTP `403 Forbidden`.
- **Och** felkoden är `forbidden`.

#### Scenario 5: Beställningen existerar inte
- **Givet** ett order-id som inte finns i systemet.
- **När** kunden anropar `POST /orders/:id/cancel`.
- **Så** svarar API:t med HTTP `404 Not Found`.
- **Och** felkoden är `not_found`.

#### Scenario 6: Oautentiserat anrop
- **Givet** att begäran saknar `X-Customer-Id` eller innehåller ett ogiltigt kund-id.
- **När** anrop görs till `POST /orders/:id/cancel`.
- **Så** svarar API:t med HTTP `401 Unauthorized`.

#### Scenario 7: Ogiltigt order-id i sökvägen
- **Givet** ett icke-heltalsformat i URL:en (t.ex. `/orders/abc/cancel`).
- **När** anropet skickas.
- **Så** svarar API:t med HTTP `400 Bad Request`.
- **Och** felkoden är `invalid_input`.
