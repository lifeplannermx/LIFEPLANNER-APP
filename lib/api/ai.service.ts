/**
 * AI Service — calls OpenAI directly from the app.
 * Handles diagnostic analysis and goal suggestions.
 */

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? "";
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? "gpt-4.1";

// ── Types ───────────────────────────────────────────────────────────

export interface AreaAnalysis {
  interpretation: string;
  diagnosis: string;
  recommendations: string[];
}

export interface SuggestedGoal {
  area_code: string;
  area_name: string;
  title: string;
  description: string;
  kpis: Array<{
    title: string;
    target_value: number;
    unit: string;
    frequency: "daily" | "weekly" | "monthly";
  }>;
}

export interface DiagnosticAIResult {
  area_analyses: Record<string, AreaAnalysis>;
  global_summary: string;
  patterns: string[];
  root_causes: string[];
  strengths: string[];
  weaknesses: string[];
  suggested_goals: SuggestedGoal[];
}

// ── Area definitions ────────────────────────────────────────────────

const AREAS = [
  { code: "financial", name: "Financiero", label: "Económico / Financiero", questions: [
    "¿El dinero que genero me permite darme algunos gustos?",
    "¿Tengo el hábito de ahorrar, invertir o destinar parte de mis ingresos a construir un patrimonio?",
    "¿Llevo un control de mis gastos y evito endeudarme innecesariamente?",
  ]},
  { code: "health", name: "Salud", label: "Salud", questions: [
    "¿Llevo un estilo de vida saludable?",
    "¿Cuido mi salud física y emocional buscando atención médica o profesional cuando lo necesito?",
    "¿Evito conductas que afectan mi bienestar, como el estrés, la agresividad o hábitos dañinos?",
  ]},
  { code: "family", name: "Familiar", label: "Familiar", questions: [
    "¿Disfruto la relación que tengo con mi familia y/o pareja?",
    "¿Mi relación familiar y/o de pareja se caracteriza por respeto y apoyo mutuo?",
    "En general, mi relación familiar es armónica y libre de conflictos graves.",
  ]},
  { code: "relationship", name: "Sentimental", label: "Sentimental", questions: [
    "¿Me siento bien conmigo mismo(a) y disfruto mi compañía, esté o no en una relación de pareja?",
    "¿Puedo reconocer, expresar y manejar mis emociones de forma saludable?",
    "¿Tengo una actitud positiva hacia la vida o suelo sentirme insatisfecho(a) o frustrado(a)?",
  ]},
  { code: "spiritual", name: "Espiritual", label: "Espiritual", questions: [
    "¿Me conozco a mí mismo(a) y soy consciente de mis pensamientos, emociones y acciones?",
    "¿Tengo creencias y valores que me inspiran a ayudar a otros y a encontrarle sentido a la vida?",
    "¿Mis acciones y creencias contribuyen positivamente a mi entorno y a las personas con las que convivo?",
  ]},
  { code: "professional", name: "Profesional", label: "Profesional", questions: [
    "¿Disfruto lo que hago y tengo oportunidades de aprendizaje, crecimiento y mejora en mi trabajo?",
    "¿Mantengo buenas relaciones y un ambiente positivo con mis compañeros y jefes?",
    "¿Cuento con condiciones laborales seguras, prestaciones adecuadas y un ingreso justo que me permita equilibrar vida y trabajo?",
  ]},
  { code: "social", name: "Social", label: "Social", questions: [
    "¿Disfruto mi vida social y destino tiempo suficiente para convivir con mis amistades?",
    "¿Cuento con amistades de confianza, constructivas y en las que puedo apoyarme?",
    "¿Mantengo una actitud abierta hacia la convivencia o tiendo a evitar reuniones y contactos sociales?",
  ]},
  { code: "leisure", name: "Tiempo libre", label: "Ocio y Tiempo Libre", questions: [
    "¿Dedico tiempo suficiente a actividades y pasatiempos que disfruto y me hacen sentir bien?",
    "¿Mantengo un equilibrio entre mi tiempo libre, mi trabajo y otras responsabilidades?",
    "Mis pasatiempos contribuyen positivamente a mi bienestar, mis relaciones y mi entorno.",
  ]},
];

// ── Build prompt ────────────────────────────────────────────────────

function buildPrompt(input: {
  gender: string;
  age: number;
  hasPartner: boolean;
  hasChildren: boolean;
  answers: Record<string, { scale: number[]; openText: string; average: number }>;
}): string {
  const { gender, age, hasPartner, hasChildren, answers } = input;

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

Recibirás la evaluación COMPLETA de un usuario en las 8 áreas de la Rueda de la Vida: puntajes numéricos (escala 1-5), promedios por área, y los comentarios abiertos donde el usuario describe en sus propias palabras su situación, retos y aspiraciones.

## CONTEXTO CRÍTICO QUE DEBES USAR:

1. **Perfil demográfico**: Edad, género, si tiene pareja, si tiene hijos. Esto cambia radicalmente las recomendaciones — no es lo mismo un estudiante soltero de 21 que un padre de familia de 40.

2. **Comentarios abiertos**: Son la fuente más rica de información. El usuario te dice QUÉ quiere mejorar, QUÉ le preocupa, QUÉ aspira. Analízalos con atención y úsalos para personalizar cada diagnóstico y recomendación.

3. **Análisis cruzado**: Tienes acceso a TODAS las áreas simultáneamente. Detecta cómo un problema en un área afecta a otras (ej: estrés laboral → afecta salud → afecta relación de pareja). Identifica patrones y causas raíz transversales.

## Tu tarea — genera TODO en una sola respuesta JSON:

### PARTE 1: 8 Diagnósticos individuales
Para CADA área genera:
- **interpretation**: (máx 500 chars) Analiza el comentario abierto del usuario para entender qué busca y qué le preocupa. Relaciona con los puntajes y con lo que pasa en otras áreas. Detecta fortalezas y áreas de oportunidad.
- **diagnosis**: (máx 500 chars) Situación actual clara, empática y motivadora. Debe reflejar lo que el usuario expresó en su comentario, no ser genérico.
- **recommendations**: 3 acciones concretas, simples, repetibles y personalizadas al contexto del usuario (máx 120 chars cada una). Deben ser implementables de inmediato.

### PARTE 2: Diagnóstico global
- **global_summary**: (4-6 líneas) Párrafo que resume la situación general del usuario y cómo interactúan sus áreas fuertes y débiles entre sí. Texto corrido natural, sin bullets ni numeración.
- **patterns**: Array de 3 strings. Cada patrón describe una conexión entre 2+ áreas en una frase natural (máx 120 chars). Sin numeración ni prefijos.
- **root_causes**: Array de 3 strings. Cada causa raíz en una frase directa (máx 120 chars). Sin numeración ni prefijos.

### PARTE 3: Fortalezas y áreas de oportunidad
- **strengths**: Array de 3 strings. Cada fortaleza en una frase corta y directa (máx 80 chars). Sin emojis. Enfocada en comportamientos o actitudes positivas del usuario.
- **weaknesses**: Array de 3 strings. Cada área de oportunidad en una frase corta y directa (máx 80 chars). Sin emojis. Enfocada en hábitos o patrones que limitan su progreso.

### PARTE 4: Metas sugeridas para 90 días
Basándote en TODO el análisis (puntajes + comentarios + perfil + patrones cruzados), sugiere las 3 metas más impactantes.
- Prioriza áreas con menor puntaje Y donde el usuario expresó mayor motivación de cambio en sus comentarios.
- Cada meta debe tener 2-3 actividades concretas y medibles, con frecuencia diaria o semanal preferentemente.
- Las metas deben ser específicas al perfil del usuario (edad, situación familiar, lo que él/ella expresó).
- Deben ser alcanzables en 90 días y generar impacto cruzado en varias áreas.

## Reglas:
- Tono cálido, empático y motivador.
- Evitar tecnicismos complejos.
- No recalcular promedios; usar los proporcionados.
- Si un comentario está vacío, usar solo el puntaje sin inventar contexto.
- Recomendaciones y actividades simples, sostenibles, con unidades claras (minutos, veces, pesos, litros, etc).
- Escala: 1=Nunca, 2=Casi nunca, 3=A veces, 4=Casi siempre, 5=Siempre.

## RESPONDE EXCLUSIVAMENTE EN JSON VÁLIDO con esta estructura exacta:

{
  "area_analyses": {
    "financial": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "health": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "family": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "relationship": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "spiritual": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "professional": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "social": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] },
    "leisure": { "interpretation": "...", "diagnosis": "...", "recommendations": ["...", "...", "..."] }
  },
  "global_summary": "Párrafo natural de 4-6 líneas...",
  "patterns": ["conexión entre áreas...", "...", "..."],
  "root_causes": ["causa raíz...", "...", "..."],
  "strengths": ["fortaleza...", "...", "..."],
  "weaknesses": ["área de oportunidad...", "...", "..."],
  "suggested_goals": [
    {
      "area_code": "health",
      "area_name": "Salud",
      "title": "Mejorar mi condición física",
      "description": "Establecer una rutina de ejercicio constante...",
      "kpis": [
        { "title": "Hacer ejercicio", "target_value": 30, "unit": "minutos", "frequency": "daily" },
        { "title": "Tomar agua", "target_value": 2, "unit": "litros", "frequency": "daily" }
      ]
    }
  ]
}

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

// ── Call OpenAI ─────────────────────────────────────────────────────

export async function analyzeAndSuggestGoals(input: {
  gender: string;
  age: number;
  hasPartner: boolean;
  hasChildren: boolean;
  answers: Record<string, { scale: number[]; openText: string; average: number }>;
}): Promise<{ data: DiagnosticAIResult | null; error: string | null }> {
  if (!OPENAI_API_KEY) {
    return { data: null, error: "OpenAI API key not configured" };
  }

  const prompt = buildPrompt(input);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: "Eres un analista experto en desarrollo personal. Responde SOLO con JSON válido, sin markdown ni texto adicional.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[AI] OpenAI error:", res.status, errText);
      return { data: null, error: `OpenAI error ${res.status}` };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      return { data: null, error: "Empty AI response" };
    }

    const parsed = JSON.parse(content) as DiagnosticAIResult;

    // Validate structure minimally
    if (!parsed.area_analyses || !parsed.suggested_goals) {
      return { data: null, error: "Invalid AI response structure" };
    }

    return { data: parsed, error: null };
  } catch (err) {
    console.error("[AI] Request failed:", err);
    return { data: null, error: (err as Error).message };
  }
}
