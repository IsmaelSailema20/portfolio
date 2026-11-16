# Portafolio · Misión espacial

Portafolio estático (Astro + Three.js) con dos modos: un viaje 3D guiado por scroll y una vista clásica. Disponible en español (`/`) e inglés (`/en/`).

## Comandos

| Comando                 | Acción                        |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Servidor de desarrollo        |
| `npm run build`         | Genera el sitio en `dist/`    |
| `npm run preview`       | Sirve el resultado de `build` |
| `npm run check`         | Valida tipos y contenido      |
| `npm test`              | Tests unitarios (Vitest)      |
| `npm run test:mutation` | Tests de mutación (Stryker)   |

## Cambiar la información

Todo el contenido vive en `src/content/`. Cada texto visible lleva `es` y `en`; si falta alguno, el build falla e indica el archivo.

| Qué                                            | Dónde                                                                                  |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Nombre, rol, bio, correo, enlaces, ruta del CV | `src/content/profile.yaml`                                                             |
| Grupos de tecnologías (módulos de la estación) | `src/content/skills.yaml`                                                              |
| Experiencia (estrellas de la constelación)     | un archivo por empleo en `src/content/experience/`                                     |
| Proyectos (paneles del enjambre de Dyson)      | un archivo por proyecto en `src/content/projects/`                                     |
| Captura de cada proyecto                       | campo `image` del proyecto, con el archivo en `public/projects/` (640×400 recomendado) |
| Textos de interfaz (botones, títulos, menú)    | `src/i18n/ui.ts`                                                                       |
| CV descargable                                 | `public/cv/cv-es.pdf` y `public/cv/cv-en.pdf`                                          |

Para agregar un proyecto o una experiencia, copia un archivo existente de su carpeta y edítalo. Para quitarlo, borra el archivo. La escena 3D se ajusta sola a la cantidad de entradas.

- La experiencia se ordena por `start` (más reciente primero). Sin `end` se muestra como actual.
- Los proyectos se ordenan por `order`.

## Cambiar el aspecto

- Colores, tipografías y espaciados: `src/styles/tokens.css`. La escena 3D lee esos mismos colores.
- Diferencias entre modo clásico e inmersivo: `src/styles/modes.css`.

## Escena 3D

```
src/scene/
├─ startScene.ts   bucle principal: une scroll, cohete, cámara y paradas
├─ journey.ts      orden de las paradas
├─ core/           cámara, scroll, calidad, utilidades
├─ actors/         cohete, estela, estrellas
└─ stages/         una parada por archivo
```

En modo inmersivo cada panel queda fijo mientras dura su parada. Experiencia y proyectos avanzan un elemento a la vez con el scroll; cada elemento marcado con `data-step` es un paso. El mapa de ruta del encabezado, la telemetría y el botón "Atravesar el agujero" (vuelve al inicio y suma una misión) solo existen en este modo.

Cada parada define sus `waypoints` (por dónde pasa el cohete), su `cameraOffset` y su `update`. Para añadir una parada: crea un archivo en `stages/`, agrégalo en `journey.ts`, añade su identificador en `stageIds` (`src/i18n/ui.ts`) y crea su sección en `src/components/sections/`.
