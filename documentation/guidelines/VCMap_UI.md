# VC Map UI / UX

## Inhaltsverzeichnis

1. [Allgemeine Grundsätze](#allgemeine-grundsaetze)
2. [Tooltips](#tooltips)
   - [Allgemeine Grundsätze Tooltips](#allgemeine-grundsaetze-tooltips)
   - [Aufbau](#aufbau)
   - [Fall: Clickbare Icons /Buttons ohne Text (nebenstehend)](#fall-clickbare-icons-oder-buttons-ohne-text)
   - [Fall: Rein textbasierte Menüeinträge + Kombinierte Menüeinträge Icon & Text](#fall-rein-textbasierte-menueeintraege-und-kombinierte-menueeintraege-icon-und-text)
   - [Fall: Texte werden aufgrund von Platzmangel abgeschnitten](#fall-texte-werden-aufgrund-von-platzmangel-abgeschnitten)
   - [Fall: Tooltip - Fehlermeldung](#fall-tooltip---fehlermeldung)
3. [Text / Ansprache](#text-und-ansprache)
   - [Allgemeine Grundsätze Text / Ansprache](#allgemeine-grundsaetze-text-und-ansprache)
   - [Fall: Platzhaltertexte](#fall-platzhaltertexte)
   - [Fall: Label)](#fall-label)
   - [Fall: Fehlermeldungen](#fall-fehlermeldungen)

## Allgemeine Grundsaetze

- **Zielgruppe der Kartenanwendung:** Nicht-Fachnutzer ohne GIS- und
  erweiterten Sprachhintergrund

- **Sprache:** es kann nicht von Mehrsprachigkeit oder Fachsprache ausgegangen werden =\>
  Denglish vermeiden (v.a. im Deutschen sollten geeignete
  deutschsprachige Bezeichnungen verwendet werden) =\> Tools, Texte,
  Label, etc. eindeutig und sinnvoll übersetzen  
  Bsp. <span style="color:red">Tool</span> \--\> <span style="color:green">Werkzeug,</span> <span style="color:red">Extent</span> \--\> <span style="color:green">Ausdehnung,</span> <span style="color:red">Layer</span> \--\> <span style="color:green">Ebene</span>

## Tooltips

### Allgemeine Grundsaetze Tooltips

- Gleiche Funktionen UI-übergreifend mit einheitlichen Tooltips versehen
  (Wortwahl)

- Unterschiedliche Funktionen nicht mit dem gleichen Tooltip beschreiben

- Der Tooltip sollte vom Umfang her nicht mehr als einen kurzen
  aussagekräftigen Satz umfassen

- Tooltips werden so formuliert, dass sie möglichst statisch
  funktionieren \--\> Tooltips sind zustandslos!

> _Bsp. <span style="color:green">\"Schatten simulieren\"</span> anstatt <span style="color:red">\"Schattentool öffnen\"</span>_
>
> **Eine mögliche Ausnahme davon könnte Show/Hide auf Auge sein**

- Checkbox ist ein gewohntes UI Element und benötigt keinen Tooltip

### Aufbau

<span style="text-decoration:underline">**Regel:**</span> **\<Objekt\> + \<Aktion\>**

<span style="color:red">**Die Aktion sollte ebenfalls \"stateless\" sein und das auch so
ausdrücken.**</span>

_Beispiele:_

> _<span style="color:red">\"**(i)**\"</span> =\> <span style="color:green">\"**Informationen aufrufen**\"</span>_
>
> _<span style="color:red">\"**Header-Share**\"</span>
> =\> <span style="color:green">\"**Aktuellen Kartenausschnitt teilen**\"</span>_
>
> _<span style="color:red">\"**Drawing-Polygon**\"</span>
> =\> <span style="color:green">\"**Polygone zeichnen**\"</span>_
>
> _<span style="color:red">\"**Schattentool öffnen**\"</span>
> =\> <span style="color:green">\"**Schatten simulieren**\"</span>_

_Von **\<Objekt\> + \<Aktion\>** kann abgewichen werden, wenn kein
sinnvolles Verb / Aktion gefunden werden kann, dass eine zustandslose
Aktion ausdrückt. Wenn das Verb nur ein Füllwort ist, kann es
weggelassen werden.  
zum Beispiel folgende Abweichungen:_

> _<span style="color:green">\"Mehrfachansicht\" vs. \"Mehrfachansicht öffnen\"</span>_
>
> _<span style="color:green">\"Legende\" vs. \"Legende anzeigen\" </span>_
>
> _<span style="color:green">\"Inhalte\" =\> \"Inhalte anzeigen\" </span>_
>
> _<span style="color:green">\"Mein Arbeitsbereich\" =\> \"Mein Arbeitsbereich öffnen\" </span>_

> <span style="color:green">**Do's:**</span>
>
> ![Image](media/image1.jpeg) ![Image](media/image2.jpeg)![Image](media/image3.jpeg)

> <span style="color:red">**Dont's:**</span>
>
> <span style="color:red">\<Verb\>\<Objekt\></span>
>
> ![Image](media/image4.jpeg)
>
> <span style="color:red">Mix von \<Objekt\>+\<Aktion\></span>
>
> ![Image](media/image5.jpeg) > ![Image](media/image6.jpeg)
>
> <span style="color:red">Annahme des englischen Begriffs als Eigenname</span>
>
> ![Image](media/image7.jpeg) > ![Image](media/image8.jpeg) > ![Image](media/image9.jpeg)
>
> <span style="color:red">Verwendung des gleichen Tooltip für unterschiedliche Button:</span>
>
> ![Image](media/image10.jpeg) ![Image](media/image11.jpeg)

### Fall: Clickbare Icons oder Buttons ohne Text

**Verfügbarkeit:** verpflichtend, betrifft alle Icons die clickbar sind!

**Ausnahme:** Checkbox

> Beispiele:  
> ![Image](media/image12.png)
>
> ![Image](media/image13.png)

### Fall: Rein textbasierte Menueeintraege und Kombinierte Menueeintraege Icon und Text

**Verfügbarkeit**: optional

<span style="text-decoration:underline">**Regel:**</span> Textbasierte Menüeinträge sollten grundsätzlich selbsterklärend sein,
nur wenn eine weitere Erläuterung zum Verständnis absolut notwendig ist,
sollte ein Tooltip den Eintrag ergänzen  
**Bedingung**: Der Tooltip sollte einen echten Mehrwert bieten (d.h. das
Element / die Aktion detaillierter beschreiben) und nicht nur eine
Wiederholung des Menüeintrages sein.

\--\> Einzelfallentscheidung des Feature Managers in Anlehnung an
bestehende Tooltips

<span style="color:red">**\"Don\'t:** **\"Zoom auf Ebene\"** **=\> \"Auf Ebene zoomen**\"</span>

Beispiel: \"<span style="color:red">**Alle selektieren**\"</span> =\> <span style="color:green">**\"Alle Elemente dieser Gruppe
selektieren\" / „Select all elements of this group."**</span>

Beispiel: <span style="color:red">**\"Auf Ebene zoomen\"**</span> =\> <span style="color:green">**\"Auf die volle Ausdehnung der
Ebene zoomen\" / „Zoom to the full extent of the layer."**</span>

#### Sonderfall Kontextmenu

<span style="text-decoration:underline">**Regel:**</span> ==\> **Kein Tooltip im Kontextmenu**

### Fall: Texte werden aufgrund von Platzmangel abgeschnitten

<span style="text-decoration:underline">**Regel:**</span> Es wird der gesamte Text automatisch on hover als Tooltip angezeigt

![Image](media/image14.jpeg)

### Fall: Tooltip - Fehlermeldung

**Verfügbarkeit:** verpflichtend

<span style="text-decoration:underline">**Regel:**</span> Vollständiger Satz \--\> Fokus positiv: Was ist erforderlich, um den
Fehler zu beheben.

![Image](media/image15.jpeg)

![Image](media/image16.jpeg)

## Text und Ansprache

### Allgemeine Grundsaetze Text und Ansprache

- **Aufforderungen** sollen in formeller Ansprache erfolgen.

> _<span style="color:green">Beispiel: Klicken **Sie** zweimal in die Karte. ...</span>_

- **Beschreibende** Texte sollen in neutraler Ansprache erfolgen.

> <span style="color:green">**Beispiel deutsch:** \"Flächenauswahl: Das Zeichnen einer Geometrie ermöglicht den Export aller innerhalb der Geometrie befindlichen Objekte.\*\*</span>
>
> <span style="color:green">**Beispiel englisch:** \"Area selection: Drawing a geometry allows the export of all objects located within the geometry.\"</span>

- Wenn sinnvoll, kann eine formelle Ansprache mit einem beschreibenden
  Text kombiniert werden. Dabei sollte die persönliche Ansprache
  vorangestellt werden.

<span style="text-decoration:underline">**Regel:**</span> **\<Ansprache\>\<Erläuterung\>**

> <span style="color:green">**Beispiel deutsch:** \"Klicken **Sie** zweimal in die Karte. Der erste Klick ermöglicht... . Der zweite Klick ..."</span>
>
> <span style="color:green">**Beispiel englisch:** \"Click twice on the map. The first click
> enables... . The second click ...\"\*</span>

> Bsp. <span style="color:red">Tool</span> \--\> <span style="color:green">Werkzeug,</span> <span style="color:red">Extent</span> \--\> <span style="color:green">Ausdehnung,</span> <span style="color:red">Layer</span> \--\> <span style="color:green">Ebene</span>
> (siehe auch Glossar)
>
> Negativbeispiel: <span style="color:red">\"**Shadow Tool Fenster öffnen**\"</span>

- Im Englischen:

  - **Entsprechend Google Richtlinie: Sentence Style verwenden**

  - **Erstes Wort groß =\> Rest klein**

### Fall: Platzhaltertexte

- **immer Angabe eines Platzhalters, wenn kein Default-Wert im
  Inputfeld!!**

- direkte Ansprache wählen

- Wenn sinnvoll, kann eine formelle Ansprache mit einem beschreibenden
  Text kombiniert werden. Dabei sollte die persönliche Ansprache
  vorangestellt werden. s.o

>

a. **ohne Label:** Angabe der Eigenschaft

> <span style="text-decoration:underline">**Beispiele:**</span>
>
> **E-Mail**: E-Mail
>
> **URL**: URL
>
> **Suche**: Suche..., Adresssuche...\_
>
> **Auswahl**: Auswahl...
>
> **Sonstige**: wie Tooltip behandeln
>
> ![Image](media/image17.png)
>
> ![Image](media/image18.png)

b. **mit Label:** Angabe als Beispiel

> <span style="text-decoration:underline">**Beispiele:**</span>
>
> **E-Mail**: example@mail.de
>
> **URL**: http://www.example.com
>
> **Suche**: Suche..., Adresssuche...
>
> **Auswahl**: Auswahl...
>
> **Sonstige**: wie Tooltip behandeln
>
> \*![Image](media/image19.png)

### Fall: Label

- **Labeltexte:** _Die Eigenschaft als solches: E-Mail, URL, etc..._

- **Labelwerte:** _Als Eigenschaft beschreiben (Hell / Dunkel =\> Hoch,
  Niedrig)_

### Fall: Fehlermeldungen

- Neutrale Formulierung wählen (_Don\'t blame the user_)

> **Bsp**. \"Es ist eine Auswahl erforderlich\", \"Es muss ein Wert \>0
> gewählt werden\"

- Menschenlesbar (Laie), sollte Rückschluss auf Fehlerursache liefern

> **Bsp. Login** \--\> Eingabefehler oder Serververbindung
> fehlgeschlagen,
>
> **Bsp. Formulare**: Welches Feld, welcher Input wird stattdessen
> erwartet

<span style="color:red">**Dont:**</span>

> ![Image](media/image20.jpeg)

- <span style="color:red">**Unverständlich**</span>

  - <span style="color:red">**Eingabefehler?**</span>

  - <span style="color:red">**Fehler bei Serverbindung?**</span>
    </span>

> ![Image](media/image21.jpeg)

- <span style="color:red">**Unspezifisch**</span>

  - <span style="color:red">**Welches Feld?**</span>

  - <span style="color:red">**Was ist "korrekt**</span>
    </span>
