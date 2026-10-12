# Obvolávání – poznámky pro UX/UI case study

## Původ a role

Projekt vychází z existujícího pohovorového prototypu „Obvolávání“. Tato iterace převádí prototyp do soudržného interaktivního dema vhodného pro portfolio. Přesná původní role autora, zadavatel a časový rámec nejsou v repozitáři doložené a musí je autor před publikací doplnit vlastními slovy.

V této iteraci proběhl produktový a UX audit, návrh informační architektury, stavového modelu, responzivního rozhraní a frontendová implementace. Nelze tvrdit, že šlo o produkční práci pro M&M Reality nebo jinou konkrétní firmu.

## Problém

Původní prototyp používal Kanban jako jedinou pracovní plochu. Stav kontaktu, naplánovaný termín a technické časovače byly propojené tak, že přesun mohl navýšit počet pokusů a vypršení časovače mohlo bez nové uživatelské události obnovovat samo sebe. Chyběl detail kontaktu, historie, perzistence a prioritní pohled na dnešní práci.

Designová otázka této iterace: jak během několika sekund ukázat, který kontakt vyžaduje pozornost, proč ji vyžaduje a jak bezpečně zaznamenat další krok?

## Cílové scénáře jako hypotézy

1. Uživatel dokáže bez procházení všech procesních sloupců najít zmeškaný nebo dnešní úkol.
2. Kontextový detail poskytne dost informací k rozhodnutí před záznamem výsledku.
3. Oddělení výsledku hovoru, stavu a termínu sníží chyby v evidenci.
4. Stejné stavové akce přes tlačítka umožní spolehlivou práci bez přetahování.

Tyto body jsou návrhové hypotézy. Nebyly ověřeny s reálnými uživateli.

## Omezení

- Původní text pohovorového zadání nebyl k dispozici.
- Zdrojové intervaly jsou převzaté z kódu a označené jako nepotvrzený předpoklad.
- Demo používá výhradně syntetická data a `localStorage`.
- Neimplementuje telefonii, e-mail, zprávy, týmovou spolupráci ani backend.
- Nejsou k dispozici produkční metriky, obchodní výsledky ani uživatelské rozhovory.

## Zvažované alternativy

- **Pouze vylepšit Kanban:** zachoval by známý pohled, ale neřešil by prioritizaci dnešní práce.
- **Odstranit Kanban:** zjednodušil by produkt, ale ztratil by přehled procesu a návaznost na původní prototyp.
- **Automaticky měnit stav při každém termínu:** snížilo by počet kroků, ale skrytě by míchalo čas a procesní rozhodnutí.
- **Přidat backend:** umožnil by sdílený stav, ale pro ověření interakčního konceptu by byl nepřiměřený.

Zvolené řešení ponechává Kanban jako sekundární přehled a přidává primární pracovní frontu. Automatika je omezena na jednorázové zpřístupnění hovoru po termínu; nevytváří pokusy.

## Hlavní rozhodnutí

- Stav, další aktivita a historie jsou tři samostatné části modelu.
- Počet pokusů se odvozuje pouze ze zaznamenané historie hovorů.
- Zmeškané aktivity se určují vůči skutečnému času, takže dnešní prošlý termín nezůstává ve skupině „Dnes“.
- Zmeškané, dnešní, pozdější a nenaplánované aktivity jsou textově oddělené; souhrn zvlášť ukazuje práci vyžadující zásah právě teď.
- Záznam výsledku používá čtyři konkrétní možnosti s konzistentním mapováním na stav.
- Samostatné plánování výslovně nemění stav.
- Krátké zděděné doporučení pro tipaře se ukládá přesně na sekundy; vlastní termín zůstává minutový a rozdíl je v dialogu vysvětlený.
- Koncové stavy neumožňují plánování. Změna stavu rušící termín vyžaduje potvrzení a vytváří historickou událost.
- Po výsledku zůstává uživatel v detailu s potvrzením nového stavu a dalšího kroku a může se vědomě vrátit do fronty.
- Kontakty jsou nevolatelné, syntetické a viditelně označené.
- Všechny klíčové akce fungují klávesnicí bez drag-and-drop.

## Popis dema

Výchozí dataset obsahuje aktivní dnešní hovory, zmeškaný hovor, dnešní a zmeškanou schůzku, budoucí follow-up, nové kontakty v zásobníku i koncové případy. Uživatel může hledat, filtrovat, otevřít detail, zaznamenat výsledek, upravit další aktivitu, změnit povolený stav, stránku obnovit a pokračovat.

## Co bylo skutečně ověřeno

- Automatické testy čisté logiky: povolený i zakázaný přesun, vznik pokusu, plánování bez změny stavu, zákaz plánování v koncovém stavu, auditované zrušení aktivity, validace minulého termínu, přesné krátké doporučení, jednorázová expirace a obnova uloženého dema.
- Automatické testy řazení fronty: dnešní prošlý termín, budoucí dnešní termín, hranice půlnoci a české tvary počtů.
- Automatické testy pražského času včetně půlnoci a změn letního/zimního času.
- Automatické testy: 19/19 prošlo ve třech testovacích souborech.
- TypeScript (`tsc --noEmit`), ESLint a produkční Next.js build prošly bez chyby.
- Lokální vývojový server ve smoke testu vrátil HTTP 200 a správný titul stránky.

## Co ještě ověřeno není

- Moderované testování s cílovými uživateli.
- Srozumitelnost zdrojových intervalů proti původnímu zadání.
- Reálný výkon v provozu, týmová synchronizace a integrace.
- Obchodní dopad, rychlost práce nebo snížení chybovosti.
- Ruční průchod ve viewports 375, 768 a 1440 px, protože v implementačním prostředí nebylo dostupné ovládání prohlížeče.
- Ruční ověření Tab, Shift+Tab a postupného Escape ve skutečném prohlížeči ani průchod asistivní technologií; implementace focus trapu a inertní spodní vrstvy nenahrazuje test se screen readerem.

## Obrazovky vhodné pro case study

1. Původní Kanban prototyp – před úpravou (z historického commitu nebo vlastního archivu).
2. „Dnes / K řešení“ s viditelnou zmeškanou a dnešní prioritou.
3. Vyhledávání a filtry v aktivním stavu.
4. Detail kontaktu s příštím krokem a historií.
5. Dialog „Zaznamenat výsledek“ s vysvětleným mapováním.
6. Samostatné plánování termínu s informací, že stav se nemění.
7. Kanban po zaznamenání výsledku.
8. Mobilní pracovní fronta a mobilní detail.
9. Tabulka pravidel ze README jako artefakt produktového rozhodnutí.
