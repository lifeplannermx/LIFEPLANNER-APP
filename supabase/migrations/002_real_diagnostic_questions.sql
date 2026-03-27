-- ============================================
-- MIGRATION 002: Replace sample questions with real diagnostic questions
-- ============================================

-- Clear sample questions
delete from public.diagnostic_questions;

-- ============================================
-- FINANCIERO
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'El dinero que genero me permite darme algunos gustos.', 1, 5, 1
from public.life_areas where code = 'financial';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Tengo el habito de ahorrar, invertir o destinar parte de mis ingresos a construir un patrimonio.', 1, 5, 2
from public.life_areas where code = 'financial';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Llevo un control de mis gastos y evito endeudarme innecesariamente.', 1, 5, 3
from public.life_areas where code = 'financial';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto FINANCIERO.', null, null, 4
from public.life_areas where code = 'financial';

-- ============================================
-- SALUD
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Llevo un estilo de vida saludable.', 1, 5, 1
from public.life_areas where code = 'health';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Cuido mi salud fisica y emocional buscando atencion medica o profesional cuando lo necesito.', 1, 5, 2
from public.life_areas where code = 'health';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Evito conductas que afectan mi bienestar, como el estres, la agresividad o habitos daninos.', 1, 5, 3
from public.life_areas where code = 'health';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu SALUD.', null, null, 4
from public.life_areas where code = 'health';

-- ============================================
-- FAMILIAR
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Disfruto la relacion que tengo con mi familia.', 1, 5, 1
from public.life_areas where code = 'family';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mi relacion familiar y/o de pareja se caracteriza por respeto y apoyo mutuo.', 1, 5, 2
from public.life_areas where code = 'family';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'En general, mi relacion familiar es armonica y libre de conflictos graves.', 1, 5, 3
from public.life_areas where code = 'family';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto FAMILIAR.', null, null, 4
from public.life_areas where code = 'family';

-- ============================================
-- SENTIMENTAL
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Me siento bien conmigo mismo(a) y disfruto mi compania, este o no en una relacion de pareja.', 1, 5, 1
from public.life_areas where code = 'relationship';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Puedo reconocer, expresar y manejar mis emociones de forma saludable.', 1, 5, 2
from public.life_areas where code = 'relationship';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Tengo una actitud positiva hacia la vida.', 1, 5, 3
from public.life_areas where code = 'relationship';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto SENTIMENTAL.', null, null, 4
from public.life_areas where code = 'relationship';

-- ============================================
-- ESPIRITUAL
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Me conozco a mi mismo(a) y soy consciente de mis pensamientos, emociones y acciones.', 1, 5, 1
from public.life_areas where code = 'spiritual';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Tengo creencias y valores que me inspiran a ayudar a otros y a encontrarle sentido a la vida.', 1, 5, 2
from public.life_areas where code = 'spiritual';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mis acciones y creencias contribuyen positivamente a mi entorno y a las personas con las que convivo.', 1, 5, 3
from public.life_areas where code = 'spiritual';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto ESPIRITUAL.', null, null, 4
from public.life_areas where code = 'spiritual';

-- ============================================
-- PROFESIONAL
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Disfruto lo que hago y tengo oportunidades de aprendizaje, crecimiento y mejora en mi trabajo.', 1, 5, 1
from public.life_areas where code = 'professional';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mantengo buenas relaciones y un ambiente positivo con mis companeros y jefes.', 1, 5, 2
from public.life_areas where code = 'professional';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Cuento con condiciones laborales seguras, prestaciones adecuadas y un ingreso justo que me permita equilibrar vida y trabajo.', 1, 5, 3
from public.life_areas where code = 'professional';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto PROFESIONAL.', null, null, 4
from public.life_areas where code = 'professional';

-- ============================================
-- SOCIAL
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Disfruto mi vida social y destino tiempo suficiente para convivir con mis amistades.', 1, 5, 1
from public.life_areas where code = 'social';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Cuento con amistades de confianza, constructivas y en las que puedo apoyarme.', 1, 5, 2
from public.life_areas where code = 'social';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mantengo una actitud abierta hacia la convivencia social.', 1, 5, 3
from public.life_areas where code = 'social';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu aspecto SOCIAL.', null, null, 4
from public.life_areas where code = 'social';

-- ============================================
-- TIEMPO LIBRE
-- ============================================
insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Dedico tiempo suficiente a actividades y pasatiempos que disfruto y me hacen sentir bien.', 1, 5, 1
from public.life_areas where code = 'leisure';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mantengo un equilibrio entre mi tiempo libre, mi trabajo y otras responsabilidades.', 1, 5, 2
from public.life_areas where code = 'leisure';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'scale', 'Mis pasatiempos contribuyen positivamente a mi bienestar, mis relaciones y mi entorno.', 1, 5, 3
from public.life_areas where code = 'leisure';

insert into public.diagnostic_questions (life_area_id, question_type, prompt, scale_min, scale_max, sort_order)
select id, 'open', 'Platicanos un poco mas de ti y de tu opinion personal o sobre que mas quisieras lograr, corregir o mencionar sobre tu TIEMPO LIBRE.', null, null, 4
from public.life_areas where code = 'leisure';
