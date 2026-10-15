# Digital Call – capture checklist

## Stav exportu

Obrazová část je **nedokončená**. V implementačním prostředí nebyl 13. 10. 2026 dostupný řízený browser, proto nevznikly žádné PNG soubory. Tento checklist je přesný podklad pro pozdější reprodukovatelný capture; produkční pravidla ani dataset se kvůli němu nemění.

## Zdroj a fixture

- Výchozí source commit: `ed0c3e4d7f52f0c76e2c4358c911a93e54521a4c` plus lokální vizuální iterace čekající na review.
- Datum checklistu: 13. 10. 2026.
- Motiv: light.
- Desktop viewport: `1440 × 1000`.
- Mobile viewport: `375 × 812`.
- Doplňková QA šířka bez exportu: `768 px`.
- Čas scénáře: `2026-10-13 12:00:00 Europe/Prague` (`2026-10-13T10:00:00.000Z`).
- Kontakt pro navazující scénář: Anna Novotná · Byt 3+kk · Praha 7.
- Před prvním capture vyčistit `obvolavani-portfolio-demo-v2` z `localStorage` a `obvolavani-portfolio-ui-v1` ze `sessionStorage`, nastavit `digital-call-theme=light` a stránku znovu načíst.
- Čas zmrazit pouze browser fixturem před načtením aplikace, například přepsáním `Date.now()` na výše uvedený timestamp. Neupravovat produkční časovou logiku ani seed data.

Při tomto čase je Anna ve zmeškaných úkolech a ve skupině Dnes zůstávají budoucí aktivity, takže fronta ukazuje obě požadované časové situace.

## Požadované soubory

### `queue-desktop.png`

- Viewport `1440 × 1000`, light motiv.
- Výchozí pohled „Dnes / K řešení“ po resetu.
- V záběru musí být globální souhrn, skupina Zmeškané s Annou a alespoň začátek skupiny Dnes s budoucí aktivitou.
- Bez otevřeného dialogu a bez DevTools.

### `queue-mobile.png`

- Viewport `375 × 812`, stejný stav dat jako desktop.
- Zachytit hlavičku, pravdivý globální souhrn a řádek Anny ve skupině Zmeškané.
- Ověřit, že stránka nemá horizontální overflow.

### `detail-desktop.png`

- Viewport `1440 × 1000`.
- Otevřít Annu z fronty.
- Zachytit celý viditelný detail: důvod naléhavosti, kontext, hlavní akci a příští krok.

### `detail-mobile.png`

- Viewport `375 × 812`.
- Stejný detail Anny, panel od horní hrany, čitelná hlavní akce.
- Nechat obsah v přirozené mobilní šířce bez umělého oddálení.

### `outcome-desktop.png`

- Viewport `1440 × 1000`.
- V detailu Anny otevřít „Zaznamenat výsledek hovoru“.
- Ponechat vybrané „Nedovoláno“ a přesné doporučení; bez validační chyby.
- Zachytit vnořený výsledkový formulář včetně voleb a dalšího termínu.

### `outcome-mobile.png`

- Viewport `375 × 812`.
- Stejný formulář a volba; zachytit jeho horní část a hlavní rozhodovací obsah.
- Před exportem ověřit, že dialog scrolluje uvnitř viewportu a spodní obsah je dosažitelný.

### `confirmation-desktop.png`

- Viewport `1440 × 1000`.
- Pro Annu uložit výsledek „Nedovoláno“ s přesným doporučením a bez poznámky.
- Zachytit potvrzení v detailu s novým stavem „Volat později“, přesným dalším krokem a akcí „Zpět do fronty“.

### `confirmation-mobile.png`

- Viewport `375 × 812`.
- Stejný potvrzený stav Anny.
- V záběru musí být celé potvrzení, nový stav/další krok a tlačítko návratu.

## Kontrola před předáním

- Všech osm názvů souborů odpovídá checklistu přesně.
- Screenshoty neobsahují skutečné osobní údaje, kurzor, DevTools ani browser chrome, pokud není záměrně součástí výřezu.
- Desktop a mobile v každém páru používají stejný stav scénáře.
- Po capture výsledku znovu nespouštět reset mezi `outcome-*` a `confirmation-*`; potvrzení musí navazovat na stejnou Annu.
- Ručně projít i šířku `768 px`, light/dark, Tab, Shift+Tab a postupné Escape. Tento průchod je QA, nikoli náhrada chybějících PNG souborů.
