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
- Tmavý pracovní panel počítá naléhavost z celé aktivní fronty, ale „Otevřít první kontakt“ respektuje aktuální filtr a pořadí seznamu. Při prázdném naléhavém výběru nabídne návrat k celé frontě místo otevření kontaktu mimo výběr.
- Kontextový detail v pořadí důvod → kontext → hlavní akce → příští krok → historie.
- Záznam výsledku hovoru: nedovoláno, schůzka, ozvat se později nebo vyřadit.
- Viditelné potvrzení výsledku s novým stavem, přesným dalším krokem a volitelným návratem do fronty. Focus se vrátí na původní viditelný kontakt, nebo bezpečně na nadpis fronty, pokud už kontakt filtru neodpovídá.
- Formulář se zavře a úspěch ukáže pouze při doménou přijaté změně. Při uplynutí termínu ponechá rozepsané údaje a nabídne opravu; potvrzení vychází ze skutečného nového stavu v paměti, ne ze záměru uživatele ani ze záruky zápisu na disk.
- Samostatnou úpravu termínu aktivity bez skryté změny procesního stavu; koncové stavy novou aktivitu nepovolí.
- Potvrzení změny stavu, která zruší existující aktivitu, a dohledatelný zápis zrušení v historii.
- Kanban jako přehled procesu se všemi šesti stavy.
- Lokální pokračování scénáře po refreshi a bezpečný reset dema.

## Vizuální systém

Světlý motiv používá bílé `#FFFFFF` pozadí i obsah, lehce zapuštěný pás filtrů `#F5F6F4`, hover `#F2F2F3`, jemné oddělovače a hlavní text `#181818`. Jediná bílá hlavička sdružuje značku, oba pohledy, označení dema a přepínač motivu; reset je nenápadnou akcí u nadpisu pracovního obsahu. Nad bílým seznamem je jediný uhlový pracovní panel se skutečným globálním souhrnem a limetkovou akcí pro první naléhavý kontakt v aktuálním výběru. Tmavý motiv má samostatné tokeny s pozadím `#161616`, obsahem `#222222` a světlým textem `#F2F2F2`. Logo je monochromatické. Limetková `#DFFF3F` zůstává akcentem hlavních akcí a malého indikátoru výběru. Malinová označuje pouze prošlou aktivitu; jantarová hovor připravený nyní nebo chybějící další krok; zelená patří skutečnému úspěchu. Budoucí plán a běžné procesní štítky zůstávají neutrální. Přepínač motivu respektuje uloženou nebo systémovou preferenci před hydratací. Přepnutí funguje i při blokovaném zápisu do úložiště, jen se pak volba nemusí zachovat po refreshi.

Tlačítka sdílejí zaoblení, horní odlesk, vnitřní hranu a měkký stín. Primární limetkové tlačítko má jemný gradient a v pracovním panelu tmavou plošku se šipkou; hlavní krok v detailu zůstává grafitový s bílým textem. Sekundární akce má světle modelovaný povrch, doplňková je textová. Destruktivní potvrzení má tmavší obrys, výstražnou ikonu a konkrétní následek v popisku, nikdy limetkovou výplň. Barevné časové významy mají vlastní tokeny oddělené od chyby formuláře, výsledku procesu a destruktivního potvrzení. Globální počet práce právě teď se počítá z celé aktivní fronty a zvlášť ukazuje prošlé aktivity, připravené hovory a budoucí dnešní plán; filtr má vlastní řádek ve stejném panelu. Glass zůstává jen jemnou podpůrnou vrstvou shellu dialogů; hlavička i obsah jsou neprůhledné. Kontakty oddělují linky, jejich naléhavost značí krátký text a ikona bez velkých opakovaných pilulek. Focus zůstává viditelný na světlém, tmavém i limetkovém tlačítku. Vypočtený kontrast časových štítků na původním jemném podkladu je 5,06 : 1 (prošlý termín) a 5,50 : 1 (připravenost) ve světlém, 7,76 : 1 a 8,27 : 1 v tmavém motivu; nejde o úplný audit nové kompozice. Vlastní textové helpery mají prefix `dc-`, aby nekolidovaly s Tailwind barvami povrchů. Při omezené průhlednosti má dialog neprůhledný fallback; nepodstatné přechody respektují `prefers-reduced-motion`.

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

Čtyři snímky v [`artifacts/digital-call-visual-qa/`](artifacts/digital-call-visual-qa/README.md) dokumentují **historickou citronovo-grafitovou paletu** a neověřují současný bílý redesign. Nejsou to portfoliové exporty; ty zůstávají nedokončené a jejich scénář je v [`capture-checklist.md`](artifacts/digital-call-portfolio/capture-checklist.md).

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
