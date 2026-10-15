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
- Hledání podle kontaktu či nemovitosti a filtrování podle zdroje a stavu. Výběr zůstává zachovaný při přepnutí na Proces i po refreshi stejného tabu; aktivní filtry lze jednotlivě odebrat nebo zrušit všechny.
- Souhrn naléhavosti se vždy počítá z celé aktivní fronty. Při filtrování se zvlášť ukazuje počet výsledků a naléhavých úkolů ve výběru, takže prázdný výsledek nepůsobí jako hotová práce.
- Kontextový detail v pořadí důvod → kontext → hlavní akce → příští krok → historie.
- Záznam výsledku hovoru: nedovoláno, schůzka, ozvat se později nebo vyřadit.
- Viditelné potvrzení výsledku s novým stavem, přesným dalším krokem a volitelným návratem do fronty. Focus se vrátí na původní viditelný kontakt, nebo bezpečně na nadpis fronty, pokud už kontakt filtru neodpovídá.
- Samostatnou úpravu termínu aktivity bez skryté změny procesního stavu; koncové stavy novou aktivitu nepovolí.
- Potvrzení změny stavu, která zruší existující aktivitu, a dohledatelný zápis zrušení v historii.
- Kanban jako přehled procesu se všemi šesti stavy.
- Lokální pokračování scénáře po refreshi a bezpečný reset dema.

## Vizuální systém

Rozhraní má v obou motivech jedinou značkovou barvu `#DFFF3F` s tmavým textem `#11130A`. Tmavý podklad je grafitový `#0B0D0C`, světlý teplý `#F3F4EF`; obsahové plochy, text, hranice a stavové barvy mají vlastní tokeny pro každý motiv. Žlutá patří značce, aktivní navigaci, hlavní akci a výběru. Naléhavost, chyba a úspěch mají oddělené sémantické významy; běžné procesní štítky jsou neutrální. Motiv lze přepnout v hlavní liště; volba se ukládá lokálně a před hydratací se použije uložená nebo systémová preference. Přepnutí funguje i při blokovaném zápisu do úložiště, jen se pak volba nemusí zachovat po refreshi.

Webová interpretace Liquid Glass je podpůrná a omezená na navigaci, přepínač pohledů a shell dialogů. Kontaktní řádky, Kanban, historie a formulářová těla zůstávají stabilními obsahovými plochami. Vlastní textové helpery mají prefix `dc-`, aby nekolidovaly s Tailwind barvami povrchů. Statický výpočet pro definované kombinace textu a podkladu dává běžnému i sémantickému textu nejméně 5 : 1, primární akci 16,5 : 1 a silným hranicím formulářů nejméně 3 : 1; nejde o ruční kontrolu výsledných obrazovek v prohlížeči. Bez `backdrop-filter` nebo při omezené průhlednosti používá ovládání neprůhledný fallback. Nepodstatné přechody respektují `prefers-reduced-motion`.

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

Stav kontaktů se ukládá do `localStorage` pod verzovaným klíčem `obvolavani-portfolio-demo-v2`. Úspěšné čtení rozlišuje chybějící klíč, neplatný obsah a platný dataset. Při neplatném JSON, neznámé verzi nebo duplicitních ID se použije bezpečný výchozí dataset a UI zobrazí upozornění na obnovu.

Pokud se úložiště vůbec nepodaří přečíst, demo dál funguje v paměti, ale automatické ukládání zůstane pro tuto relaci vypnuté, aby výchozí dataset nepřepsal neznámý původní stav. Vědomě potvrzený reset smí zápis zkusit a po úspěchu persistenci znovu povolí. Pokud selže zápis po úspěšném čtení, další akce dál fungují v paměti a UI pravdivě upozorní, že změny nemusí zůstat zachované.

Pracovní UI výběr má samostatný verzovaný klíč `obvolavani-portfolio-ui-v1` v `sessionStorage`. Obsahuje jen pohled, hledaný text, zdroj a procesní stav; nemění schéma kontaktů a nikdy neobnovuje otevřený dialog ani rozpracovaný formulář. Neplatné enum hodnoty, JSON nebo blokované úložiště vedou k bezpečnému výchozímu pohledu.

## Podklady pro screenshoty

Lokální Chrome posloužil k vizuální kontrole této iterace. Čtyři srovnatelné kontrolní snímky fronty a detailu v obou motivech z produkčního buildu jsou v [`artifacts/digital-call-visual-qa/`](artifacts/digital-call-visual-qa/README.md). Nejsou to portfoliové exporty; ty zůstávají nedokončené a jejich scénář je v [`capture-checklist.md`](artifacts/digital-call-portfolio/capture-checklist.md).

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
