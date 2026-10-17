# Digital Call — manifest obrazových podkladů

- Pořízeno: 17. 10. 2026 v lokálním Chrome 155.0.8059.84 nad produkčním buildem (`npm run build`, `next start`).
- Zdrojový commit: `6beb07ef78f6772324badb073f52586028c36dc5` na `feat/liquid-glass-redesign`. Snímky zachycují také **necommitnutou** opravu potvrzování operací v `CallingModuleLayout.tsx`, `OutcomeModal.tsx`, `ScheduleModal.tsx`, `StatusChangeModal.tsx`, `ContactDetail.tsx`, `useCallingBoardState.ts`, `stateLogic.ts` a `types.ts`. Nejde tedy o obraz samotného zdrojového commitu.
- Scénář: izolovaný čistý profil prohlížeče; syntetický výchozí dataset; `Date.now()` jen v tomto capture profilu fixováno na **12. 10. 2026 13:00 Europe/Prague** (`2026-10-12T11:00:00Z`). Produkční pravidla ani seed data nebyla kvůli snímkům změněna.
- Motiv: světlý ve všech šesti snímcích. Desktop: **1440 × 1000 px**; mobil: **375 × 812 px**. Snímky jsou výstupem stránky bez browser chrome a DevTools.
- Společná návaznost: fronta → detail kontaktu **Anna Novotná, Byt 3+kk, Praha 7** → otevřený formulář „Zaznamenat výsledek“. Otevření detailu ani formuláře samo nevytvořilo nový pokus; Anna má na snímcích jeden předchozí syntetický pokus.

| Soubor | Co ukazuje |
| --- | --- |
| `queue-desktop.png` | Celou pracovní frontu s tmavým ovládacím panelem, 4 prošlými a 2 dnešními budoucími úkoly. |
| `queue-mobile.png` | Mobilní přeskupení panelu, filtrů a začátku zmeškaného seznamu; stránka je posunutá o 150 px kvůli společnému výřezu. |
| `detail-desktop.png` | Annin důvod pozornosti, kontext, historii, hlavní akci a příští krok. |
| `detail-mobile.png` | Stejný detail na úzkém viewportu s čitelnou hlavní akcí. |
| `outcome-desktop.png` | Annin výsledkový formulář včetně možností, doporučení, poznámky a potvrzovacího tlačítka. |
| `outcome-mobile.png` | Stejný formulář na mobilu; spodní část se potvrzuje po scrollu uvnitř dialogu. |

Tyto snímky dokumentují podobu a syntetický scénář, nikoli test použitelnosti s makléři. Nezobrazují pozdější opravný průchod po expiraci doporučení.
