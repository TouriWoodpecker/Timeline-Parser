import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEntry } from "../types";
import { callGenerativeAI } from "./aiUtils";


// Initialize the Google AI client
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error)  {
  console.error("Failed to initialize GoogleGenAI. Make sure API_KEY is set in environment variables.", error);
}

const chunkAnalysisSchema = {
    type: Type.ARRAY,
    description: "An array of analysis results, one for each entry in the input chunk.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.NUMBER,
                description: "The original ID of the entry being analyzed."
            },
            kernaussage: {
                type: Type.STRING,
                description: "Deine prägnante Zusammenfassung der Kernaussage.",
            },
            zugeordneteKategorien: {
                type: Type.STRING,
                description: "Nummer(n) aus dem Wissenskorpus, z.B. '7(a); 19(b)' ODER 'Irrelevant / Prozedural'.",
            },
            begruendung: {
                type: Type.STRING,
                description: "Deine kurze Begründung, warum der Inhalt zur Kategorie passt ODER warum er prozedural ist.",
            },
        },
        required: ["id", "kernaussage", "zugeordneteKategorien", "begruendung"],
    }
};


export async function analyzeEntries(entries: ParsedEntry[]): Promise<ParsedEntry[]> {
    if (!ai) {
        throw new Error("GoogleGenAI client not initialized. Check API key configuration.");
    }
    if (entries.length === 0) {
        return [];
    }

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
Dein einziger Referenzrahmen für die Spalte "Zugeordnete Kategorie(n)" ist das folgende "Zwischenfazit der Grünen". Nur die Nummern dieser Punkte (z.B. "1(a)", "7", "18(b)") dürfen verwendet werden.

[START WISSENSKORPUS]
Teil 1: Nord Stream 2 – Termine, politische Kontakte und Einflussnahme
1 Kontakte der Landesregierung (auch Behörden, Ministerien) zu Nord Stream 2
1 (a) Die Landesregierung verschwieg Kontakte zu Nord Stream 2 und wurde dafür gerügt.
1 (b) Schwesig verschleierte Gespräche beispielsweise mit Schröder und Warnig über Nord Stream 2.
2 Frühere Planungen und Einfluss der politischen Lage
2 (a) Die Landesregierung förderte frühzeitig (ab 2012) Nord Stream Stränge 3 und 4 trotz Genehmigungsrisiken durch Parallelprojekte.
2 (b) Christian Pegels Einsatz ist außergewöhnlich stark ausgeprägt.
2 (c) Nord Stream 2 Planung stoppte kurz vor Krim-Annexion, Begründung unplausibel.
2 (e) Merkel signalisierte Putin Unterstützung für Nord Stream, obwohl die Planungen eigentlich eingestellt waren.
3 Russlandnähe unter Ministerpräsident Sellering
3 (a) Trotz geringerem Handel förderte die Landesregierung Geschäfte mit Russland überproportioniert stark, teilweise mit gasfreundlichen Lobbyisten.
3 (b) Sellering kooperierte trotz Krim-Annexion und intensivierte seine Verbindungen heimlich mit Schröder im Schiffbau.
3 (c) Der Werftenkäufer Jussufow war Putins Vertrauter und Nord-Stream-Leiter.
4 Unterstützung der Landesregierung für Nord Stream 2
4 (a) Sellering veranlasste Unterstützung für Nord Stream 2, leugnete dies aber später.
4 (b) Sellering leugnet Gespräche über Nord Stream 2, obwohl Vermerke Gegenteil belegen.
4 (c) Sellering bestritt Pläne der Staatskanzlei für ein Putin-Treffen über Warnig.
5 Einflussnahme im Genehmigungsverfahren
5 (a) Behörden räumten für Nord Stream 2 Hindernisse weg, unter Druck und mit fragwürdigen Maßnahmen:
• (b) Küstenschutzmaßnahmen wurden verschoben.
• (c) Ein bislang umstrittenes Prüfverfahren wurde zugelassen.
• (d) Die Bundeswehr wurde unter Druck gesetzt, vertrauliche Daten bereitzustellen.
• (e) Ein Ostseegebiet wurde vorsorglich zum „Natura-2000-Gebiet“ erklärt, um Ausgleichsmaßnahmen für Nord Stream 2 zu ermöglichen.
5 (f) Druck auf Pegel, dieser ignorierte (Rechts-)risiken bei Nord Stream 2 Genehmigung.
6 Politisches Engagement zugunsten des Projekts
6 (a) Die Landesregierung setzte sich (u.a. Bundespolitisch) erfolglos und vielseitig für Nord Stream 2 ein.
6 (b) Landesregierung widersprach sich: Gasbedarf hoch, doch Kohleimporte sollten massiv steigen.
7 Sicherheitszertifizierung
7 (a) Bruder des wirtschaftlichen Geschäftsführers der Klimastiftung MV und Ex-Mitarbeiter von Nord Stream 2 zertifizierten umstrittene Gasleitung.
7 (b) Das Zertifizierungsverfahren zur Überprüfung der Pipeline ist nicht geeignet gewesen und wurde dennoch angewendet.
8 Entstehung der Stiftung Klima- und Umweltschutz MV
8 (a) Nord Stream 2 initiierte die Stiftung und erarbeitete die Satzung, nicht Christian Pegel.
8 (b) Pegel nutzte Nord-Stream-2-Vorlagen und log darüber öffentlich.
8 (c) Nord Stream 2, in Form von Petersen, ehemaliger Berater für Nord Stream 2, konzipierte den Geschäftsbetrieb.
8 (d) Schwesig stoppte die Gründung der Stiftung, da Glawe die Kanzlerin entgegen Absprache nicht informierte.
8 (e) Auf Druck von Nord Stream 2 wollte die Landesregierung mit Privatpersonen statt des Landes eine Stiftung für Nord Stream 2 gründen.
Teil 2: Stiftung Klima- und Umweltschutz MV – wirtschaftlicher Betrieb, 9 Finanzierung und politische Verantwortung
Einfluss von Nord Stream 2 auf Stiftungsgeschäftsführung und Organisation
9 (a) Nord Stream 2 beeinflusste die Stiftung personell; Petersen wurde ohne Ausschreibung Geschäftsführer.
9 (b) Die Stiftungsführung hatte keine Kontrolle über den wirtschaftlichen Geschäftsbetrieb von Nord Stream 2. Die Kontrolle lag indirekt bei Nord Stream 2.
9 (c) Der Geschäftsführer vergab ohne Konsequenzen oder Bedenken Millionenaufträge an eigene und familiäre Unternehmen.
9 (d) Rostock täuschte Bürgerschaft bei Mageb Kai über Nord Stream 2 und verzögerte Aktenherausgabe.
9 (e) Minister Pegel leugnete zunächst Informationen zur ROKAI-Ansiedlung, was er später einräumte.
9 (f) ROKAI wurde für Nord Stream 2 gegründet, obwohl ein ehemaliger Geschäftsführer dies abstritt.
10 „Kamingate“ und Umgang mit Steuerunterlagen
10 (a) Finanzminister Geue verschwieg Parlament Steuerdetails trotz öffentlicher Bekanntheit und Mängeln in Finanzbehörden.
10 (b) Der Vorgang deutet auf eine bewusste Vertuschung hin, worüber die Ministerpräsidentin informiert gewesen sein könnte.
10 (c) Die 20-Millionen-Euro-Schenkungssteuer bei der Stiftungsgründung wurde trotz fehlender Gemeinnützigkeit nicht thematisiert.
10 (d) Die Stiftung diente vorrangig Nord Stream 2, nicht dem Klimaschutz, wie der Schenkungssteuerbescheid belegt.
10 (e) Der Stiftungsvorstand Sellering bezeichnete den Bescheid als politisch motiviert.
11 Öffentliche Kommunikation und Täuschung
11 (a) Die Öffentlichkeit wurde über Zweck und Umfang der Stiftung getäuscht.
11 (b) Minister Pegel verschleierte die wirtschaftliche Tätigkeit der Stiftung, die intern bereits beschlossen war.
11 (c) Die Stiftung verschleierte wirtschaftliche Aktivitäten zur Abwicklung eines Millionen-Investitionsstaus für Nord Stream 2.
11 (d) Die Landesregierung unterstützte die Stiftung aktiv, obwohl diese unabhängig arbeiten sollte.
11 (e) Landesregierung verschwieg entlastende Informationen zu den Sanktionsdrohungen gegen den Fährhafen Sassnitz.
11 (f) Die Klimastiftung diente der Absicherung von Nord Stream 2 und nicht dem Schutz heimischer Unternehmen.
11 (g) Die Staatskanzlei verschleierte wirtschaftliche Gründe der Stiftung, um Nord Stream 2 zu ermöglichen.
Teil 3: Stiftung nach Kriegsbeginn – Auflösung, Rechtsgutachten und politische Einflussnahme
12 Auflösung der Stiftung und Rechtsgutachten
12 (a) Die Klimastiftung steht wegen Sittenwidrigkeit aufgrund ihrer engen Russland-Verbindungen in der Kritik.
12 (b) Die Landesregierung mischte sich böswillig in den Gutachtenprozess ein.
12 (c) Die Landesregierung löschte gezielt Hinweise auf frühere Gutachtenversionen und Arbeitsgespräche, um Einflussnahme zu verschleiern.
13 Satzungsänderung der Stiftung
13 (a) Die Landesregierung stimmte einer Satzungsänderung zu, die eine Auflösung der Nord Stream 2 Stiftung verhindert.
13 (b) Stiftungsaufsicht war nicht gezwungen die Satzung zu ändern und tat dies auf Geheiß der Landesregierung.
14 Abwicklung des wirtschaftlichen Geschäftsbetriebs
14 (a) Die Stiftung erhielt nach Kriegsbeginn Millionen von Nord Stream 2, ohne Stiftungsaufsicht.
14 (b) Die Stiftung legte ein Gutachten vor, um Einnahmen von Nord Stream 2 in Millionenhöhe zu ermöglichen.
14 (c) Gerhard Schröder, Steffen Ebert und Matthias Warnig haben alle einen Nord Stream 2-Bezug.
15 Beteiligung von Christian Pegel an Kanzlei Hardtke, Svennsson & Partner
15 (a) Christian Pegel soll seine frühere Kanzlei bei Auftragsvergabe durch die Landesregierung begünstigt haben.
16 Frank Hardtke, Art Hotel Moskau und internationale Kontakte
16 (a) Christian Pegel hat über die Kanzei Hardtke, Svennsson & Partner Kontakte zu russischen Unternehmen.
17 Parteispenden und politische Dimension
17 (a) Christian Pegel spendete hohe Summen an die SPD, zeitgleich mit dem Nord Stream 2 Antragsverfahren in MV, um deren Erfolg zu gewährleisten.
18 Gelöschte E-Mails, SMS und Messenger-Daten
18 (a) Pegel löschte als Energieminister regelmäßig E-Mails, vermutlich auch relevante nach Einsetzung des Untersuchungsausschusses um Beweise zu vernichten.
18 (b) E-Mails von Ministern und der Ministerpräsidentin wurden nach Amtsende unrechtmäßig gelöscht, was gegen das Archivgesetz verstößt, um Beweise zu vernichten.
19 Fehlende Dokumentation von Gesprächen
19 (a) Wichtige Gespräche zwischen Regierungsvertretern und Nord Stream 2 blieben undokumentiert.
19 (b) Die Stiftung legt interne Dokumente nicht vollständig offen und verbietet Vertragspartnern die Offenlegung von Verträgen.
[ENDE WISSENSKORPUS]

3. Ausführungsregeln
Input: Du erhältst einen Block von mehreren aufeinanderfolgenden Frage-Antwort-Paaren. Nutze den Kontext der umgebenden Einträge, um jeden einzelnen Eintrag besser zu verstehen.
Verarbeitung (Dein "Chain of Thought" für JEDEN EINZELNEN Eintrag):
a. Lies den Eintrag und identifiziere die zentrale(n) Kernaussage(n). Wer (Akteur) tut was (Sachthema)?
b. Vergleiche den semantischen Inhalt (Akteure und Sachthema) dieser Kernaussage mit den Punkten 1-19 des Wissenskorpus.
c. Finde die spezifische(n) Kategorie(n)-Nummer(n), die den Inhalt beschreiben. (z.B. wenn es sich um "Pegel" und "gelöschte E-Mails" geht, finde "18(a)").
Sonderfall "Irrelevant / Prozedural":
- Wenn eine Aussage keine inhaltliche Substanz zu einem Sachthema oder Akteur liefert, oder ausschließlich eine prozedurale Rückfrage (z.B. "Von wann ist das?"), eine Zeitangabe (z.B. "Das war 2021.") oder eine reine Gesprächsfloskel ist, klassifiziere sie als "Irrelevant / Prozedural".
- Sei besonders gründlich bei der Anwendung der Punkte 19, 19 a, 19 b. Wenn es sich nicht um Regierungsvertreter (19 a) handelt oder die Klimastiftung (19 b), oder Fehlende Dokumentation (19), dann fällt generelle Kommunikation nicht unter einen dieser Punkte.
- Wenn eine Aussage auf eine bereits getätigte Aussage im selben Input-Text basiert ohne etwas substantielles hinzuzufügen, verweise auf die bereits getätigte Einordnung von dir. (Beispielsweise: "s. Fr. / Ant. 170")

**Input-Block zur Analyse:**
${entriesToAnalyzeString}

**Output-Format:**
Dein Output muss ausschließlich ein valides JSON-Array sein. Jedes Objekt im Array repräsentiert einen analysierten Eintrag aus dem Input-Block und muss dem Schema entsprechen. Das Array muss exakt einen Eintrag für jeden Input-Eintrag enthalten.
        `;

        // FIX: Updated deprecated model name from gemini-1.5-pro to gemini-2.5-pro.
        const responseText = await callGenerativeAI(ai, 'gemini-2.5-pro', prompt, {
            responseMimeType: 'application/json',
            responseSchema: chunkAnalysisSchema,
        });

        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        const analysisResults = JSON.parse(cleanedJsonString);

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