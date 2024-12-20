# Formulierung von Tooltips

## Allgemeine Grundsätze

1. Eindeutigkeit: Gleiche Funktionen UI-übergreifend mit einheitlichen Tooltips versehen. Unterschiedliche Funktionen nicht mit dem gleichen Tooltip beschreiben. (Wortwahl)
2. Umfang: Der Tooltip sollte vom Umfang her nicht mehr als einen kurzen aussagekräftigen Satz umfassen.
3. Zustand: Tooltips werden so formuliert, dass sie statisch (= zustandslos) funktionieren. <br> (Sofern das Ausführen der Aktion mit einem Zustandswechsel einhergehen würde.) |

<details>
<summary>Beispiele:</summary>

_Beispiel:_

> <span style="color:green">\"Schatten simulieren\"</span> anstatt <span style="color:red">\"Schattentool öffnen\"</span>

_Aber:_

> <span style="color:green">\"Dokumentation in neuem Browsertab öffnen\"</span> ist korrekt, da diese Aktion nicht mit einem Zustandswechsel zu \"Dokumentation schließen\" einhergeht.

</details>

## Aufbau

| Tooltips legen sprachlich den Fokus auf die Aktion.                                                                               |
| :-------------------------------------------------------------------------------------------------------------------------------- |
| Schema: \<Objekt> + \<Aktion>                                                                                                     |
| Erinnerung: Die Aktion sollste statisch (= zustandslos) fromuliert sein (sofern sie mit einem Zustandswechsel einhergehen würde). |

<details>
<summary>Beispiele:</summary>

> _**(i)** : <span style="color:green">\"Informationen aufrufen\"</span>_  
> _**Header-Share**: <span style="color:green">Aktuellen Kartenausschnitt teilen</span>_  
> _**Drawing-Polygon**: <span style="color:green">\"Polygone zeichnen\"</span>_  
> _**Shadowtool**: <span style="color:green">\"Schatten simulieren\"</span>_

</details>

### Ausnahme

Von **\<Objekt\> + \<Aktion\>** kann abgewichen werden, wenn kein sinnvolles Verb / Aktion gefunden werden kann, dass eine _zustandslose_ Aktion ausdrückt. Wenn das Verb nur ein Füllwort ist, kann es
weggelassen werden.

<details>
<summary>Beispiele für Abweichungen:</summary>

> _<span style="color:green">\"Mehrfachansicht\"</span> statt <span style="color:red"> \"Mehrfachansicht öffnen\"</span>_  
> _<span style="color:green">\"Legende\" </span> statt <span style="color:red"> \"Legende anzeigen\" </span>_  
> _<span style="color:green">\"Inhalte\" </span> statt <span style="color:red"> \"Inhalte anzeigen\" </span>_  
> _<span style="color:green">\"Mein Arbeitsbereich\" </span> statt <span style="color:red"> \"Mein Arbeitsbereich öffnen\" </span>_

</details>

## Unterscheidung nach Anwendungsfällen

### Fall: Clickbare Icons oder Buttons ohne Text

<u>Verfügbarkeit:</u> verpflichtend

| Icons die klickbar sind benötigen immer einen Tooltip. |
| :----------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image12.png)
>
> ![Image](../media/image13.png)

</details>

#### Ausnahme

Checkbox ist ein gewohntes UI Element und benötigt keinen Tooltip!

### Fall: Rein textbasierte Menueeintraege und Kombinierte Menueeintraege Icon und Text

<u>Verfügbarkeit:</u> optional

| Textbasierte Menüeinträge sollten grundsätzlich selbsterklärend sein, nur wenn eine weitere Erläuterung zum Verständnis absolut notwendig ist, sollte ein Tooltip den Eintrag ergänzen. <br> <br>Bedingung: Wenn ein Tooltip verwendet wird, sollte er einen echten Mehrwert bieten (d.h. das Element / die Aktion detaillierter beschreiben) und nicht nur eine Wiederholung des Menüeintrages sein. |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anmerkung: Bedarf Einzelfallentscheidung des Feature Managers in Anlehnung an bestehende Tooltips.                                                                                                                                                                                                                                                                                                    |

<details>
<summary>Beispiele:</summary>

_Dont't:_

> _<span style="color:red"> \"Zoom auf Ebene\"\*\* \*\*=\> \"Auf Ebene zoomen\"</span>_

_Do:_

> _<span style="color:green">\"Alle Elemente dieser Gruppe selektieren\" / „Select all elements of this group."</span> statt <span style="color:red"> \"Alle selektieren\"</span>_  
> _<span style="color:green">\"Auf die volle Ausdehnung der Ebene zoomen\" / „Zoom to the full extent of the layer."</span> statt <span style="color:red">\"Auf Ebene zoomen\"</span>_

</details>

##### Ausnahme

Kein Tooltip im Kontextmenu!

#### Fall: Tooltip - Fehlermeldung

<u>Verfügbarkeit:</u> verpflichtend

| Für Fehlermeldungen wird ein vollständiger Satz mit einer klaren Anweisung formuliert. <br> Dabei ist der Fokus immer positiv: Was ist erforderlich, um den Fehler zu beheben. |
| :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image15.jpeg)

> ![Image](../media/image16.jpeg)

</details>

#### Sonderfall: Texte werden aufgrund von Platzmangel abgeschnitten

<u>Verfügbarkeit:</u> verpflichtend

| Werden Texte automatisch abgeschnitten und mit "..." verkürzt, wird der gesamte Text automatisch on hover als Tooltip angezeigt. |
| :------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image14.jpeg)

</details>

### Do's

<details>
<summary>Beispiele:</summary>
>![Image](media/image12.png)

> ![Image](../media/image2.jpeg)

> ![Image](../media/image3.jpeg)

</details>

### Dont's

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image1.jpeg)
>
> <span style="color:red">Verb nicht zustandslos</span>

> ![Image](../media/image4.jpeg)
>
> <span style="color:red">\<Verb\>\+<Objekt\> statt <Objekt\> + \<Verb\></span>

> ![Image](../media/image5.jpeg) ![Image](../media/image6.jpeg)
>
> <span style="color:red">Mix von \<Objekt\>+\<Aktion\> in DE/EN </span>

> ![Image](../media/image7.jpeg) ![Image](../media/image8.jpeg) ![Image](../media/image9.jpeg)
>
> <span style="color:red">Annahme des englischen Begriffs als Eigenname</span>

> ![Image](../media/image10.jpeg) ![Image](../media/image11.jpeg)
>
> <span style="color:red">Verwendung des gleichen Tooltip für unterschiedliche Button:</span>

</details>
