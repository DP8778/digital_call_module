# Obvolávání – interaktivní portfolio demo

Veřejně prezentovatelná ukázka pracovního modulu pro evidenci kontaktů, výsledků hovorů a dalších aktivit. Projekt vznikl přepracováním pohovorového prototypu. Není to produkční CRM, oficiální systém žádné realitní společnosti ani nástroj pro skutečné volání.

Všechna jména, kontaktní údaje a případy jsou syntetické. Telefonní čísla jsou záměrně maskovaná a e-maily používají neodesílatelnou doménu `example.invalid`.

## Spuštění

Požadavky: Node.js 20+ a npm.

```bash
npm install
npm run dev
```

Kontroly:

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Co demo ukazuje

- Primární frontu „Dnes / K řešení“ rozdělenou podle skutečného času na zmeškané, dnešní, pozdější a nenaplánované aktivity, se zvláštním počtem věcí vyžadujících zásah právě teď.
- Hledání podle kontaktu či nemovitosti a filtrování podle zdroje a stavu, včetně viditelných aktivních filtrů a odlišných prázdných stavů.
- Kontextový detail v pořadí důvod → kontext → hlavní akce → příští krok → historie.
- Záznam výsledku hovoru: nedovoláno, schůzka, ozvat se později nebo vyřadit.
- Viditelné potvrzení výsledku s novým stavem, přesným dalším krokem a volitelným návratem do fronty.
- Samostatnou úpravu termínu aktivity bez skryté změny procesního stavu; koncové stavy novou aktivitu nepovolí.
- Potvrzení změny stavu, která zruší existující aktivitu, a dohledatelný zápis zrušení v historii.
- Kanban jako přehled procesu se všemi šesti stavy.
- Lokální pokračování scénáře po refreshi a bezpečný reset dema.

## Vizuální systém

Rozhraní používá vlastní světlé a tmavé sémantické tokeny pro podklad, obsahové a zvýšené plochy, ovládací sklo, okraje, text, akcent, focus a stavové významy. Motiv lze přepnout v hlavní liště; volba se ukládá lokálně a před hydratací se použije uložená nebo systémová preference.

Webová interpretace Liquid Glass je záměrně omezená na navigaci, přepínač pohledů a hlavičky dialogů. Kontaktní řádky, Kanban, historie a formulářová těla zůstávají neprůhledné obsahové plochy. Pokud `backdrop-filter` nebo preference průhlednosti nejsou dostupné, ovládání používá neprůhledný kontrastní fallback. Nepodstatné přechody respektují `prefers-reduced-motion`.

## Stavový model

Kontakt má tři oddělené oblasti:

1. `status` – právě jeden ze šesti procesních stavů.
2. `nextActivity` – volitelný typ a termín dalšího hovoru nebo schůzky.
3. `history` – neměnná chronologie událostí. Počet pokusů se vždy odvozuje pouze z událostí `call_attempt`.

Povolené přechody jsou jediným zdrojem pravdy v `allowedMoves.ts`:

| Z | Kam |
| --- | --- |
| Zásobník | K provolání |
| K provolání | Zásobník, Volat později, Domluvená schůzka, Vyřazeno |
| Volat později | K provolání, Domluvená schůzka, Vyřazeno |
| Domluvená schůzka | Nabraná nemovitost, Vyřazeno |
| Nabraná nemovitost | koncový stav |
| Vyřazeno | koncový stav |

Žádný přesun sám o sobě nevytvoří pokus. Pokus vznikne pouze potvrzením formuláře „Zaznamenat výsledek“.

## Časová pravidla a předpoklady

Původní text pohovorového zadání není k dispozici. Následující intervaly byly nalezeny v původním kódu a jsou zachované jako **nepotvrzený zděděný předpoklad**, nikoli jako ověřené produktové pravidlo.

| Událost | Tipař | FB / call centrum | Inzerce | Chování |
| --- | ---: | ---: | ---: | --- |
| Doporučený follow-up po 1. nedovolání | 60 s | 1 h | 24 h | Nabídne přesné doporučení, nebo vlastní minutový termín. |
| Doporučený follow-up po dalším nedovolání | 30 s | 30 min | 12 h | Počet pokusů se čte z historie; přesné doporučení se nezaokrouhluje. |
| Tolerance po termínu naplánovaného hovoru | 20 s | 1 h | 1 h | Po uplynutí jednou změní `call_later → to_call`; nevytvoří pokus a zachová zmeškaný termín. |
| Termín schůzky uplyne | — | — | — | Schůzka se označí jako zmeškaná, stav se automaticky nemění. |

Původní nekonečné obnovování zámku v „K provolání“ bylo odstraněno. Časové zpracování je idempotentní: opakované vyhodnocení stejné situace nevytváří další přesun ani událost.

U výsledku „Nedovoláno“ jsou krátké zděděné intervaly zobrazené jako samostatná přesná volba a ukládají se na sekundy. Vlastní termín používá nativní `datetime-local` s minutovou přesností. Obě cesty se při potvrzení znovu ověřují proti aktuálnímu času; stejná podmínka je v čisté stavové logice.

Všechny vstupy a výstupy termínů používají `Europe/Prague`. Převod odmítne neexistující lokální čas při změně na letní čas; testy pokrývají 23hodinový i 25hodinový den.

## Uložení dema

Stav se ukládá do `localStorage` pod verzovaným klíčem `obvolavani-portfolio-demo-v2`. Při neplatném JSON, neznámé verzi nebo duplicitních ID se použije bezpečný výchozí dataset a UI zobrazí upozornění. Tlačítko „Obnovit demo“ stav vědomě nahradí po potvrzení.

## Přístupnost

- Všechny podstatné akce jsou dostupné tlačítky bez drag-and-drop.
- Dialogy zachytávají focus, reagují na Escape a po zavření focus vracejí. Při vnořeném formuláři je detail inertní a Escape zavře pouze horní vrstvu.
- Formuláře mají popisky, chybové zprávy a textové významy stavů.
- Viditelný focus a stavové štítky nevyjadřují informaci jen barvou.
- Rozhraní se skládá od telefonu přes tablet po široký desktop.

## Omezení dema

- Bez backendu, autentizace, skutečného volání, e-mailu a zpráv.
- Stav je lokální pro jeden prohlížeč.
- Neproběhl výzkum s reálnými makléři ani měření obchodního dopadu.
- Zdrojově závislé intervaly čekají na porovnání s původním pohovorovým zadáním.
