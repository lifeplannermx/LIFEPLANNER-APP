/**
 * Edge Function: diagnostic-analyze
 *
 * Phase 1 — Full diagnostic analysis with cross-area context.
 * Receives all 24 scale answers + 8 open texts + demographics.
 * Generates 8 individual area analyses + global diagnosis + strengths/weaknesses
 * in a SINGLE AI call (full cross-area awareness).
 *
 * Updates the diagnostic_snapshot row with the AI results.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ── Area definitions (same order as migration 002) ──────────────────
const AREAS = [
  {
    code: "financial",
    name: "Financiero",
    label: "Económico / Financiero",
    specialty: "Finanzas Personales",
    avoidTerms: "tecnicismos financieros complejos",
    questions: [
      "¿El dinero que genero me permite darme algunos gustos?",
      "¿Tengo el hábito de ahorrar, invertir o destinar parte de mis ingresos a construir un patrimonio?",
      "¿Llevo un control de mis gastos y evito endeudarme innecesariamente?",
    ],
  },
  {
    code: "health",
    name: "Salud",
    label: "Salud",
    specialty: "Salud Física y Emocional",
    avoidTerms: "tecnicismos médicos complejos",
    questions: [
      "¿Llevo un estilo de vida saludable?",
      "¿Cuido mi salud física y emocional buscando atención médica o profesional cuando lo necesito?",
      "¿Evito conductas que afectan mi bienestar, como el estrés, la agresividad o hábitos dañinos?",
    ],
  },
  {
    code: "family",
    name: "Familiar",
    label: "Familiar",
    specialty: "Relaciones Familiares",
    avoidTerms: "tecnicismos psicológicos complejos",
    questions: [
      "¿Disfruto la relación que tengo con mi familia y/o pareja?",
      "¿Mi relación familiar y/o de pareja se caracteriza por respeto y apoyo mutuo?",
      "En general, mi relación familiar es armónica y libre de conflictos graves.",
    ],
  },
  {
    code: "relationship",
    name: "Sentimental",
    label: "Sentimental",
    specialty: "Relaciones Sentimentales y Bienestar Emocional",
    avoidTerms: "tecnicismos psicológicos complejos",
    questions: [
      "¿Me siento bien conmigo mismo(a) y disfruto mi compañía, esté o no en una relación de pareja?",
      "¿Puedo reconocer, expresar y manejar mis emociones de forma saludable?",
      "¿Tengo una actitud positiva hacia la vida o suelo sentirme insatisfecho(a) o frustrado(a)?",
    ],
  },
  {
    code: "spiritual",
    name: "Espiritual",
    label: "Espiritual",
    specialty: "Desarrollo Espiritual y Propósito de Vida",
    avoidTerms: "tecnicismos filosóficos o religiosos complejos",
    questions: [
      "¿Me conozco a mí mismo(a) y soy consciente de mis pensamientos, emociones y acciones?",
      "¿Tengo creencias y valores que me inspiran a ayudar a otros y a encontrarle sentido a la vida?",
      "¿Mis acciones y creencias contribuyen positivamente a mi entorno y a las personas con las que convivo?",
    ],
  },
  {
    code: "professional",
    name: "Profesional",
    label: "Profesional",
    specialty: "Desarrollo Profesional y Satisfacción Laboral",
    avoidTerms: "tecnicismos laborales o corporativos complejos",
    questions: [
      "¿Disfruto lo que hago y tengo oportunidades de aprendizaje, crecimiento y mejora en mi trabajo?",
      "¿Mantengo buenas relaciones y un ambiente positivo con mis compañeros y jefes?",
      "¿Cuento con condiciones laborales seguras, prestaciones adecuadas y un ingreso justo que me permita equilibrar vida y trabajo?",
    ],
  },
  {
    code: "social",
    name: "Social",
    label: "Social",
    specialty: "Relaciones Sociales y Vida Comunitaria",
    avoidTerms: "tecnicismos sociológicos complejos",
    questions: [
      "¿Disfruto mi vida social y destino tiempo suficiente para convivir con mis amistades?",
      "¿Cuento con amistades de confianza, constructivas y en las que puedo apoyarme?",
      "¿Mantengo una actitud abierta hacia la convivencia o tiendo a evitar reuniones y contactos sociales?",
    ],
  },
  {
    code: "leisure",
    name: "Tiempo libre",
    label: "Ocio y Tiempo Libre",
    specialty: "Gestión del Tiempo Libre, Recreación y Bienestar Personal",
    avoidTerms: "tecnicismos innecesarios",
    questions: [
      "¿Dedico tiempo suficiente a actividades y pasatiempos que disfruto y me hacen sentir bien?",
      "¿Mantengo un equilibrio entre mi tiempo libre, mi trabajo y otras responsabilidades?",
      "Mis pasatiempos contribuyen positivamente a mi bienestar, mis relaciones y mi entorno.",
    ],
  },
];

// ── Build the consolidated prompt ───────────────────────────────────
function buildPrompt(input: {
  gender: string;
  age: number;
  hasPartner: boolean;
  hasChildren: boolean;
  answers: Record<string, { scale: number[]; openText: string; average: number }>;
}): string {
  const { gender, age, hasPartner, hasChildren, answers } = input;

  // Build area data blocks
  const areaBlocks = AREAS.map((area) => {
    const data = answers[area.code];
    if (!data) return "";

    const questionsBlock = area.questions
      .map((q, i) => `  ${i + 1}. ${q}\n     Respuesta: ${data.scale[i]}`)
      .join("\n");

    return `
### ${area.label}
- Promedio: ${data.average.toFixed(2)}
${questionsBlock}
- Comentario del participante: "${data.openText || "(sin comentario)"}"`;
  }).join("\n");

  return `
Eres un analista experto en desarrollo personal y en la metodología LifePlanner aplicada a la Rueda de la Vida.

Recibirás la evaluación COMPLETA de un usuario en las 8 áreas de la Rueda de la Vida: respuestas numéricas (escala 1-5), promedios ya calculados y comentarios abiertos de cada área.

Tu ventaja: tienes acceso a TODAS las áreas simultáneamente, lo que te permite detectar conexiones, patrones cruzados y causas raíz que afectan múltiples áreas.

## Tu tarea (genera TODO en una sola respuesta):

### PARTE 1: 8 Diagnósticos individuales
Para CADA una de las 8 áreas, genera:
- **Interpretación:** (máx. 500 caracteres) Fortalezas, áreas de oportunidad y emociones. Relaciona con otras áreas cuando sea relevante.
- **Diagnóstico individual:** (máx. 500 caracteres) Situación actual clara, empática y motivadora.
- **Recomendaciones:** 3 acciones concretas, simples y repetibles (máx. 120 caracteres cada una).

### PARTE 2: Diagnóstico global
- **Diagnóstico global:** (7-10 líneas) Resumen de la situación general y cómo se interrelacionan los aspectos.
- **Patrones detectados:** 3 bullets con conexiones entre 2 o más aspectos.
- **Causas raíz:** 3 causas principales numeradas que afectan varias áreas.

### PARTE 3: Resumen breve
- **Fortalezas:** 3 fortalezas clave (comportamientos, actitudes o recursos internos).
- **Debilidades:** 3 áreas de oportunidad (obstáculos, hábitos o carencias).

## Reglas:
- Tono cálido, empático y motivador.
- Evitar tecnicismos complejos.
- No recalcular promedios; usar los proporcionados.
- Si un comentario está vacío, usar solo el puntaje.
- Recomendaciones simples y sostenibles (diarias, semanales o mensuales).
- Usar formato Markdown.
- Presentar listas en bullets.
- Usar negritas donde sea necesario.

## Formato de respuesta EXACTO:

===AREA:financial===
**Aspecto:** Económico / Financiero
**Promedio:** [valor]
**Comentario del usuario:** "[texto]"

**Interpretación:**
[máx. 500 caracteres]

**Diagnóstico individual:**
[máx. 500 caracteres]

**Recomendaciones:**
1. [120 chars max]
2. [120 chars max]
3. [120 chars max]

===AREA:health===
[mismo formato...]

===AREA:family===
[mismo formato...]

===AREA:relationship===
[mismo formato...]

===AREA:spiritual===
[mismo formato...]

===AREA:professional===
[mismo formato...]

===AREA:social===
[mismo formato...]

===AREA:leisure===
[mismo formato...]

===GLOBAL===
**Diagnóstico global:**
[7-10 líneas]

**Patrones detectados:**
- [patrón 1]
- [patrón 2]
- [patrón 3]

**Causas raíz:**
1. [causa 1]
2. [causa 2]
3. [causa 3]

===SUMMARY===
**Fortalezas:**
🟢 [fortaleza 1]
🟢 [fortaleza 2]
🟢 [fortaleza 3]
**Debilidades:**
🔴 [debilidad 1]
🔴 [debilidad 2]
🔴 [debilidad 3]

## INPUT:

### Contexto del usuario
- Género: ${gender}
- Edad: ${age} años
- ¿Tiene pareja sentimental? ${hasPartner ? "Sí" : "No"}
- ¿Tiene hijos? ${hasChildren ? "Sí" : "No"}

### Escala: 1=Nunca, 2=Casi nunca, 3=A veces, 4=Casi siempre, 5=Siempre

### Datos por área:
${areaBlocks}
`.trim();
}

// ── Parse AI response into structured data ──────────────────────────
function parseResponse(text: string): {
  areaAnalyses: Record<string, string>;
  globalDiagnosis: string;
  strengthsWeaknesses: string;
} {
  const areaAnalyses: Record<string, string> = {};

  // Extract each area block
  for (const area of AREAS) {
    const marker = `===AREA:${area.code}===`;
    const startIdx = text.indexOf(marker);
    if (startIdx === -1) continue;

    const contentStart = startIdx + marker.length;

    // Find the next section marker
    const nextMarkers = [
      ...AREAS.map((a) => `===AREA:${a.code}===`),
      "===GLOBAL===",
      "===SUMMARY===",
    ];
    let endIdx = text.length;
    for (const nm of nextMarkers) {
      const idx = text.indexOf(nm, contentStart);
      if (idx !== -1 && idx < endIdx) endIdx = idx;
    }

    areaAnalyses[area.code] = text.slice(contentStart, endIdx).trim();
  }

  // Extract global diagnosis
  let globalDiagnosis = "";
  const globalIdx = text.indexOf("===GLOBAL===");
  if (globalIdx !== -1) {
    const gStart = globalIdx + "===GLOBAL===".length;
    const summaryIdx = text.indexOf("===SUMMARY===", gStart);
    globalDiagnosis = text.slice(gStart, summaryIdx !== -1 ? summaryIdx : text.length).trim();
  }

  // Extract summary
  let strengthsWeaknesses = "";
  const summaryIdx = text.indexOf("===SUMMARY===");
  if (summaryIdx !== -1) {
    strengthsWeaknesses = text.slice(summaryIdx + "===SUMMARY===".length).trim();
  }

  return { areaAnalyses, globalDiagnosis, strengthsWeaknesses };
}

// ── Handler ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const body = await req.json();
    const { snapshot_id, user_id, gender, age, has_partner, has_children, answers } = body;

    if (!snapshot_id || !user_id || !answers) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build prompt
    const prompt = buildPrompt({
      gender: gender || "No especificado",
      age: age || 0,
      hasPartner: !!has_partner,
      hasChildren: !!has_children,
      answers,
    });

    // Call OpenAI
    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
        temperature: 0.2,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(`OpenAI error ${openaiRes.status}: ${errText}`);
    }

    const openaiJson = await openaiRes.json();

    // Extract text from response
    let outputText = "";
    if (openaiJson.output_text) {
      outputText = openaiJson.output_text;
    } else if (Array.isArray(openaiJson.output)) {
      for (const item of openaiJson.output) {
        if (Array.isArray(item?.content)) {
          for (const c of item.content) {
            if (c?.text) { outputText = c.text; break; }
          }
        }
        if (outputText) break;
      }
    }

    if (!outputText || outputText.length < 100) {
      throw new Error("AI response too short or empty");
    }

    // Parse structured response
    const parsed = parseResponse(outputText);

    // Update snapshot in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error: updateError } = await supabase
      .from("diagnostic_snapshots")
      .update({
        area_analyses: parsed.areaAnalyses,
        global_diagnosis: parsed.globalDiagnosis,
        strengths_weaknesses: parsed.strengthsWeaknesses,
      })
      .eq("id", snapshot_id)
      .eq("user_id", user_id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({
        status: "ok",
        snapshot_id,
        areas_analyzed: Object.keys(parsed.areaAnalyses).length,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
