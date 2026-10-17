# Digital Call — ověřitelné podklady pro case study

Základ: aktuální lokální verze navazující na commit `6beb07ef78f6772324badb073f52586028c36dc5`; syntetická data. Technické kontroly níže **nejsou** uživatelský výzkum ani měření dopadu.

## A. Pracovní fronta napříč procesními stavy

- **Co lze doložit:** aktivní kontakty z různých procesních stavů se zobrazují v jedné časově řazené frontě; naléhavost se počítá z celé aktivní fronty, zatímco hlavní akce respektuje aktuální filtry.
- **Kód a test:** [`queueLogic.ts`](../../components/calling/queueLogic.ts) — `getActiveQueueContacts`, `getQueueGroup`, `sortQueueContacts`, `getFirstAttentionContact`, `getQueueSummary`; [`TodayView.tsx`](../../components/calling/TodayView.tsx) — seskupení a hlavní akce; [`queueLogic.test.ts`](../../components/calling/queueLogic.test.ts) — filtr, globální souhrn a první naléhavý kontakt.
- **Reprodukce:** otevřít čerstvé demo při 12. 10. 2026 13:00 Praha. Ve frontě jsou prošlé hovory i schůzka a zvlášť dvě budoucí dnešní aktivity. Vyhledat „Jana Benešová“: celková naléhavost zůstane, ve výběru je 0 naléhavých a panel nabídne návrat k celé frontě.
- **Skutečný výsledek:** browser capture [`queue-desktop.png`](queue-desktop.png) ukazuje 4 prošlé a 2 budoucí dnešní úkoly. Regresní testy fronty prošly; při aktuálním capture scénáři mělo pouhé otevření Annina detailu a formuláře stále právě jeden předchozí pokus.
- **Omezení:** prioritizace je deterministické pravidlo nad syntetickými kontakty; není doloženo, že makléřům zrychluje práci.

## B. Kontext dostupný před hlavní akcí

- **Co lze doložit:** detail před záznamem výsledku ukazuje důvod pozornosti, nemovitost, lokalitu, zdroj, poslední interakci, historii a příští krok. Samotné otevření detailu ani formuláře nezapisuje nový hovor.
- **Kód a test:** [`ContactDetail.tsx`](../../components/calling/ContactDetail.tsx) — `primaryAction`, bloky „Proč teď?“, „Kontext před akcí“ a „Historie“; [`stateLogic.ts`](../../components/calling/stateLogic.ts) — `getAttemptCount` a `recordCallOutcome`; [`stateLogic.test.ts`](../../components/calling/stateLogic.test.ts) — pokus vzniká až po přijatém výsledku.
- **Reprodukce:** z fronty otevřít Annu Novotnou a potom „Zaznamenat výsledek hovoru“, ale nic neodesílat.
- **Skutečný výsledek:** [`detail-desktop.png`](detail-desktop.png) a [`detail-mobile.png`](detail-mobile.png) ukazují kontext před pracovním tlačítkem; [`outcome-desktop.png`](outcome-desktop.png) a [`outcome-mobile.png`](outcome-mobile.png) ukazují navazující formulář. V izolovaném browser profilu měla Anna po pouhém otevření stále jeden předchozí pokus.
- **Omezení:** přítomnost kontextu na obrazovce nedokazuje, že je jeho pořadí optimální nebo že zlepšuje rozhodnutí reálných uživatelů.

## C. Oddělení přesunu, výsledku hovoru a dalšího termínu

- **Co lze doložit:** přesun stavu nepřidává pokus, samostatné plánování nemění procesní stav a přijatý výsledek hovoru přidá právě jeden pokus s historií. Odmítnutá operace nesmí vyvolat úspěšné potvrzení ani zavření formuláře.
- **Kód a test:** [`stateLogic.ts`](../../components/calling/stateLogic.ts) — `moveContact`, `scheduleActivity`, `recordCallOutcome`, `applyBoardOperation`; [`useCallingBoardState.ts`](../../components/calling/useCallingBoardState.ts) — synchronní výsledek změny mimo React updater; [`CallingModuleLayout.tsx`](../../components/calling/CallingModuleLayout.tsx) — feedback ze skutečně přijatého kontaktu; [`stateLogic.test.ts`](../../components/calling/stateLogic.test.ts) — platný termín, vypršení termínu/doporučení, jediný pokus a oddělené efekty.
- **Reprodukce:** u Anny otevřít výsledek „Nedovoláno“, přidat poznámku, nechat doporučený termín uplynout a potvrdit. Formulář zůstane otevřený bez nového pokusu; obnovit doporučení a potvrdit znovu. Potom v detailu otevřít „Upravit termín“, nechat jej uplynout, opravit a potvrdit.
- **Skutečný výsledek:** browser při odmítnutí ponechal poznámku i oba dialogy a počet pokusů 1. Po opravě se dialog výsledku zavřel, v historii přibyl jeden pokus (celkem 2), stav se změnil na „Volat později“ a další hovor byl 12. 10. 2026 14:01. Prošlý termín v plánovacím formuláři nezměnil stav ani historii; oprava na 14:30 přidala jednu plánovací událost, stav zůstal „Volat později“ a pokusů zůstalo 2. Testy/doménové operace jsou bez backendu.
- **Omezení:** přijetí znamená změnu v paměti prohlížeče, nikoli garantovaný zápis na disk. Při chybě `localStorage` aplikace dál pracuje v paměti a zobrazuje samostatné upozornění. Neproběhl test s makléři ani integrace se skutečnou telefonií.

## Dohledaný původní prototyp

Commit `0deaacd` (`Aktualizace: Kanban logika, layout`) obsahuje původní [`CallingModuleLayout.tsx`](https://github.com/DP8778/digital_call_module/blob/0deaacd/components/calling/CallingModuleLayout.tsx) s pracovní plochou Backlog + Kanban bez dnešní fronty. V původním [`useCallingBoardState.ts`](https://github.com/DP8778/digital_call_module/blob/0deaacd/components/calling/useCallingBoardState.ts) funkce `applyTiparCallLaterGraceElapsed` (okolo řádku 79, navýšení `attemptCount` na řádku 93) a `moveContactBetweenColumns` (okolo řádku 122) přímo spojovaly čas či přesun s počtem pokusů. Jde o doložený stav historického kódu, nikoli o doloženou motivaci původního autora.
