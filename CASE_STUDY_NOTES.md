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

- Původní Glass návrh používal průsvitnou navigační a ovládací vrstvu se světlou hranou a měkkým stínem; obsahová vrstva zůstala neprůhledná.
- Pozdější iterace zesílila materiál navigace a dialogového shellu tónovaným podkladem a 22–24px blur. Formulářová těla zůstala neprůhledná.
- Citronovo-grafitová iterace používala `#DFFF3F` také v monogramu, aktivním pohledu, výběru a orientačních značkách. Neutrálně šedá iterace pak omezila žlutou na hlavní nedestruktivní akci a oddělila stavové významy.
- Předchozí bílá iterace spojila dvě horní lišty do jediné hlavičky. Světlé pozadí i obsah jsou bílé, filtry nemají vnější kartu ani stín a řádky oddělují jemné linky. Reset je u nadpisu pracovního pohledu, aktivní filtry v jeho obsahu. Tmavý motiv používá stejnou strukturu se samostatnými tokeny.
- Předchozí monochromatická iterace ponechala limetkovou `#DFFF3F` jako akcent hlavní pracovní akce, úzký indikátor výběru a plochu nedestruktivního potvrzení formuláře. Pracovní tlačítko je grafitové, sekundární má jemný neutrální přechod a menší stín, doplňkové je textové; destruktivní má silnější obrys, výstražnou ikonu a explicitní následek. Jejich společná konstrukce používá 15px zaoblení, horní odlesk a vnitřní hranu.
- Předchozí barevná iterace přidala pouze časové sémantice malinovou (po termínu) a jantarovou (připravený hovor nebo chybějící další krok). Celková naléhavost má samostatné počty prošlých aktivit a připravených hovorů; budoucí dnešní plán zůstává neutrální. Strukturovaný prezentační helper vychází ze skutečné skupiny, stavu a termínu, nikoliv z parsování textu. Bílé řádky, neutrální procesní štítky a limetkový indikátor výběru zůstaly zachované. V detailu je výraznější jen první blok prošlé aktivity, další krok nese kratší barevné upozornění na neutrálním podkladu.
- Aktuální iterace seskupuje globální souhrn do jediného uhlového panelu s limetkovou akcí. Hlavní akce otevře první naléhavý kontakt v pořadí skutečně viditelné fronty a respektuje aktivní filtry; otevření samo nezapisuje pokus. Filtry jsou ve světlém zapuštěném pásu, kontaktní řádky používají krátký důvod s ikonou bez opakovaných barevných pilulek. Sdílená limetková a sekundární tlačítka mají jemnější prostorovou modelaci; úspěch má samostatnou zelenou. Rozpad a prázdný výběr vycházejí pouze z existujících pravidel a syntetických dat.
- Vlastní textové třídy používají prefix `dc-`, takže sekundární text nekoliduje s Tailwind tokenem pro muted povrch. Statický výpočet konkrétních kombinací text/podklad dává ve světlém motivu malinové 5,06 : 1 a jantarové 5,50 : 1; v tmavém 7,76 : 1 a 8,27 : 1. Nejde o audit všech stavů ani o test s asistivní technologií.
- Detail kontaktu má kompaktnější status, přirozeně vysoké kontextové karty, dominantní pracovní akci a oddělenou plochu dalšího kroku. Vedlejší povolené přesuny jsou v přístupném rozbalovacím bloku „Další změny stavu“; pravidla i potvrzení rušící aktivitu zůstala zachována. Kontextový formatter zobrazuje termín právě jednou a zachovává sekundy tam, kde jsou součástí pravidla.
- Světlý i tmavý motiv mají samostatné sémantické tokeny; tmavý režim není globální inverze. Přepínač je skutečně zapojený, explicitní preference se aplikuje před hydratací a při selhání zápisu motiv dál funguje v paměti.
- Fronta zachovává husté řádky, ale zvýrazňuje současnou prioritu, aktivní filtry a zmeškanou skupinu textem i hranou.
- Kanban má na úzkém viewportu lokalizovaný horizontální scroll, takže šest sloupců neroztahuje celou stránku.
- Dialogy mají kouřový glass shell s jedinou rozostřenou vrstvou; formuláře, potvrzení, chyby a historie používají stabilní neprůhledné obsahové plochy.
- Reset dema používá vlastní potvrzovací dialog se stejnou vizuální a přístupnostní strukturou místo nestylovatelného systémového potvrzení.
- Fallbacky pokrývají chybějící blur, omezenou průhlednost, vyšší kontrast, forced colors a omezený pohyb.

## Popis dema

Výchozí dataset obsahuje aktivní dnešní hovory, zmeškaný hovor, dnešní a zmeškanou schůzku, budoucí follow-up, nové kontakty v zásobníku i koncové případy. Uživatel může hledat, filtrovat, otevřít detail, zaznamenat výsledek, upravit další aktivitu, změnit povolený stav, stránku obnovit a pokračovat.

## Co bylo skutečně ověřeno

- Iterace tmavého pracovního panelu (17. 10. 2026) prošla 35/35 testy v 5 souborech, TypeScriptem, ESLintem a produkčním buildem. Nové testy pokrývají první naléhavý kontakt podle pořadí fronty, aktivní filtr, prázdný a nenaléhavý výběr, vyloučené koncové stavy a přednost prošlého termínu před připraveným hovorem. V lokálním Chrome 155 nad produkčním buildem byly vizuálně zkontrolovány oba motivy na 1440 a 375 px, tmavý detail a výsledkový formulář; při 320/375/1440 px nevznikl vodorovný přetok. Hlavní tlačítko otevřelo první řádek bez změny uložených dat, aktivní nenaléhavý filtr nabídl návrat k celé frontě, Escape vrátil focus na řádek a Tab/Shift+Tab zůstaly v horním dialogu. Izolované browser fixtury ověřily také skutečnou nulu (deaktivovaná akce) a rozpad 1 prošlý / 1 připravený / 1 budoucí dnešní úkol; původní syntetický stav byl vrácen. Statický výpočet vybraných dvojic dává bílému textu na světlém konci panelu 13,36 : 1, tmavému textu na nejslabším konci limetkového tlačítka 14,28 : 1, malinovému textu na bílém řádku 5,55 : 1 a zelenému úspěchu na vlastním podkladu 6,65 : 1. Nejde o úplný kontrastní audit, screen-reader test ani moderované testování.
- Předchozí barevná hierarchie (17. 10. 2026) prošla 32/32 testy v 5 souborech, TypeScriptem, ESLintem a produkčním buildem. Nové testy ověřují rozpad globální naléhavosti na prošlé aktivity a připravené hovory při jiném filtrovaném výběru i strukturované varianty prošlého, dnešního budoucího, pozdějšího a nenaplánovaného kontaktu. V lokálním Chrome 155 byly zkontrolovány světlá desktopová fronta s výchozí převahou prošlých termínů a detail, syntetická kombinace prošlých, připravených a budoucích dnešních úkolů, tmavá mobilní fronta a detail; hover i výběr ponechaly malinový štítek odlišný od limetkového indikátoru. Izolovaná browser fixture upravila pouze data v úložišti pro kontrolu kombinace stavů, ne produkční pravidla. Nejde o moderovaný test ani úplný audit přístupnosti.
- Automatické testy čisté logiky: povolený i zakázaný přesun, vznik pokusu, plánování bez změny stavu, zákaz plánování v koncovém stavu, auditované zrušení aktivity, validace minulého termínu, přesné krátké doporučení, jednorázová expirace a obnova uloženého dema.
- Automatické testy řazení fronty: dnešní prošlý termín, budoucí dnešní termín, hranice půlnoci a české tvary počtů.
- Automatické testy pražského času včetně půlnoci a změn letního/zimního času.
- Automatické testy navíc pokrývají celkovou naléhavost mimo aktivní filtr, validaci uloženého UI výběru, čtyři výsledky čtení persistence a výjimky při čtení, zápisu a resetu úložiště.
- Regresní test ověřuje, že chyba `getItem` nad předexistujícím validním stavem zakáže automatický zápis: následná práce v paměti nevolá funkční `setItem` a původní serializovaný stav zůstane beze změny. Samostatně je pokryto platné čtení se selháním `setItem` a vědomý reset po chybě čtení.
- Automatické testy pokrývají také kontextový termín bez duplikace a zachování sekund.
- TypeScript (`tsc --noEmit`), ESLint a produkční Next.js build prošly bez chyby.
- Lokální vývojový server ve smoke testu vrátil HTTP 200 a správný titul stránky.
- Vizuální redesign nezměnil čistou stavovou logiku, časová pravidla ani datové typy.
- Předchozí citronovo-grafitová iterace prošla 30/30 testy, TypeScriptem, ESLintem a produkčním buildem. Tehdejší kontrastní výpočet se na současnou paletu nevztahuje.
- Lokální Chrome 155: fronta v obou motivech a šířkách 375/1440 px, světlá fronta také v 768 px; detail, výsledkový formulář a potvrzení ve světlém desktopu a tmavém mobilu, detail/formulář navíc v opačných motivech a tmavém tabletu. Při těchto průchodech nebyl zjištěn horizontální přetečení stránky. Nejde o moderovaný uživatelský ani screen-reader test.
- Browser průchod potvrdil zachování hledání/zdroje/stavu při cestě Proces → fronta a po refreshi, obnovu pohledu bez otevřeného dialogu, globální naléhavost při prázdném výběru, postupný Escape, inertní spodní dialog, smyčku Tab/Shift+Tab a návrat focusu na nadpis, když výsledek kontakt z filtru odstraní. Přepnutí motivu přetrvalo refresh. Při emulaci omezeného pohybu a průhlednosti byla vypnutá animace a blur.
- Tabletní kontrola odhalila prosvítání obsahu přes sticky hlavičku dlouhého formuláře; neprůhledný hlavičkový token to odstranil a výsledná obrazovka byla znovu zkontrolována.
- Čtyři archivní PNG v `artifacts/digital-call-visual-qa/` ukazují předchozí paletu, nikoli současný redesign. Nejde o finální portfoliový capture.
- Neutrálně šedá iterace (16. 10. 2026) prošla 30/30 testy, TypeScriptem, ESLintem a produkčním buildem. Statický výpočet vybraných nových dvojic dává sekundárnímu textu na vnitřní ploše 5,50 : 1 ve světlém a 6,53 : 1 v tmavém motivu; silná hrana na vybrané ploše má 3,24 : 1 a 3,25 : 1. Nejde o automatický audit všech kombinací.
- Lokální Chrome 155 nad produkčním buildem: oba motivy na desktopu 1440 px a mobilu 375 px, fronta i detail, vybraný prošlý kontakt, zelené potvrzení, stavy Nabraná nemovitost/Vyřazeno, červená destruktivní volba, chybné pole, aktivní i prázdný filtr, vnořený dialog a Tab/Shift+Tab/Escape. Při 320 px a textu 125 % nebyl zjištěn horizontální přetok; skutečný focus žlutého tlačítka a chybného pole byl po opravě ověřen samostatně. Neproběhl moderovaný test s makléři ani screen-reader audit.
- Předchozí bílá iterace prošla 30/30 testy, TypeScriptem, ESLintem a produkčním buildem. V lokálním Chrome 155 byla ověřena jediná hlavička a bílé plochy na 1440/375 px, sticky poloha se slabým stínem až při scrollu, tmavý motiv a 320 px při textu 125 % bez horizontálního přetoku. Aktivní filtry přežily přepnutí na Proces, potvrzovaný reset vrátil výchozí frontu, Escape zavřel jen vnořený formulář, focus se vrátil na řádek a chybné pole i navigace měly viditelný klávesnicový obrys. Jde o technickou kontrolu, nikoli o uživatelský nebo screen-reader test.
- Monochromatická iterace (17. 10. 2026) prošla 30/30 testy, TypeScriptem, ESLintem bez upozornění a produkčním buildem. V lokálním Chrome 155 nad vývojovým serverem byly vizuálně zkontrolovány světlá fronta a detail na 1440 px, formulář a chyba na 375 px, tmavá fronta na 1440 px a detail na 320 px; při 320/375/1440 px nevznikl horizontální přetok stránky. Vnořený formulář měl inertní spodní detail, Tab/Shift+Tab se vracel v dialogu, postupné Escape vrátilo focus na pracovní akci a pak na řádek; v zavřeném rozbalovacím bloku se skrytá tlačítka nezapočítávají do focus trapu. Ověřeny byly také CSS stavy hover/pressed/disabled formulářového potvrzení, monochromatická chybová zpráva s `aria-invalid`, potvrzení zrušení aktivity bez limetkové výplně a zachování všech tří filtrů při přepnutí na Proces i po refreshi. Nejde o moderovaný test s makléři, audit screen readerem ani úplný kontrastní audit.

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
