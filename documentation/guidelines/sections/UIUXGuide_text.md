# Formulierung von Texten

## Allgemeine Grundsätze

Es kann nicht von Mehrsprachigkeit oder Fachsprache ausgegangen werden. V.a. im Deutschen sollten geeignete deutschsprachige Bezeichnungen verwendet werden, d.h. Tools, Texte, Labels, etc. sind eindeutig und sinnvoll zu übersetzen.

| Denglish vermeiden! |
| :------------------ |

<details>
<summary>Negativbeispiel:</summary>

> _<span style="color:red">\"Shadow Tool Fenster öffnen\"</span>_

</details>
<details>
<summary>Beispiele:</summary>

> _<span style="color:green">"Werkzeug"</span> statt <span style="color:red">"Tool"</span>_  
> _<span style="color:green">"Ausdehnung"</span> statt <span style="color:red">"Extent"</span>_  
> _<span style="color:green">"Ebene"</span> statt <span style="color:red">"Layer"</span>_

(siehe auch: [Glossar](UIUXGuide_terminology.md))

</details>

| In der englischen Schreibweise ist "Sentence Style" zu verwenden (Ausnahme: Eigennamen). |
| :--------------------------------------------------------------------------------------- |
| D.h. erstes Wort groß, danach klein.                                                     |

<details>
<summary>Beispiele:</summary>

> _<span style="color:green">\"Simulate shadows"</span>_

</details>

## Nutzeransprache

| Aufforderungen sollen in formeller Ansprache erfolgen. |
| :----------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> _<span style="color:green">Klicken **Sie** zweimal in die Karte. ...</span>_

</details>

| Beschreibende Texte sollen in neutraler Ansprache erfolgen. |
| :---------------------------------------------------------- |

<details>
<summary>Beispiele (DE):</summary>

> _<span style="color:green"> \"Flächenauswahl: Das Zeichnen einer Geometrie ermöglicht den Export aller innerhalb der Geometrie befindlichen Objekte.\*\*</span>_

</details>

<details>
<summary>Beispiele (EN):</summary>

> _<span style="color:green"> \"Area selection: Drawing a geometry allows the export of all objects located within the geometry.\"</span>_

</details>

| Wenn sinnvoll, kann eine formelle Ansprache mit einem beschreibenden Text kombiniert werden. Dabei sollte die persönliche Ansprache vorangestellt werden. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema: \<Ansprache> + \<Beschreibung>                                                                                                                    |

<details>
<summary>Beispiele (DE):</summary>

> _<span style="color:green">\"Klicken **Sie** zweimal in die Karte. Der erste Klick ermöglicht... . Der zweite Klick ..."</span>_

</details>
<details>
<summary>Beispiele (EN):</summary>

> _<span style="color:green">"Click the map twice. The first click enables... . The second click ..."</span>_

</details>

## Unterscheidung nach Anwendungsfällen

### Fall: Platzhaltertexte

| Es wird immer ein Platzhalter angegeben, wenn kein Default-Wert im Inputfeld gesetzt ist. |
| :---------------------------------------------------------------------------------------- |

#### **a. Inputfeld ohne Label:**

| Wenn kein Label vorhanden ist, wird die Eigenschaft als Platzhalter angegeben. |
| :----------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> _**E-Mail**: E-Mail_

> _**URL**: URL_

> _**Suche**: Suche nach Adresse, Ort/Sehenswürdigkeit oder Koordinate X, Y_

> _**Auswahl**: Datenquelle, Selektionsart (je nach Ziel)_

> ![Image](../media/image17.png)

</details>

#### b. **Inputfeld mit Label:**

| Wenn ein Label vorhanden ist, wird ein Beispiel als Platzhalter angegeben. |
| :------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> _**E-Mail**: example@mail.de_

> _**URL**: http://www.example.com_

> _**Koordinatensuche**: 796602.02, 828841.13_

> ![Image](../media/image19.png)

</details>

### Fall: Label

| a. Label für Eingabefelder: Es wird die Einstellung als solche benannt. <br> b. Label für Eingabewerte: Werden als Eigenschaft beschreiben. |
| :------------------------------------------------------------------------------------------------------------------------------------------ |

<details>
<summary>Beispiele:</summary>

> _**Label des Eingabefeldes**: Anzeigequalität_

> _**Label der Eingabewerte**: <span style="color:green">\"Niedrig\", \"Mittel\", \"Hoch\"</span> statt <span style="color:red"> \"Niedrige\", \"Mittlere\", \"Hohe\"</span>_

</details>

### Fall: Fehlermeldungen

| Für Fehlermeldungen werden neutrale Formulierungen gewählt. |
| :---------------------------------------------------------- |
| Grundsatz: "Don't blame the user!"                          |

<details>
<summary>Beispiele:</summary>

> \"Es ist eine Auswahl erforderlich\."

> \"Es muss ein Wert \>0 gewählt werden\."

</details>

| Fehlermeldungen sollten möglichst menschenlesbar und für Laien verständlich ausgedrückt sein und einen Rückschluss auf die Fehlerursache liefern. |
| :------------------------------------------------------------------------------------------------------------------------------------------------ |

<details>
<summary>Negativbeispiele:</summary>

> ![Image](../media/image20.jpeg)
>
> _<span style="color:red"> = Unverständlich & Denglish</span>_  
> _...ist es ein Eingabefehler oder ist die Serververbindung fehlgeschlagen?_ > _... nicht jeder versteht was ein [401] Fehler ist. Eine spezifische Angabe von Username ist falsch oder Passwort ist falsch, ist aus Sicherheitsgründen nicht erlaubt. Hier sollte also etwas stehen wie, **"Die Verbindung zum Server ist fehlgeschlagen"** oder **"Ihre Eingaben waren nicht korrekt."**_

> ![Image](../media/image21.jpeg)
>
> _<span style="color:red">= Unspezifisch </span>_  
> _...welches Feld? Was ist "korrekt"?_

</details>

### Fall: Menueinträge

#### Hauptmenu

| Hauptmenueinträge legen sprachlich den Fokus auf das Objekt. |
| :----------------------------------------------------------- |
| Schema: \<Objekt>                                            |

<details>
<summary>Beispiele:</summary>

> _Einstellungen, Hilfe, Filter und Effekte_

</details>

#### Kontextmenu

| Kontextmenueinträge legen sprachlich den Fokus auf die Aktion. |
| :------------------------------------------------------------- |
| Schema: \<Objekt> + \<Aktion>                                  |

<details>
<summary>Beispiele:</summary>

> _Geometrie editieren, Objekt verschieben, Fußgängermodus starten_

</details>
