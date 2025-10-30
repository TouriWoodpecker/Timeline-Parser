import { ParsedEntry, KeyInsights, CorpusItem } from "../types";
import { callGenerativeAIWithCorrection } from "./aiUtils";

const knowledgeCorpus: CorpusItem[] = [
    // Teil 1: Nord Stream 2 – Termine, politische Kontakte und Einflussnahme
    { id: "1a", category: "Kontakte der Landesregierung (auch Behörden, Ministerien) zu Nord Stream 2", description: "Die Landesregierung verschwieg Kontakte zu Nord Stream 2 und wurde dafür gerügt." },
    { id: "1b", category: "Kontakte der Landesregierung (auch Behörden, Ministerien) zu Nord Stream 2", description: "Schwesig verschleierte Gespräche beispielsweise mit Schröder und Warnig über Nord Stream 2." },
    { id: "2a", category: "Frühere Planungen und Einfluss der politischen Lage", description: "Die Landesregierung förderte frühzeitig (ab 2012) Nord Stream Stränge 3 und 4 trotz Genehmigungsrisiken durch Parallelprojekte." },
    { id: "2b", category: "Frühere Planungen und Einfluss der politischen Lage", description: "Christian Pegels Einsatz ist außergewöhnlich stark ausgeprägt." },
    { id: "2c", category: "Frühere Planungen und Einfluss der politischen Lage", description: "Nord Stream 2 Planung stoppte kurz vor Krim-Annexion, Begründung unplausibel." },
    { id: "2e", category: "Frühere Planungen und Einfluss der politischen Lage", description: "Merkel signalisierte Putin Unterstützung für Nord Stream, obwohl die Planungen eigentlich eingestellt waren." },
    { id: "3a", category: "Russlandnähe unter Ministerpräsident Sellering", description: "Trotz geringerem Handel förderte die Landesregierung Geschäfte mit Russland überproportioniert stark, teilweise mit gasfreundlichen Lobbyisten." },
    { id: "3b", category: "Russlandnähe unter Ministerpräsident Sellering", description: "Sellering kooperierte trotz Krim-Annexion und intensivierte seine Verbindungen heimlich mit Schröder im Schiffbau." },
    { id: "3c", category: "Russlandnähe unter Ministerpräsident Sellering", description: "Der Werftenkäufer Jussufow war Putins Vertrauter und Nord-Stream-Leiter." },
    { id: "4a", category: "Unterstützung der Landesregierung für Nord Stream 2", description: "Sellering veranlasste Unterstützung für Nord Stream 2, leugnete dies aber später." },
    { id: "4b", category: "Unterstützung der Landesregierung für Nord Stream 2", description: "Sellering leugnet Gespräche über Nord Stream 2, obwohl Vermerke Gegenteil belegen." },
    { id: "4c", category: "Unterstützung der Landesregierung für Nord Stream 2", description: "Sellering bestritt Pläne der Staatskanzlei für ein Putin-Treffen über Warnig." },
    { id: "5a", category: "Einflussnahme im Genehmigungsverfahren", description: "Behörden räumten für Nord Stream 2 Hindernisse weg, unter Druck und mit fragwürdigen Maßnahmen" },
    { id: "5b", category: "Einflussnahme im Genehmigungsverfahren", description: "Küstenschutzmaßnahmen wurden verschoben." },
    { id: "5c", category: "Einflussnahme im Genehmigungsverfahren", description: "Ein bislang umstrittenes Prüfverfahren wurde zugelassen." },
    { id: "5d", category: "Einflussnahme im Genehmigungsverfahren", description: "Die Bundeswehr wurde unter Druck gesetzt, vertrauliche Daten bereitzustellen." },
    { id: "5e", category: "Einflussnahme im Genehmigungsverfahren", description: "Ein Ostseegebiet wurde vorsorglich zum „Natura-2000-Gebiet“ erklärt, um Ausgleichsmaßnahmen für Nord Stream 2 zu ermöglichen." },
    { id: "5f", category: "Einflussnahme im Genehmigungsverfahren", description: "Druck auf Pegel, dieser ignorierte (Rechts-)risiken bei Nord Stream 2 Genehmigung." },
    { id: "6a", category: "Politisches Engagement zugunsten des Projekts", description: "Die Landesregierung setzte sich (u.a. Bundespolitisch) erfolglos und vielseitig für Nord Stream 2 ein." },
    { id: "6b", category: "Politisches Engagement zugunsten des Projekts", description: "Landesregierung widersprach sich: Gasbedarf hoch, doch Kohleimporte sollten massiv steigen." },
    { id: "7a", category: "Sicherheitszertifizierung", description: "Bruder des wirtschaftlichen Geschäftsführers der Klimastiftung MV und Ex-Mitarbeiter von Nord Stream 2 zertifizierten umstrittene Gasleitung." },
    { id: "7b", category: "Sicherheitszertifizierung", description: "Das Zertifizierungsverfahren zur Überprüfung der Pipeline ist nicht geeignet gewesen und wurde dennoch angewendet." },
    { id: "8a", category: "Entstehung der Stiftung Klima- und Umweltschutz MV", description: "Nord Stream 2 initiierte die Stiftung und erarbeitete die Satzung, nicht Christian Pegel." },
    { id: "8b", category: "Entstehung der Stiftung Klima- und Umweltschutz MV", description: "Pegel nutzte Nord-Stream-2-Vorlagen und log darüber öffentlich." },
    { id: "8c", category: "Entstehung der Stiftung Klima- und Umweltschutz MV", description: "Nord Stream 2, in Form von Petersen, ehemaliger Berater für Nord Stream 2, konzipierte den Geschäftsbetrieb." },
    { id: "8d", category: "Entstehung der Stiftung Klima- und Umweltschutz MV", description: "Schwesig stoppte die Gründung der Stiftung, da Glawe die Kanzlerin entgegen Absprache nicht informierte." },
    { id: "8e", category: "Entstehung der Stiftung Klima- und Umweltschutz MV", description: "Auf Druck von Nord Stream 2 wollte die Landesregierung mit Privatpersonen statt des Landes eine Stiftung für Nord Stream 2 gründen." },
    { id: "9a", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "Nord Stream 2 beeinflusste die Stiftung personell; Petersen wurde ohne Ausschreibung Geschäftsführer." },
    { id: "9b", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "Die Stiftungsführung hatte keine Kontrolle über den wirtschaftlichen Geschäftsbetrieb von Nord Stream 2. Die Kontrolle lag indirekt bei Nord Stream 2." },
    { id: "9c", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "Der Geschäftsführer vergab ohne Konsequenzen oder Bedenken Millionenaufträge an eigene und familiäre Unternehmen." },
    { id: "9d", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "Rostock täuschte Bürgerschaft bei Mageb Kai über Nord Stream 2 und verzögerte Aktenherausgabe." },
    { id: "9e", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "Minister Pegel leugnete zunächst Informationen zur ROKAI-Ansiedlung, was er später einräumte." },
    { id: "9f", category: "Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation", description: "ROKAI wurde für Nord Stream 2 gegründet, obwohl ein ehemaliger Geschäftsführer dies abstritt." },
    { id: "10a", category: "„Kamingate“ und Umgang mit Steuerunterlagen", description: "Finanzminister Geue verschwieg Parlament Steuerdetails trotz öffentlicher Bekanntheit und Mängeln in Finanzbehörden." },
    { id: "10b", category: "„Kamingate“ und Umgang mit Steuerunterlagen", description: "Der Vorgang deutet auf eine bewusste Vertuschung hin, worüber die Ministerpräsidentin informiert gewesen sein könnte." },
    { id: "10c", category: "„Kamingate“ und Umgang mit Steuerunterlagen", description: "Die 20-Millionen-Euro-Schenkungssteuer bei der Stiftungsgründung wurde trotz fehlender Gemeinnützigkeit nicht thematisiert." },
    { id: "10d", category: "„Kamingate“ und Umgang mit Steuerunterlagen", description: "Die Stiftung diente vorrangig Nord Stream 2, nicht dem Klimaschutz, wie der Schenkungssteuerbescheid belegt." },
    { id: "10e", category: "„Kamingate“ und Umgang mit Steuerunterlagen", description: "Der Stiftungsvorstand Sellering bezeichnete den Bescheid als politisch motiviert." },
    { id: "11a", category: "Öffentliche Kommunikation und Täuschung", description: "Die Öffentlichkeit wurde über Zweck und Umfang der Stiftung getäuscht." },
    { id: "11b", category: "Öffentliche Kommunikation und Täuschung", description: "Minister Pegel verschleierte die wirtschaftliche Tätigkeit der Stiftung, die intern bereits beschlossen war." },
    { id: "11c", category: "Öffentliche Kommunikation und Täuschung", description: "Die Stiftung verschleierte wirtschaftliche Aktivitäten zur Abwicklung eines Millionen-Investitionsstaus für Nord Stream 2." },
    { id: "11d", category: "Öffentliche Kommunikation und Täuschung", description: "Die Landesregierung unterstützte die Stiftung aktiv, obwohl diese unabhängig arbeiten sollte." },
    { id: "11e", category: "Öffentliche Kommunikation und Täuschung", description: "Landesregierung verschwieg entlastende Informationen zu den Sanktionsdrohungen gegen den Fährhafen Sassnitz." },
    { id: "11f", category: "Öffentliche Kommunikation und Täuschung", description: "Die Klimastiftung diente der Absicherung von Nord Stream 2 und nicht dem Schutz heimischer Unternehmen." },
    { id: "11g", category: "Öffentliche Kommunikation und Täuschung", description: "Die Staatskanzlei verschleierte wirtschaftliche Gründe der Stiftung, um Nord Stream 2 zu ermöglichen." },
    { id: "12a", category: "Auflösung der Stiftung und Rechtsgutachten", description: "Die Klimastiftung steht wegen Sittenwidrigkeit aufgrund ihrer engen Russland-Verbindungen in der Kritik." },
    { id: "12b", category: "Auflösung der Stiftung und Rechtsgutachten", description: "Die Landesregierung mischte sich böswillig in den Gutachtenprozess ein." },
    { id: "12c", category: "Auflösung der Stiftung und Rechtsgutachten", description: "Die Landesregierung löschte gezielt Hinweise auf frühere Gutachtenversionen und Arbeitsgespräche, um Einflussnahme zu verschleiern." },
    { id: "13a", category: "Satzungsänderung der Stiftung", description: "Die Landesregierung stimmte einer Satzungsänderung zu, die eine Auflösung der Nord Stream 2 Stiftung verhindert." },
    { id: "13b", category: "Satzungsänderung der Stiftung", description: "Stiftungsaufsicht war nicht gezwungen die Satzung zu ändern und tat dies auf Geheiß der Landesregierung." },
    { id: "14a", category: "Abwicklung des wirtschaftlichen Geschäftsbetriebs", description: "Die Stiftung erhielt nach Kriegsbeginn Millionen von Nord Stream 2, ohne Stiftungsaufsicht." },
    { id: "14b", category: "Abwicklung des wirtschaftlichen Geschäftsbetriebs", description: "Die Stiftung legte ein Gutachten vor, um Einnahmen von Nord Stream 2 in Millionenhöhe zu ermöglichen." },
    { id: "14c", category: "Abwicklung des wirtschaftlichen Geschäftsbetriebs", description: "Gerhard Schröder, Steffen Ebert und Matthias Warnig haben alle einen Nord Stream 2-Bezug." },
    { id: "15a", category: "Beteiligung von Christian Pegel an Kanzlei Hardtke, Svennsson & Partner", description: "Christian Pegel soll seine frühere Kanzlei bei Auftragsvergabe durch die Landesregierung begünstigt haben." },
    { id: "16a", category: "Frank Hardtke, Art Hotel Moskau und internationale Kontakte", description: "Christian Pegel hat über die Kanzei Hardtke, Svennsson & Partner Kontakte zu russischen Unternehmen." },
    { id: "17a", category: "Parteispenden und politische Dimension", description: "Christian Pegel spendete hohe Summen an die SPD, zeitgleich mit dem Nord Stream 2 Antragsverfahren in MV, um deren Erfolg zu gewährleisten." },
    { id: "18a", category: "Gelöschte E-Mails, SMS und Messenger-Daten", description: "Pegel löschte als Energieminister regelmäßig E-Mails, vermutlich auch relevante nach Einsetzung des Untersuchungsausschusses um Beweise zu vernichten." },
    { id: "18b", category: "Gelöschte E-Mails, SMS und Messenger-Daten", description: "E-Mails von Ministern und der Ministerpräsidentin wurden nach Amtsende unrechtmäßig gelöscht, was gegen das Archivgesetz verstößt, um Beweise zu vernichten." },
    { id: "19a", category: "Fehlende Dokumentation von Gesprächen", description: "Wichtige Gespräche zwischen Regierungsvertretern und Nord Stream 2 blieben undokumentiert." },
    { id: "19b", category: "Fehlende Dokumentation von Gesprächen", description: "Die Stiftung legt interne Dokumente nicht vollständig offen und verbietet Vertragspartnern die Offenlegung von Verträgen." },
];

const chunkAnalysisSchema = {
    type: 'ARRAY',
    description: "An array of analysis results, one for each entry in the input chunk.",
    items: {
        type: 'OBJECT',
        properties: {
            id: {
                type: 'NUMBER',
                description: "The original ID of the entry being analyzed."
            },
            kernaussage: {
                type: 'STRING',
                description: "Deine prägnante Zusammenfassung der Kernaussage.",
            },
            zugeordneteKategorien: {
                type: 'STRING',
                description: "Nummer(n) aus dem Wissenskorpus, z.B. '7(a); 19(b)' ODER 'Irrelevant / Prozedural'.",
            },
            begruendung: {
                type: 'STRING',
                description: "Deine kurze Begründung, warum der Inhalt zur Kategorie passt ODER warum er prozedural ist.",
            },
        },
        required: ["id", "kernaussage", "zugeordneteKategorien", "begruendung"],
    }
};

export async function analyzeEntries(entries: ParsedEntry[]): Promise<ParsedEntry[]> {
    if (entries.length === 0) {
        return [];
    }
    
    const fullCorpusContext = knowledgeCorpus.map(item => `- ID ${item.id} (${item.category}): ${item.description}`).join('\n');

    const entriesToAnalyzeString = entries.map(entry => `
        ---
        **ID:** ${entry.id}
        **Frage:** ${entry.question}
        **Antwort:** ${entry.answer}
        ---
    `).join('\n');

    try {
        const prompt = `
1. Rolle und Ziel
Du bist ein KI-Analyst (Gemini Gem), spezialisiert auf die Analyse von politischen Protokollen und Dokumenten im Kontext des "ZwU-Nord Stream 2" in Mecklenburg-Vorpommern. Deine Analyseperspektive ist die eines progressiven Verteidigers der SPD. Dein Standpunkt ist, dass es sich um übliche Vorgänge handelt und die Vorwürfe wirklich bewiesen werden müssen. Gleichzeitig bist du offen für in den Vorwürfen enthatlene Kritiken. Du nimmst die Anschuldigungen nicht unbedingt als Wahrheit an, wenn ihnen keine legitime, kohärente Argumentation vorausgeht.

Deine Aufgabe ist es, einen dir vorgelegten Text (z.B. eine Zeugenaussage, einen Protokollauszug) zu analysieren. Du musst die Kernaussage(n) dieses Textes identifizieren und sie präzise den Kategorien eines festen Wissenskorpus zuordnen.

2. Primärer Wissenskorpus (Dein Kategorien-Katalog)
Dein einziger Referenzrahmen für die Spalte "Zugeordnete Kategorie(n)" sind die folgenden Punkte aus dem Wissenskorpus. Nur die Nummern dieser Punkte (z.B. "1a", "7", "11b") dürfen verwendet werden.

[START WISSENSKORPUS]
${fullCorpusContext}
[ENDE WISSENSKORPUS]

3. Ausführungsregeln
Input: Du erhältst einen Block von Frage-Antwort-Paaren, der einen thematisch zusammenhängenden Dialog darstellt (z.B. alle Fragen eines Abgeordneten an einen Zeugen). Nutze den Gesamtkontext des gesamten Blocks, um mehrdeutige Einzel-Einträge korrekt einzuordnen und die Analyse konsistent zu halten.
Verarbeitung (Dein "Chain of Thought" für JEDEN EINZELNEN Eintrag):
a. Lies den Eintrag und identifiziere die zentrale(n) Kernaussage(n). Wer (Akteur) tut was (Sachthema)?
b. Vergleiche den semantischen Inhalt (Akteure und Sachthema) dieser Kernaussage mit den Punkten aus dem WISSENSKORPUS.
c. Finde die spezifische(n) Kategorie(n)-Nummer(n), die den Inhalt beschreiben. (z.B. wenn es sich um "Pegel" und "gelöschte E-Mails" geht, finde die entsprechende ID).
Sonderfall "Irrelevant / Prozedural":
- Wenn eine Aussage keine inhaltliche Substanz zu einem Sachthema oder Akteur liefert, oder ausschließlich eine prozedurale Rückfrage (z.B. "Von wann ist das?"), eine Zeitangabe (z.B. "Das war 2021.") oder eine reine Gesprächsfloskel ist, klassifiziere sie als "Irrelevant / Prozedural".
- Sei besonders gründlich bei der Anwendung der Punkte 19, 19 a, 19 b. Wenn es sich nicht um Regierungsvertreter (19 a) handelt oder die Klimastiftung (19 b), oder Fehlende Dokumentation (19), dann fällt generelle Kommunikation nicht unter einen dieser Punkte.
- Wenn eine Aussage auf eine bereits getätigte Aussage im selben Input-Text basiert ohne etwas substantielles hinzuzufügen, verweise auf die bereits getätigte Einordnung von dir. (Beispielsweise: "s. Fr. / Ant. 170")

**Input-Block zur Analyse:**
${entriesToAnalyzeString}

**Output-Format:**
Dein Output muss ausschließlich ein valides JSON-Array sein. Jedes Objekt im Array repräsentiert einen analysierten Eintrag aus dem Input-Block und muss dem Schema entsprechen. Das Array muss exakt einen Eintrag für jeden Input-Eintrag enthalten.
        `;

        const analysisResults = await callGenerativeAIWithCorrection('gemini-2.5-pro', prompt, {
            responseMimeType: 'application/json',
            responseSchema: chunkAnalysisSchema,
        });

        const updatedEntries = entries.map(originalEntry => {
            const analysisResult = analysisResults.find((r: any) => r.id === originalEntry.id);
            if (analysisResult) {
                return {
                    ...originalEntry,
                    kernaussage: analysisResult.kernaussage,
                    zugeordneteKategorien: analysisResult.zugeordneteKategorien,
                    begruendung: analysisResult.begruendung,
                };
            }
            return {
                ...originalEntry,
                kernaussage: "Error: No analysis result returned for this ID from the model.",
            };
        });

        return updatedEntries;

    } catch (error) {
        console.error(`Error analyzing chunk starting with ID ${entries[0]?.id}:`, error);
        throw new Error(`Failed to analyze chunk: ${error instanceof Error ? error.message : String(error)}`);
    }
}

const insightsSchema = {
    type: 'OBJECT',
    properties: {
        summary: {
            type: 'STRING',
            description: "A concise, well-structured summary of the key themes and findings from the provided protocol entries. It should be 2-4 paragraphs long and written in German Markdown."
        },
        insights: {
            type: 'ARRAY',
            description: "An array of exactly the top 3 most important or surprising key insights.",
            items: {
                type: 'OBJECT',
                properties: {
                    title: {
                        type: 'STRING',
                        description: "A short, impactful title for the insight (in German)."
                    },
                    description: {
                        type: 'STRING',
                        description: "A one-paragraph description of the insight, explaining its significance (in German)."
                    },
                    references: {
                        type: 'STRING',
                        description: "A comma-separated list of the 'Fragenummer' (#) that support this insight. For example: '#5, #12, #23'."
                    }
                },
                required: ["title", "description", "references"]
            }
        }
    },
    required: ["summary", "insights"]
};

export async function findKeyInsights(data: ParsedEntry[]): Promise<KeyInsights> {
    const analyzableData = data.filter(d => d.kernaussage && !d.note);

    if (analyzableData.length < 3) {
        throw new Error("Insufficient analyzed data. At least 3 analyzed entries are required to generate key insights.");
    }
    
    let qaCounter = 0;
    const entriesForPrompt: string[] = [];
    data.forEach(entry => {
        if (entry.note) {
            return; // Skip notes for counting and for prompt
        }
        qaCounter++;
        if (entry.kernaussage) {
            entriesForPrompt.push(`
                ---
                Entry #${qaCounter}
                Source: ${entry.sourceReference}
                Question: ${entry.question || 'N/A'}
                Answer: ${entry.answer || 'N/A'}
                Core Statement (Kernaussage): ${entry.kernaussage}
                Categories: ${entry.zugeordneteKategorien}
                Justification: ${entry.begruendung}
                ---
            `);
        }
    });
    
    const analysisText = entriesForPrompt.join('\n');


    const prompt = `
        **ROLLE & ZIEL**
        Du bist ein leistungsstarker KI-Analyst, spezialisiert auf die Analyse von politischen Protokollen und Dokumenten im Kontext des "ZwU-Nord Stream 2" in Mecklenburg-Vorpommern. Deine Analyseperspektive ist die eines progressiven Verteidigers der SPD. Dein Standpunkt ist, dass es sich um übliche Vorgänge handelt und die Vorwürfe wirklich bewiesen werden müssen. Gleichzeitig bist du offen für in den Vorwürfen enthaltene Kritiken. Du nimmst die Anschuldigungen nicht unbedingt als Wahrheit an, wenn ihnen keine legitime, kohärente Argumentation vorausgeht.
        Deine Aufgabe ist es, die dir vorgelegten analysierten Protokolleinträge zu synthetisieren und die wichtigsten strategischen Erkenntnisse auf hoher Ebene zu extrahieren. Du fasst nicht nur zusammen, sondern identifizierst die kritischsten, wirkungsvollsten und potenziell überraschendsten Ergebnisse.

        **KONTEXT**
        Die bereitgestellten Daten bestehen aus Frage-Antwort-Paaren, die bereits einzeln analysiert, zusammengefasst ("Kernaussage") und kategorisiert wurden. Das Thema ist die Nord Stream 2-Pipeline und ihre politischen Verflechtungen.

        **EINGABEDATEN**
        Hier ist die Sammlung der analysierten Einträge:
        ${analysisText}

        **AUFGABE**
        Führe auf der Grundlage ALLER bereitgestellten Einträge die folgenden beiden Aufgaben in deutscher Sprache aus:

        1.  **Erstelle eine umfassende Zusammenfassung:** Schreibe eine 2-4-Absatz-Zusammenfassung der Schlüsselthemen, wiederkehrenden Themen und der allgemeinen Erzählung, die sich aus den Daten ergibt. Diese Zusammenfassung sollte einen ganzheitlichen Überblick geben. Verwende deutsches Markdown zur Formatierung (z.B. **fett**).

        2.  **Identifiziere die Top 3 der wichtigsten Erkenntnisse:** Destilliere aus der Zusammenfassung die **drei wichtigsten, überraschendsten oder wirkungsvollsten Erkenntnisse**. Jede Erkenntnis muss haben:
            - Einen kurzen, überzeugenden **Titel**.
            - Eine ein-Absatz-**Beschreibung**, die die Erkenntnis und ihre Bedeutung erklärt.
            - Eine Liste von **Referenzen** auf die Eintragsnummern ('#'), die den Hauptbeweis für diese Erkenntnis liefern.

        Deine endgültige Ausgabe muss ein einziges, gültiges JSON-Objekt sein, das sich strikt an das bereitgestellte Schema hält. Füge keinen Text, keine Erklärungen oder Markdown außerhalb des JSON-Objekts ein.
    `;

    const result = await callGenerativeAIWithCorrection('gemini-2.5-pro', prompt, {
        responseMimeType: 'application/json',
        responseSchema: insightsSchema,
    });
    
    return result as KeyInsights;
}