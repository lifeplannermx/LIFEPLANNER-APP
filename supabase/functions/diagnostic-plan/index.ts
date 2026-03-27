/**
 * Edge Function: diagnostic-plan
 *
 * Phase 2 — Action plan generation.
 * Reads the snapshot's global_diagnosis and area_analyses,
 * generates a structured action plan, and saves it.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") || "gpt-4o";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function buildPrompt(input: {
  gender: string;
  age: number;
  hasPartner: boolean;
  hasChildren: boolean;
  globalDiagnosis: string;
  areaAnalyses: Record<string, string>;
  scores: Record<string, { percentage: number; area_name: string }>;
}): string {
  const { gender, age, hasPartner, hasChildren, globalDiagnosis, areaAnalyses, scores } = input;

  const scoresBlock = Object.entries(scores)
    .map(([code, s]) => `- ${s.area_name}: ${(s.percentage / 20).toFixed(2)} de 5`)
    .join("\n");

  const analysesBlock = Object.entries(areaAnalyses)
    .map(([code, text]) => `### ${code}\n${text}`)
    .join("\n\n");

  return `
Eres un especialista en desarrollo personal y en la metodología LifePlanner.
Tu única tarea es diseñar un plan de acción integral a partir de la información proporcionada.

Recibirás:
- Contexto del usuario.
- Promedios numéricos por área.
- 8 diagnósticos individuales.
- Diagnóstico global (incluyendo patrones y causas raíz).

Objetivo:
- Generar un plan de acción detallado, práctico, claro y aplicable que ayude al usuario a mejorar de manera integral, con foco en las áreas prioritarias.
- Proponer acciones simples y sostenibles que, repetidas en el tiempo, produzcan un impacto positivo en varias áreas de su vida.
- Dividir el plan en acciones diarias, semanales y mensuales.
- Cada acción debe indicar entre paréntesis el tiempo estimado (ej: "20 min").

Requerimientos especiales:
- Invita al usuario a plasmar su plan de acción en su LIFE PLANNER.
- No recalcular promedios ni alterar evaluaciones; usa los diagnósticos como guía.
- Tono positivo, empático y motivador.
- Acciones claras, breves, implementables de inmediato, sin recursos complejos.
- Presentar listas en bullets.
- Usar negritas donde sea necesario.
- Usar formato Markdown.
- No debe exceder los 2000 caracteres o 350 palabras.

Formato de respuesta esperado:

**Objetivo principal:** [Objetivo detallado, claro y alineado al perfil del usuario. 2-3 líneas máximo.]

**4 Acciones diarias:**
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]

**3 Acciones semanales:**
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]

**2 Acciones mensuales:**
- [acción + (tiempo estimado)]
- [acción + (tiempo estimado)]

Llévalo hoy a tu LIFE PLANNER: bloquea horarios fijos y marca cada hábito con un check diario.

INPUT:

CONTEXTO DEL USUARIO
- Género: ${gender}
- Edad: ${age} años
- ¿Tiene pareja sentimental? ${hasPartner ? "Sí" : "No"}
- ¿Tiene hijos? ${hasChildren ? "Sí" : "No"}

PROMEDIOS NUMÉRICOS
${scoresBlock}

8 DIAGNÓSTICOS INDIVIDUALES:
${analysesBlock}

DIAGNÓSTICO GLOBAL:
${globalDiagnosis}
`.trim();
}

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
    const { snapshot_id, user_id } = body;

    if (!snapshot_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing snapshot_id or user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch snapshot data
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: snapshot, error: fetchError } = await supabase
      .from("diagnostic_snapshots")
      .select("*")
      .eq("id", snapshot_id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !snapshot) {
      throw new Error(`Snapshot not found: ${fetchError?.message || "no data"}`);
    }

    if (!snapshot.global_diagnosis) {
      throw new Error("Global diagnosis not yet generated. Run diagnostic-analyze first.");
    }

    // Fetch user profile for demographics
    const { data: profile } = await supabase
      .from("profiles")
      .select("gender, birth_year, has_partner, has_children")
      .eq("id", user_id)
      .single();

    const currentYear = new Date().getFullYear();
    const age = profile ? currentYear - (profile.birth_year || 1990) : 0;

    const prompt = buildPrompt({
      gender: profile?.gender || "No especificado",
      age,
      hasPartner: !!profile?.has_partner,
      hasChildren: !!profile?.has_children,
      globalDiagnosis: snapshot.global_diagnosis,
      areaAnalyses: snapshot.area_analyses || {},
      scores: snapshot.scores || {},
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

    if (!outputText || outputText.length < 50) {
      throw new Error("AI response too short or empty");
    }

    // Save action plan
    const { error: updateError } = await supabase
      .from("diagnostic_snapshots")
      .update({ action_plan: outputText.trim() })
      .eq("id", snapshot_id)
      .eq("user_id", user_id);

    if (updateError) {
      throw new Error(`DB update failed: ${updateError.message}`);
    }

    return new Response(
      JSON.stringify({ status: "ok", snapshot_id }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
