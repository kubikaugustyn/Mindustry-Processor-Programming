# Pokus 1

## 🛠 Řízení jednotek

1. Posílej těžební jednotky těžit uran, jen když je spotřeba vyšší než produkce.
2. Hlídkuj v oblasti a při výskytu nepřítele aktivuj obranné jednotky.
3. Tvoř konvoje – jednotky přepravují suroviny mezi body A–B.
4. Poškozené jednotky automaticky odesílej na opravu.
5. Střílej na nejbližšího nepřítele, s prioritou podle typu (např. nejdřív bombardéry).

## ⚙️ Logistika a materiály

1. Pokud má zásobník jádra málo munice, automaticky zajisti přísun.
2. Přesměrovávej suroviny podle potřeby (např. měď do zbraní vs. výroby).
3. Aktivuj výrobu, jen pokud je dostatek vstupních surovin.
4. Přepínej směr rotátorů na pásech podle stavu výroby.
5. Vytvoř záložní sklad – když je hlavní plný, přesměruj materiál jinam.

## 🔍 Senzory a hlídání

1. Pokud energie v baterkách klesne pod 20 %, vypni těžkou výrobu.
2. Zapni alarm (např. výstražný světelný signál), když je základna pod útokem.
3. Když je málo munice v obranných věžích, spusť výrobu.
4. Sleduj zdraví jádra a při poškození přesměruj jednotky na obranu.
5. Měř efektivitu výroby – kolik materiálu přichází vs. kolik se zpracuje.

## 🧱 Logika budov

1. Zapínej/vypínej vrtáky podle teploty nebo aktuální spotřeby.
2. Výrobu plastu aktivuj, jen když je dost uhlíku a ropy.
3. Aktivuj přepínače pro hráče – režim „ekonomika vs. obrana“.
4. Při nedostatku vody automaticky odpojuj chlazení továren.
5. Umožni manuální řízení produkce v UI – např. kolik čeho vyrábět.

## 📺 Displej a ovládání

1. Vytvoř vlastní HUD – energie, materiály, obranný stav.
2. Zobraz mapu s pozicí nepřátel – alespoň vektorově.
3. Ovládací panel: tlačítka pro módy základny.
4. Graf produkce a spotřeby za poslední minuty.
5. Displej s „továrním dashboardem“ – co běží, co je vypnuté, co chybí.

# Pokus 2

## 🔁 Automatické přepínání výroby

Režim „výrobní plánovač“

- Sleduj sklad surovin a podle přebytků automaticky přepínej, co se vyrábí (např. když je dost křemíku, začni dělat
  metaglass).
- Kombinuj to s prioritama – např. nejdřív munice, pak výstavba, nakonec export.

## 🧨 Dynamické zaměření obrany

Chytrý targeting obranných věží

- Když je na mapě víc druhů nepřátel, přepínej věže podle priority – např. Scorches? Přepni na vodní munici. Letadla?
  Zapni flak.
- Můžeš mít hlídací procesor, co čte nejbližší jednotky a aktivuje jiné zbraně.

## 🚧 Chytré stavění

Asistovaný builder systém

- Když je aktivní stavba a suroviny chybí, automaticky posílej zboží na místo stavby.
- Dalo by se udělat tak, že AI buildery dostávají signál, kam jít a co nést.

## 🔄 Dopravní management

Pásový manažer přetížení

- Sleduj, když se pásy plní/zasekávají a automaticky přesměruj proud na alternativní cestu.
- Např. jestliže měďák se valí a zásobník je plnej – otoč rotátor, převeď jinam.

## ☢️ Nouzové protokoly

Failsafe systém

- Pokud core má <20 % HP nebo je pod masivním útokem, zapni krizový mód:
    - vypni výrobu
    - přesměruj jednotky do obrany
    - aktivuj štíty nebo repair pole
    - zapni červená světla a sirény 😄

## 📦 Exportní ekonomika

Automatizovaný vývozní přepínač

- Pokud je nadbytek surovin (např. >5k titanium), automaticky aktivuj export do core nebo do launch padu.
- Priorita: exportuj jen přebytky, nenech výrobu bez zásob.

## 📈 Výrobní balancer

Poměr výroby vs. spotřeby

- Sleduj tok materiálu: kolik železa přichází na vstup a kolik odchází do továren.
- Když výroba žere víc než příjem, zpomal pásy, vypni část továren nebo uprav vstupy.

# Pokus 3

## 🔧 Jednotky a obrana

1. Pošli jednotky na patrolu jen když je klid – jinak ať zůstávají u core.
2. Automaticky svolávej jednotky do obrany při útoku.
3. Rozděl jednotky do skupin podle typu (např. flak, ground) a používej je samostatně.
4. Sleduj počet jednotek a při ztrátách začni výrobu nových.
5. Přepni jednotkám cíl na „follow player“, pokud zadáš signál z UI.
6. Pošli bombardéry jen když je detekována hromada pozemních nepřátel.
7. Skenuj nepřátele – když je boss, aktivuj „obranný mód“.
8. Pokud je nepřítel poblíž vrtáků, pošli tam obranu.
9. Vypni pasivní obranu (např. mrazáky), pokud se neútočí.
10. Přesměruj jednotky na čistku zbývajících nepřátel po vlně.

## ⚙️ Výroba a logistika

11. Aktivuj výrobu munice jen při poklesu zásob v core.
12. Přepínej priority ve výrobě (např. munice > výstavba > export).
13. Sleduj přítok surovin a optimalizuj, kolik továren běží.
14. Automaticky posílej uhlík z několika těžíren do jedné centrální výroby plastu.
15. Vypni výrobu, pokud je spotřeba energie moc vysoká.
16. Když core přetéká mědí, pošli ji do výroby nábojů.
17. Když se zvyšuje produkce vody, aktivuj více cryo chladících věží.
18. Vytvoř přepínač – aktivuj různé části výrobních bloků na tlačítko.
19. Pokud nejsou suroviny pro výrobu jednotek, vypni assemblery.
20. Zapínej/vypínej vrtáky podle zásob dané suroviny.

## 🔄 Doprava a pásy

21. Automaticky přepínej směr rotátorů podle zaplněnosti pásu.
22. Pokud je overflow na výstupu z továrny, přesměruj na alternativní sklad.
23. Sleduj, zda materiál dorazil na požadované místo – pokud ne, aktivuj alarm.
24. Přepínej junctiony podle priority dopravy.
25. Když je příliš železa na pásu, zablokuj přísun a přesměruj na jiný sklad.
26. Pásový diagnostický systém – sleduj rychlost toku a zjisti, kde je bottleneck.
27. Dynamické přepínání pásů na základě vytížení skladů.
28. Automatický přepínač směru dopravních zón podle stavu výroby.
29. Když je někde úplně prázdno, posílej suroviny z přebytků.
30. Na výpadek jedné trasy okamžitě aktivuj záložní trasu.

## 🔋 Energie

31. Vypni těžké budovy při nedostatku energie.
32. Aktivuj soláry vs. spalováky podle denní doby (pokud to mapy umožňují).
33. Sleduj stavy baterií – pokud < 20 %, omez zbytečné spotřebiče.
34. Pokud mají baterie víc než 90 %, přesměruj přísun do produkce.
35. Přepínej typy reaktorů (např. thorium vs. spalovák) podle zásob.
36. Při přetížení aktivuj záložní bateriové pole.
37. Logika pro nabíjení launch padu – jen když je dost energie.
38. Omez výrobu jednotek při kritickém stavu energie.
39. Automaticky řiď proud v síti – upřednostni obranu.
40. Pokud výroba energie stagnuje, aktivuj nouzový mód.

## 🖥️ UI a hráčská kontrola

41. Tlačítko „obranný mód“ – okamžitě vypne výrobu a aktivuje všechny věže.
42. Tlačítko „výrobní mód“ – priorita suroviny do továren.
43. Displej – kolik se těží, kolik se vyrábí, kolik se spotřebuje.
44. Mapa – základní vizualizace toku surovin.
45. Graf energie za poslední minuty.
46. Indikátor přetížení pásů nebo plnosti core.
47. Vizuální signál při aktivaci alarmu (červené světlo atd.).
48. Možnost ručně zadat cíl pro jednotky (koordináty z UI).
49. Automatický log – posledních 10 událostí (útok, přepnutí, nedostatek atd.).
50. Přehled „co nefunguje“ – třeba vypnuté továrny nebo neaktivní vrtáky.
