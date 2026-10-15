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
- Hlavní souhrn naléhavosti vychází vždy z celé aktivní fronty, ne z právě filtrovaných kontaktů. Výběr má vlastní stručný počet výsledků a naléhavých položek.
- Pohled a filtry tvoří jeden sdílený, verzovaný UI stav pro aktuální tab. Aktivní výběr proto nezmizí v Kanbanu ani po refreshi a reset dema jej vědomě vyčistí.
- Záznam výsledku používá čtyři konkrétní možnosti s konzistentním mapováním na stav.
- Samostatné plánování výslovně nemění stav.
- Krátké zděděné doporučení pro tipaře se ukládá přesně na sekundy; vlastní termín zůstává minutový a rozdíl je v dialogu vysvětlený.
- Koncové stavy neumožňují plánování. Změna stavu rušící termín vyžaduje potvrzení a vytváří historickou událost.
- Po výsledku zůstává uživatel v detailu s potvrzením nového stavu a dalšího kroku a může se vědomě vrátit do fronty.
- Návrat z detailu obnoví focus na kontakt jen tehdy, když je stále ve výběru; jinak použije nadpis aktuálního seznamu. Focus se neposílá na odmountovaný prvek.
- Chyba čtení či zápisu úložiště neblokuje práci v paměti. Po chybě čtení se automatická persistence nepovolí, takže syntetický fallback nemůže potichu přepsat neznámý původní stav; vědomý reset je jediná akce, která smí zápis znovu zkusit. UI rozlišuje obnovu neplatných dat, nedostupné čtení a selhání zápisu.
- Kontakty jsou nevolatelné, syntetické a viditelně označené.
- Všechny klíčové akce fungují klávesnicí bez drag-and-drop.

## Vizuální iterace

- Navigační a ovládací vrstva používá střídmý průsvitný materiál s krátkým blur efektem, světlou hranou a měkkým stínem. Obsahová vrstva zůstává neprůhledná, aby pracovní data nesoutěžila s efektem.
- Následná vizuální iterace zesílila materiál navigace a celého dialogového shellu pomocí tónovaného podkladu, 22–24px blur, vnitřního highlightu a odděleného blízkého a vzdáleného stínu. Hlavička nepřidává druhý backdrop blur a formulářová těla zůstávají neprůhledná.
- Aktuální identita používá stejnou citronovou `#DFFF3F` v obou motivech: monogram DC, aktivní pohled, hlavní akci, vybraný ovládací prvek a malé orientační značky. Zbytek ploch je převážně neutrální grafitový nebo světlý. Aktivní filtry sdílejí druhou ovládací lištu, nevytvářejí třetí samostatnou lištu.
- Vlastní textové třídy používají prefix `dc-`, takže sekundární text nekoliduje s Tailwind tokenem pro muted povrch. Staticky vypočtené minimum pro definované kombinace běžného, sekundárního a stavového textu je 5 : 1; pro silné hranice formulářů alespoň 3 : 1. Ruční vizuální kontrola obrazovek tím není nahrazena.
- Detail kontaktu má kompaktnější status, přirozeně vysoké kontextové karty, zřetelnější hlavní akci a oddělenou plochu dalšího kroku. Kontextový formatter zobrazuje termín právě jednou a zachovává sekundy tam, kde jsou součástí pravidla.
- Světlý i tmavý motiv mají samostatné sémantické tokeny; tmavý režim není globální inverze. Přepínač je skutečně zapojený, explicitní preference se aplikuje před hydratací a při selhání zápisu motiv dál funguje v paměti.
- Fronta zachovává husté řádky, ale zvýrazňuje současnou prioritu, aktivní filtry a zmeškanou skupinu textem i hranou.
- Kanban má na úzkém viewportu lokalizovaný horizontální scroll, takže šest sloupců neroztahuje celou stránku.
- Dialogy mají kouřový glass shell s jedinou rozostřenou vrstvou; formuláře, potvrzení, chyby a historie používají stabilní neprůhledné obsahové plochy.
- Reset dema používá vlastní potvrzovací dialog se stejnou vizuální a přístupnostní strukturou místo nestylovatelného systémového potvrzení.
- Fallbacky pokrývají chybějící blur, omezenou průhlednost, vyšší kontrast, forced colors a omezený pohyb.

## Popis dema

Výchozí dataset obsahuje aktivní dnešní hovory, zmeškaný hovor, dnešní a zmeškanou schůzku, budoucí follow-up, nové kontakty v zásobníku i koncové případy. Uživatel může hledat, filtrovat, otevřít detail, zaznamenat výsledek, upravit další aktivitu, změnit povolený stav, stránku obnovit a pokračovat.

## Co bylo skutečně ověřeno

- Automatické testy čisté logiky: povolený i zakázaný přesun, vznik pokusu, plánování bez změny stavu, zákaz plánování v koncovém stavu, auditované zrušení aktivity, validace minulého termínu, přesné krátké doporučení, jednorázová expirace a obnova uloženého dema.
- Automatické testy řazení fronty: dnešní prošlý termín, budoucí dnešní termín, hranice půlnoci a české tvary počtů.
- Automatické testy pražského času včetně půlnoci a změn letního/zimního času.
- Automatické testy navíc pokrývají celkovou naléhavost mimo aktivní filtr, validaci uloženého UI výběru, čtyři výsledky čtení persistence a výjimky při čtení, zápisu a resetu úložiště.
- Regresní test ověřuje, že chyba `getItem` nad předexistujícím validním stavem zakáže automatický zápis: následná práce v paměti nevolá funkční `setItem` a původní serializovaný stav zůstane beze změny. Samostatně je pokryto platné čtení se selháním `setItem` a vědomý reset po chybě čtení.
- Automatické testy pokrývají také kontextový termín bez duplikace a zachování sekund.
- TypeScript (`tsc --noEmit`), ESLint a produkční Next.js build prošly bez chyby.
- Lokální vývojový server ve smoke testu vrátil HTTP 200 a správný titul stránky.
- Vizuální redesign nezměnil čistou stavovou logiku, časová pravidla ani datové typy.
- Po citronovo-grafitové vizuální iteraci prošlo znovu 30/30 testů, TypeScript, ESLint a produkční build. Statický výpočet definovaných textových kombinací vyšel nejméně 5,0 : 1 a silných hranic formulářů nejméně 3,0 : 1; nejde však o náhradu kontroly každé výsledné komponenty v prohlížeči.
- Lokální Chrome 155: fronta v obou motivech a šířkách 375/1440 px, světlá fronta také v 768 px; detail, výsledkový formulář a potvrzení ve světlém desktopu a tmavém mobilu, detail/formulář navíc v opačných motivech a tmavém tabletu. Při těchto průchodech nebyl zjištěn horizontální přetečení stránky. Nejde o moderovaný uživatelský ani screen-reader test.
- Browser průchod potvrdil zachování hledání/zdroje/stavu při cestě Proces → fronta a po refreshi, obnovu pohledu bez otevřeného dialogu, globální naléhavost při prázdném výběru, postupný Escape, inertní spodní dialog, smyčku Tab/Shift+Tab a návrat focusu na nadpis, když výsledek kontakt z filtru odstraní. Přepnutí motivu přetrvalo refresh. Při emulaci omezeného pohybu a průhlednosti byla vypnutá animace a blur.
- Tabletní kontrola odhalila prosvítání obsahu přes sticky hlavičku dlouhého formuláře; neprůhledný hlavičkový token to odstranil a výsledná obrazovka byla znovu zkontrolována.
- Čtyři srovnávací PNG fronty a detailu v obou motivech byly pořízeny z lokálního produkčního buildu do `artifacts/digital-call-visual-qa/`. Nejde o finální portfoliový capture.

## Co ještě ověřeno není

- Moderované testování s cílovými uživateli.
- Srozumitelnost zdrojových intervalů proti původnímu zadání.
- Reálný výkon v provozu, týmová synchronizace a integrace.
- Obchodní dopad, rychlost práce nebo snížení chybovosti.
- Úplná kombinatorická kontrola všech stavů v každém motivu a viewportu a průchod asistivní technologií; test focusu v Chrome nenahrazuje screen reader.
- Osm plánovaných finálních screenshotů pro case study nevzniklo; čtyři kontrolní snímky produkčního buildu nenahrazují kompletní scénář.
- Přesný checklist pro osm desktop/mobile exportů je připravený v `artifacts/digital-call-portfolio/capture-checklist.md`; obrazová část zůstává nedokončená a checklist není vydáván za provedený capture.

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
