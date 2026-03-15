# Propuesta Ejecutiva: Data Annotation para Mejorar Generacion 360 Equirectangular

## 1. Objetivo

Construir un dataset de anotacion de calidad para entrenar o realimentar modelos generativos que hoy producen imagenes "panoramicas" visualmente plausibles, pero geometricamente incorrectas para un formato 360 equirectangular de alta calidad.

La propuesta usa la app `Prism 360` como herramienta de inspeccion para evaluar cada imagen por sectores y capturar evidencia estructurada sobre:

- consistencia geometrica;
- continuidad entre sectores;
- curvaturas esperadas;
- deformacion cerca de polos;
- stitching, simetria y plausibilidad espacial.

El objetivo no es solo clasificar "buena o mala", sino generar feedback util para entrenamiento: **que sector fallo, como fallo, donde fallo y por que viola el formato 360**.

## 2. Que es una imagen 360 en formato plano

Una imagen 360 equirectangular representa toda la esfera en un rectangulo 2:1.

- ancho `W`: cubre `360 grados` de longitud;
- alto `H`: cubre `180 grados` de latitud;
- relacion correcta: `W = 2H`.

Interpretacion geometrica:

- eje horizontal: longitud `lambda` en `[-pi, pi]`;
- eje vertical: latitud `phi` en `[+pi/2, -pi/2]`;
- borde izquierdo y borde derecho son la misma costura espacial;
- borde superior representa el polo norte;
- borde inferior representa el polo sur.

Transformacion basica de plano a esfera:

```text
u = x / W
v = y / H

lambda = 2pi(u - 0.5)
phi = pi(0.5 - v)

X = cos(phi) * sin(lambda)
Y = sin(phi)
Z = cos(phi) * cos(lambda)
```

Implicancia practica: una imagen 360 "correcta" no se evalua solo por fotorealismo. Se evalua por si respeta la geometria de la proyeccion esferica cuando se vuelve a mapear sobre la esfera.

## 3. Conceptos geometricos que debe respetar una imagen 360

Una imagen generica equirectangular de calidad debe cumplir, como minimo, estos principios:

- **Continuidad horizontal**: el borde izquierdo y el derecho deben cerrar sin salto de color, forma o perspectiva.
- **Coherencia entre sectores**: `front`, `right`, `back` y `left` deben representar una unica escena continua.
- **Comportamiento correcto de lineas**: horizontes, mesas, techos y uniones de pared pueden verse curvos en plano, pero deben ser coherentes al reproyectarse.
- **Polos estables**: en `top` y `bottom` la deformacion aumenta; no debe aparecer colapso caotico, duplicacion de objetos ni geometria imposible.
- **Escala y perspectiva consistentes**: un mismo objeto no puede cambiar de tamano o orientacion de forma abrupta al cruzar sectores.
- **Semantica espacial**: si existe una habitacion, los elementos deben mantener continuidad de layout, iluminacion y estructura.

## 4. Propuesta de data annotation

### 4.1 Unidad de anotacion

Cada imagen genera:

1. una evaluacion global;
2. una evaluacion por sector: `front`, `right`, `back`, `left`, `top`;
3. evidencia localizada para retroalimentacion al modelo.

### 4.2 Dimensiones a etiquetar

Para cada sector, registrar:

- `sector_score` de `1-5`
- `geometry_score` de `1-5`
- `continuity_score` de `1-5`
- `pole_behavior_score` de `1-5` cuando aplique
- `major_defects` con taxonomia fija
- `justification` breve, concreta y observable
- `feedback_to_model` en lenguaje natural

Taxonomia recomendada de defectos:

- `seam_break`
- `object_duplication`
- `object_truncation`
- `warped_structure`
- `impossible_perspective`
- `pole_collapse`
- `lighting_inconsistency`
- `layout_inconsistency`

### 4.3 Formato sugerido para entrenamiento

```json
{
  "image_id": "string",
  "resolution": {"width": 4096, "height": 2048},
  "global_quality_score": 2,
  "sectors": [
    {
      "name": "front",
      "x_range_norm": [0.375, 0.625],
      "y_range_norm": [0.25, 0.75],
      "sector_score": 3,
      "major_defects": ["warped_structure"],
      "justification": "Desk and window remain plausible but straight architectural lines bend inconsistently near sector boundaries.",
      "feedback_to_model": "Preserve room geometry across the central sector and maintain consistent perspective for desk, window frame, and laptop."
    }
  ]
}
```

Notas:

- `x_range_norm` y `y_range_norm` permiten feedback localizado;
- puede agregarse `bbox` o `polygon` para defectos puntuales;
- la justificacion debe describir evidencia visible, no opinion estetica.

## 5. Ejemplo de anotacion por sector

Imagen de ejemplo: `public/360_images/7d64f729-3efb-4cdd-a374-684ddde7d51a.png`

### Evaluacion global

- escena: reunion en interior, mesa central, ventana, personas en ambos lados;
- score global sugerido: `2/5`;
- motivo: la imagen es plausible como foto panoramica, pero presenta sintomas tipicos de generacion IA no robusta para 360: personas truncadas en bordes, costura dudosa, curvatura excesiva de mesa y estructura poco confiable en extremos.

### Front

- rol geometrico: sector central, referencia principal de la escena;
- score sugerido: `3/5`;
- observacion: ventana, laptop y mesa son entendibles, pero la mesa presenta deformacion fuerte y las verticales de la ventana no son una referencia limpia para validar una proyeccion consistente;
- feedback a modelo: "Mantener estructura arquitectonica estable en el sector frontal y reducir deformacion no fisica en mesa, laptop y marco de ventana."

### Right

- score sugerido: `2/5`;
- observacion: la persona de la derecha luce plausible localmente, pero la transicion hacia el extremo genera compresion y posible inconsistencia anatomica;
- defectos: `object_truncation`, `impossible_perspective`;
- feedback a modelo: "Evitar compresion de anatomia humana cerca de limites de sector y conservar continuidad corporal al acercarse a costuras."

### Back

- score sugerido: `1/5`;
- observacion: en equirectangular el sector posterior suele leerse en la zona de costura izquierda-derecha. Aqui aparece un cuerpo cortado entre ambos extremos, señal fuerte de seam ambiguo o escena no cerrada correctamente;
- defectos: `seam_break`, `object_duplication`, `layout_inconsistency`;
- feedback a modelo: "Cerrar la escena en 360 sin cortar personas entre bordes izquierdo y derecho; garantizar que ambos extremos representen el mismo espacio continuo."

### Left

- score sugerido: `2/5`;
- observacion: la persona izquierda y la pared son localmente creibles, pero la cercania al borde muestra truncamiento y perspectiva poco controlada;
- defectos: `object_truncation`, `warped_structure`;
- feedback a modelo: "Reducir truncamiento de sujetos en sectores laterales y mantener una transicion espacial coherente entre pared, sujeto y mobiliario."

### Top

- score sugerido: `3/5`;
- observacion: el techo es relativamente limpio, pero no ofrece una convergencia geometricamente fuerte; debe evaluarse si las uniones de pared-techo mantienen continuidad al navegar sobre la esfera;
- defectos: `pole_collapse` leve potencial, `lighting_inconsistency` leve;
- feedback a modelo: "Preservar continuidad suave en techo y union pared-techo, evitando estiramientos o colapsos radiales hacia el polo superior."

## 6. Recomendacion operativa

Pipeline recomendado:

1. cargar imagen en `Prism 360`;
2. revisar en modo equirectangular y esferico;
3. puntuar globalmente;
4. puntuar cada sector con taxonomia fija;
5. registrar justificacion observable;
6. generar `feedback_to_model` corto, accionable y sectorial.

Resultado esperado: un dataset mixto de **scores + defect taxonomy + rationale + localized feedback**, suficientemente rico para:

- fine-tuning supervisado;
- preference tuning;
- reward modeling;
- evaluacion automatica futura de calidad equirectangular.

## 7. Criterio de exito

La propuesta sera exitosa si permite que el modelo aprenda no solo a producir una imagen bonita, sino una imagen que:

- cierre correctamente en 360;
- conserve continuidad espacial entre sectores;
- respete el comportamiento geometrico de la proyeccion equirectangular;
- reduzca errores sistematicos en personas, bordes, polos y estructura arquitectonica.
