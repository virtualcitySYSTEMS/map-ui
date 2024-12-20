# Nutzung von Supporttexten

## Allgemeine Grundsätze

<span style="text-decoration:underline">Zweck:</span> Kurze, direkte Hilfestellung bezüglich einer zu erwartenden Nutzereingabe innerhalb eines Fensters.

## Unterscheidung nach Anwendungsfällen

### Fall: Startanweisung im Tool (Instruktionstext)

<span style="text-decoration:underline">UI Komponente:</span> VcsHelp

| Komponente wird als Initialisierungstext zum Start eines Werkzeugs genutzt. |
| :-------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Zur Erläuterung erster Schritte.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image33.png)

</details>

### Fall: Erläuterung zur Benutzung eines Werkzeugs

<span style="text-decoration:underline">UI Komponente:</span> VcsHelp

| Komponente wird für permanente, ergänzende Hinweise zur allgemeinen Bedienung eines Werkzeuges genutzt. |
| :------------------------------------------------------------------------------------------------------ |

<span style="text-decoration:underline">Wann sinnvoll:</span> Wenn Bedienhinweise erforderlich sind (z.B. Hinweise auf Shortcuts oder mögliche Aktionen).

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image40.png)

> ![Image](../media/image41.png)

</details>

### Fall: Erläuterung zum Eingabefeld

#### a. mit Label

<span style="text-decoration:underline">UI Komponente:</span> helpText prop in VcsLabel

| Komponente wird als eine kurze Erläuterung / Erklärung über die einzustellende Eigenschaft genutzt. |
| :-------------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Sofern besonderer Erläuterungsbedarf zur Eigenschaft selbst besteht.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image39.png)

</details>

#### b. ohne Label

<span style="text-decoration:underline">UI Komponente:</span> tooltip auf VcsTextField

| Komponente wird als eine kurze Erläuterung / Erklärung über den einzustellenden Wert genutzt. |
| :-------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Sofern besonderer Erläuterungsbedarf zur Wahl des Eingabewertes besteht.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image42.png)

</details>

### Fall: Erläuterung zu einem Abschnitt / Schritt

<span style="text-decoration:underline">UI Komponente:</span> helpText prop in VcsWizardStep oder VcsFormSection

| Komponente wird genutzt, sofern sich die Erläuterung auf einen Teilschritt eines Wizzards oder einen gesamten Abschnitt bezieht. |
| :------------------------------------------------------------------------------------------------------------------------------- |

<span style="text-decoration:underline">Wann sinnvoll:</span> Als eine kurze Erläuterung / Erklärung zum nachfolgenden Schritt.

<details>
<summary>Beispiele:</summary>

> ![Image](../media/image44.png)

> ![Image](../media/image43.png)

</details>
