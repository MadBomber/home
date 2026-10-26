---
layout: blog_post
title: "El diablo de Dios: Introducción"
description: "La ficción le da a Satanás una mente que lee la tuya, un cuerpo que está en todas partes a la vez y un futuro que ya conoce. La Biblia no le da nada de eso. Esta introducción presenta la premisa de una colección de seis partes: en cada escena donde aparece Satanás, aparece dentro de un límite que Dios trazó."
date: 2026-09-01
author: Dewayne VanHoozer
collection: gods-devil
order: 0
tags:
- satan
- sovereignty
- temptation
- assurance
- job
- 1-peter
- john
- matthew
---

Pídele a cualquiera que describa al diablo y obtendrás un compuesto extraño. Una mente que lee la tuya antes de que termines de formar el pensamiento. Un cuerpo que puede estar tentando a un corredor de bolsa en Tokio y a un adolescente en Ohio a la misma hora. Una memoria de un futuro que ya ha visto, mucho antes de que tú llegues a vivirlo.

Casi nada de eso viene de la Biblia. La mayor parte viene de las películas de terror, de sermones a medio recordar y de una vaga sensación de que el enemigo de Dios debe ser, en algún nivel, el igual y el opuesto de Dios.

No lo es. Y la brecha entre la imagen prestada y la bíblica no es un tecnicismo. Es la diferencia entre una amenaza de la que solo puedes huir y una amenaza a la que realmente puedes hacer frente.

Abre una Biblia en lugar de una pantalla de cine y sale una figura más pequeña y más extraña. Tienta, pero no puede forzar una mano que no haya encontrado ya dispuesta. Ronda, pero no ocupa dos lugares a la vez. Trama, pero no conoce el mañana mejor que los humanos contra quienes trama. En cada escena de las Escrituras donde aparece, aparece dentro de un límite que Dios trazó primero.

> «Sean sobrios y velen. Su adversario, el diablo, como león rugiente, anda al acecho buscando a quién devorar».
>
> 1 Pedro 5:8 (NBLA)

<!-- VERIFY-NBLA -->

Ese versículo se cita como una advertencia, y lo es. También es, si se lee de cerca, la descripción de un animal que tiene que cazar. Un león que pudiera servirse sin más no necesitaría rondar, y no necesitaría buscar. El versículo que pretendía poner en guardia al lector acaba por conceder, en el mismo aliento, que la guardia tiene un terreno real donde apoyarse.

Esa concesión recorre toda la Biblia, no solo un versículo. Antes de que Satanás pueda tocar algo de Job, tiene que pedirlo, y Dios traza la línea antes de que salga de la sala. Antes de que pueda poner una mano sobre Jesús en el desierto, el Espíritu es quien puso a Jesús allí. Antes de que pueda reclamar un trono, tiene que admitir que el trono le fue entregado en lugar de haberlo construido él. Es peligroso. También está, dondequiera que el texto lo muestra trabajando, atado a la correa de Dios.

Eso tiene un nombre, y es una promesa, no solo una observación.

> «Yo les doy vida eterna, y jamás perecerán, ni nadie las arrebatará de Mi mano. Mi Padre, que me las ha dado, es mayor que todos; y nadie las puede arrebatar de la mano del Padre».
>
> Juan 10:28-29 (NBLA)

<!-- VERIFY-NBLA -->

La razón por la que importa la correa no es que haga inofensivo a Satanás. No necesita ser inofensivo para que esa promesa se sostenga. Necesita ser más pequeño que la mano que te sostiene, y las Escrituras jamás lo miden contra el tamaño de Dios. Lo miden contra el permiso de Dios.

Eso todavía deja una pregunta. Si la correa significa que Satanás nunca fue el peligro real, ¿cuál lo es? Jesús se lo dijo directamente a Sus propios seguidores, y no lo suavizó.

> «Y no teman a los que matan el cuerpo, pero no pueden matar el alma; más bien teman a Aquel que puede destruir tanto el alma como el cuerpo en el infierno».
>
> Mateo 10:28 (NBLA)

<!-- VERIFY-NBLA -->

El diablo, en su mejor día, solo alcanza el cuerpo, y solo hasta donde se lo permite su correa. Nunca fue candidato a lo que describe ese versículo. El que puede destruir alma y cuerpo siempre fue Dios, no Satanás. Pero es el mismo Dios que promete que nada te arrebata de Su mano. Es el único con el poder de acabarte por completo, y gastó a Su propio Hijo en una cruz para asegurarse de que nunca lo haría. Eso es lo que sucede cuando el temor apunta en la dirección correcta. No desaparece. Descansa en la única mano lo bastante fuerte para sostenerlo.

Esta colección sigue ese límite a lo largo de seis escenas: hasta dónde llega la correa y quién la sostiene, lo que el texto dice que él no puede hacer, lo que solo puede falsificar, por qué el pecado que ofrece sigue teniendo que ser tuyo, cómo un hombre en un desierto lo derrotó con argumentos, y por qué un enemigo ya derrotado todavía puede seguir peleando por un tiempo. El temor a Satanás suele venir de creer que es más grande de lo que es. Lo que sigue es un intento de verlo en su tamaño real.

---

<%
  is_production = Bridgetown.environment.to_s == "production"

  meses = %w[enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre]

  posts_by_order = site.resources
    .select  { |r| r.data[:collection].to_s == "gods-devil" && r.data[:locale].to_s == data.locale.to_s }
    .each_with_object({}) { |r, h| h[r.data[:order].to_i] = r }

  parts = [
    { order: 1, label: "Parte 1: El diablo con correa",
      blurb: "Las Escrituras lo llaman león rugiente y lo dicen en serio. También lo muestran pidiendo permiso antes de tocar una sola cosa que pertenezca a Job. Este ensayo sostiene ambos hechos a la vez, un peligro real y una correa real, y lo que esa combinación significa para el temor que mantiene despierto a un creyente." },
    { order: 2, label: "Parte 2: Satanás no es Dios",
      blurb: "No lo sabe todo. No está en todas partes. Observó de cerca el sufrimiento de un hombre y aun así adivinó mal cómo terminaría. Este ensayo pone la imagen popular de Satanás junto a la bíblica y mide la distancia entre ellas." },
    { order: 3, label: "Parte 3: Poder prestado",
      blurb: "Cada señal que realiza, alguien más la realizó primero. Cada afirmación que hace, el lenguaje de alguien más, tomado sin permiso. Este ensayo sigue sus señales hasta su origen y encuentra un piso duro debajo de la imitación." },
    { order: 4, label: "Parte 4: El diablo no te hizo hacerlo",
      blurb: "Entró en Judas. Llenó el corazón de Ananías. Leídos por separado, ambos versículos suenan como una toma hostil de la voluntad. Leídos junto a lo que cada hombre ya había elegido, describen algo más parecido a una puerta mantenida abierta que a una puerta derribada de una patada." },
    { order: 5, label: "Parte 5: Cómo discutir con el diablo",
      blurb: "Se encontró con un hombre en un desierto, hambriento y solo, y perdió tres veces seguidas. Este ensayo lee el intercambio jugada por jugada y pregunta qué hacía que el lado perdedor estuviera tan seguro de sí mismo, y qué hacía que el lado ganador estuviera seguro de otra cosa." },
    { order: 6, label: "Parte 6: El final ya está escrito",
      blurb: "Sabe que su tiempo es corto, porque alguien se lo dijo antes de que tuviera oportunidad de averiguarlo por sí mismo. Este ensayo cierra la colección donde ya se dirige toda la historia: un veredicto dictado antes de que la guerra terminara de librarse." },
  ]
%>

**El diablo de Dios: Contenido de la colección**

<% parts.each do |part| %>
<%
  post   = posts_by_order[part[:order]]
  locked = is_production && post && post.data[:date] && post.data[:date].to_date > Date.today
%>
<% if locked %>
**<%= part[:label] %>** (próximamente el <%= post.data[:date].day %> de <%= meses[post.data[:date].month - 1] %>)
<% else %>
[<%= part[:label] %>](<%= relative_url post.relative_url %>)
<% end %>
<%= part[:blurb] %>

<% end %>
<%
  first_post   = posts_by_order[1]
  first_locked = is_production && first_post && first_post.data[:date] && first_post.data[:date].to_date > Date.today
%>
<% if first_locked %>
El primer ensayo, *El diablo con correa*, se publica el <%= first_post.data[:date].day %> de <%= meses[first_post.data[:date].month - 1] %>.
<% else %>
La colección comienza con [*El diablo con correa*](<%= relative_url first_post.relative_url %>).
<% end %>
