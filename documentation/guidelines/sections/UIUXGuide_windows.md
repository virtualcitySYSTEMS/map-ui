# Fensterkonzeption

## Fenstertypen

### Dialogfenster

<u>Zweck:</u> Erzeugen eines Objektes oder Zustandes.

| Ein Dialogfenster <br><br> 1. KANN einen Primary Action-Button besitzen (Ausführung: VCSFormbutton - filled), der eine Bestätigungsaktion ausführt (z.B. IMPORT, ANWENDEN, LOGIN, etc.) <br> <br>2. SOLLTE einen Secondary Action-Button besitzen (Ausführung: VCSFormbutton - outlined), der eine Abbruchaktion ausführt (z.B. Abbrechen, Zurücksetzen) |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<u>Wann sinnvoll:</u>

1. Eine Reihe / Sammlung von Eingaben des Nutzers sind notwendig um die Aktion auszuführen.
2. Den Nutzer:innen soll die Möglichkeit gegeben werden, eine Aktion abbrechen zu können.

<u>Anordnung:</u> Einzel-Buttons oder Buttonpaare sind i.d.R. an der rechten Seite des Fensters ausgerichtet.

<u>Verhalten:</u>

1. Ein Klick auf den **Bestätigungsbutton** wendet die Nutzereingabe(n) an und schließt das Dialogfenster (Ausnahmen: Fehlerfälle z.B. Login failed, Nutzereingabe(n) falsch).
2. Ein Klick auf den **Abbruchbutton** verwirft die Nutzereingabe(n) und schließt das Dialogfenster.
3. Ein Klick auf **(X)** des Fensters, schließt das Dialogfenster.

### Fall: Bestätigungsbutton benötigt

| Es wird ein Bestätigungsbutton benötigt, wenn <br> a. mehrere Nutzereingaben erforderlich sind, um eine Aktion auszuführen. <br> b. Nutzer:innen den Zeitpunkt des Speicherns eines Bearbeitungsstandes selbst bestimmen können sollen. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele für gängige Kombinationen:</summary>

> ![Image](../media/image22.png)
>
> _"Apply" + "Cancel"_

> ![Image](../media/image26.png)
>
> _"Login" + "Cancel"_

> ![Image](../media/image27.png)
>
> _"Save" + "Reset"_

</details>

### Fall: Bestätigungsbutton nicht benötigt

| Es wird KEIN Bestätigungsbutton benötigt, wenn <br> a. Nutzeraktionen automatisch angewendet werden können (ohne zu einem invaliden Ergebnis zu führen) <br> b. Berechnungen automatisch durchgeführt werden (Fortschrittsdialog) |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele für keinen Bestätigungsbutton:</summary>

> ![Image](../media/image25.png)
>
> _Initialisierungsschritt: Eingaben werden direkt angewendet_

> ![Image](../media/image24.png)
>
> _Fortschrittsdialog bei Berechnungen_

</details>

### Ausnahme

Fenster, die für den Anwendungsstart vorgesehen sind und bei deren Abbruch die Anwendung nicht gestartet werden könnte, können auch ausschließlich einen Aktionsbutton (Primary Action) besitzen.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image28.png)
>
> _Splash Screen_

> ![Image](../media/image29.png)
>
> _Modulselektor_

</details>

## Eigenschaftsfenster

<u>Zweck:</u> Darstellung von Eigenschaften eines Objektes.

<u>Wann sinnvoll:</u> Wenn Einstellungen direkt angewendet werden sollen, ohne dass eine Nutzerbestätigung erforderlich ist.

<u>Verhalten:</u> Ein Klick auf **(X)** des Fensters, schließt das Eigenschaftsfenster.

### Fall: Werkzeuge, die Objekte direkt erzeugen oder mit der Kartenansicht interagieren

| Werkzeuge, die Objekte direkt erzeugen oder ausschließlich mit der Kartenansicht interagieren, besitzen keine Fußzeile mit Primary-/Secondary-Action Buttons. |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------ |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image31.png)
>
> _Erzeugt Objekt direkt_

> ![Image](../media/image30.png)
>
> _Interagiert ausschließlich mit der Kartenansicht_

</details>

### Fall: Werkzeuge, die temporäre Objekte erzeugen

| Werkzeuge, die temporäre Objekte erzeugen, besitzen eine Button-Fußzeile, welche die Buttons "Zu Mein Arbeitsbereich hinzufügen" (Secondary-Action) und "NEU" (Primary-Action) enthalten. |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image32.png)

</details>

## Fensterheader

### Fenstertitel

#### Fall: Eigenschaftsfenster

| Bei Werkzeugen, die <br> (a) kein Objekt erzeugen (z.B. Schattenwerkzeug, Swipe, Export) ODER <br>(b) Objekte DIREKT erzeugen (Bsp. Zeichnen) <br> setzt der Titel des Eigenschaftsfenster den Fokus auf die Aktion (äquivalent zu Tooltips der Werkzeug-Buttons).<br><br> Wenn das Verb nicht zustandslos beschrieben werden kann, wird dieses weggelassen. (Bsp. Einstellungen) |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema: \<Objekt> + \<verb>                                                                                                                                                                                                                                                                                                                                                       |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image30.png)

> ![Image](../media/image34.png)

</details>

| Bei Werkzeugen, die <br> (a) temporäre Objekte erzeugen (z.B. Kameraflug, Höhenprofil, Viewshed) ODER <br> (b) Fenster, welche Eigenschaften eines bereits erzeugten Objektes anzeigen, setzt der Titel des Eigenschaftsfenster den Fokus auf das Objekt. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schema (a): Temporäres \<Objekt> <br> Schema (b): \<Objekt>                                                                                                                                                                                               |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image32.png)

> ![Image](../media/image31.png)

</details>

#### Fall: Initialisierungsfenster

| Im Initialisierungsschritt setzt der Titel den Fokus auf das Erstellen. |
| :---------------------------------------------------------------------- |
| Schema: \<Objekt> erstellen bzw. \<Objekt> erzeugen (vgl. Tooltip)      |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image33.png)

</details>

#### Fall: Dialogfenster

| Titel von Dialogfenstern, die dem Erzeugen von Dingen dienen (geht einher mit z.B. Apply, Create, Calculate) fokussieren die Aktion. |
| :----------------------------------------------------------------------------------------------------------------------------------- |
| Schema: \<Objekt> + \<verb>                                                                                                          |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image38.png)

</details>

| Titel von Dialogfenstern, die einen Überblick / Einstieg geben (geht einher mit z.B. Save, Login), fokussieren das Objekt. |
| :------------------------------------------------------------------------------------------------------------------------- |
| Schema: \<Objekt> - \<Titel> (letzteres falls zutreffend)                                                                  |

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image37.png)

> ![Image](../media/image36.png)

> ![Image](../media/image19.png)

</details>

#### Zusätzliche Aktionen im Header

| Zusätzliche, individuelle Aktionen, welche im Header des Fensters platziert werden, sollen sich immer auf das Werkzeug im Gesamten beziehen. |
| :------------------------------------------------------------------------------------------------------------------------------------------- |

<details>
<summary>Beispiele:</summary>

> _<span style="color:green">**Do's**:</span>_  
> _Dokumentation, Modusänderung, Allgemeine Werkzeugeinstellungen_

> _<span style="color:red">**Dont's:**</span>_  
> _Stützpunkte ausblenden, Geometrie editieren_

</details>

## Inhaltliche Gliederung nach Anwendungsfällen

### Fall: Thematische Gruppen

<span style="text-decoration:underline">UI Komponente:</span> VcsExpansionPanel, VcsListGroup

| Komponenten werden zur inhaltlichen Zuordnung zu Kategorien / Themen durch den Nutzer (Konfigurator) oder das Tool genutzt (z.B. im Inhaltsfenster, Mein Arbeitsbereich, Legende). <br> <br> Ob die Gruppe per Default ein- oder ausgeklappt ist, wird vom Nutzer oder Tool individuell gesteuert. |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Wenn Inhalte zur Übersichtlichkeit thematisch gruppiert werden sollen.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image46.png)

</details>

### Fall: Logisch-Funktionale Gruppen (Abschnitte)

<span style="text-decoration:underline">UI Komponente:</span> VcsFormSection

| Komponente wird zur logischen Gliederung von Einstellungen / Eigenschaften genutzt. Dabei wird wie folgt unterschieden: <br> <br> a. Für erforderliche Eigenschaften wird die Option "expandable" nicht genutzt, die darunter gegliederten Eigenschaften sind immer sichtbar. <br> <br> b. Für optionale Eigenschaften / Experteneinstellungen wird die Option "expandable" genutzt, die darunter gegliederten Eigenschaften können nach Bedarf ein-/ausgeklappt werden. Die Gruppe sollte per Default zugeklappt sein. |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Wenn viele Einstellungen / Eigenschaften vorhanden sind und diese logisch gruppiert werden können / sollten.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image45.png)

</details>

### Fall: Schrittweise Gruppierung

<span style="text-decoration:underline">UI Komponente:</span> VcsWizzard

| Komponente wird zur Gliederung von Workflows/Aufgaben in einzelne, aufeinander aufbauende Arbeitsschritte genutzt. |
| :----------------------------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Wenn Nutzer gezielt durch einen Ablauf von mehreren Handlungsschritten geführt werden sollen und Eingaben aufeinander aufbauen.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image44.png)

</details>

## Fensterpositionierung nach Anwendungsfällen

### Allgemeine Grundsätze

| Unter Berücksichtigung des Fensterkonzeptes sollten nie mehr als drei Fenster nebeneinander geöffnet sein, um die Nutzeroberfläche nicht zu überfrachten. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------- |

### Fall: Informationsfenster

<span style="text-decoration:underline">Fensterposition:</span> DYNAMIC_RIGHT

| Statische Informationsfenster nehmen die Position "Dynamic Right" ein.               |
| :----------------------------------------------------------------------------------- |
| Fenster des Position "Dynamic Right werden an der rechten Bildschirmseite platziert. |

<details>
<summary>Beispiele: Datenquellen, Legende, Impressum/Datenschutz, Featureinfo (Tabelle)</summary>

> ![Image](../media/image47.png)

</details>

### Fall: Standalone-Werkzeug aus Bereich "Allgemeine Funktionen"

<span style="text-decoration:underline">Fensterposition:</span> DYNAMIC_RIGHT

| Werkzeuge, die sich über den Bereich "Allgemeine Funktionen" im Kartenheader oben rechts öffnen lassen (betrifft u.a. Teilen und Hauptmenueinträge), nehmen die Position "Dynamic Right" ein. |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fenster der Position "Dynamic Right" werden an der rechten Bildschirmseite platziert.                                                                                                         |

<details>
<summary>Beispiele: Einstellungen, PDF erstellen, Filter und Effekte</summary>

> ![Image](../media/image48.png)

</details>

### Fall: Standalone-Werkzeug aus Werkzeugleiste

<span style="text-decoration:underline">Fensterposition:</span> DYNAMIC_LEFT

| Werkzeuge, die unabhängig sind, d.h. beispielsweise nicht mit "Mein Arbeitsbereich" interagieren, und sich über die Toolbar öffnen lassen, nehmen die Position "Dynamic Left" ein |
| :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fenster der Position "Dynamic Left" werden an der linken Bildschirmseite platziert.                                                                                               |

<details>
<summary>Beispiele: Schattenwerkzeug, Swipe, Export, Transparentes Gelände (Globus)</summary>

> ![Image](../media/image49.png)

</details>

### Fall: Andere Werkzeuge mit Bezug zu "Mein Arbeitsbereich", Planner oder App-Konfigurator

<span style="text-decoration:underline">Fensterposition:</span> DYNAMIC_CHILD

| Alle anderen Werkzeuge, die NICHT unabhängig sind (d.h. beispielsweise mit "Mein Arbeitsbereich", Planner oder dem App Konfigurator interagieren) öffnen sich als Kindelemente der entsprechenden Liste (Position "Dynamic Child"). |
| :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fenster der Position "Dynamic Child" werden an der linken Bildschirmseite platziert - aber immer rechts neben der jeweiligen Liste.                                                                                                 |

<details>
<summary>Beispiele: Zeichenwerkzeug, Messwerkzeug, Flüge, Höhenprofil, Transparentes Gelände (Aushub), Sichtanalyse, Schnittwerkzeug, Editoren</summary>

> ![Image](../media/image50.png)

</details>

### Sonderfall: Inhalte

<span style="text-decoration:underline">Fensterposition:</span> STATIC

| Der Inhaltebaum ist das einzige Element, die die Position "static" nutzt.                                                                              |
| :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Das Inhaltefenster öffnet sich fest immer an der linken Bildschirmseite und kann nicht verschoben weden. Es verdrängt ggf. andere Fenster nach rechts. |

<details>
<summary>Beispiele: Ausschließlich Inhalte</summary>

> ![Image](../media/image51.png)

</details>
