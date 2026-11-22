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
| Nombre, rol, objetivo, bio, correo, enlaces y ruta del retrato | `src/content/profile.yaml` (retrato en `public/images/`)              |
| Formación académica                            | un archivo por estudio en `src/content/education/`                                     |
| Cursos y certificaciones                       | un archivo por curso en `src/content/courses/` (título es/en, institución y año)       |
| Grupos de tecnologías (puestos de la base lunar) | `src/content/skills.yaml`                                                            |
| Proyectos (estrellas de la constelación)       | un archivo por proyecto en `src/content/projects/`                                     |
| Experiencia (colectores del enjambre de Dyson) | un archivo por empleo en `src/content/experience/`                                     |
| Capturas de cada proyecto (carrusel del selector) | lista `images` del proyecto (`source` y `caption` en es/en), con los archivos en `public/projects/<proyecto>/` (WebP de 1600 px de ancho recomendado) |
| Logo de cada tecnología (holograma)            | `src/components/ui/technologyIcons.ts`, con íconos de `simple-icons`; sin ícono se muestra un monograma |
| Textos de interfaz (botones, títulos, menú)    | `src/i18n/ui.ts`                                                                       |
| Formulario de contacto (Web3Forms)             | `contactFormAccessKey` en `site.config.ts`, con la access key creada en web3forms.com; los mensajes llegan al correo con el que se creó |

Para agregar un proyecto o una experiencia, copia un archivo existente de su carpeta y edítalo. Para quitarlo, borra el archivo. La escena 3D se ajusta sola a la cantidad de entradas.

- La experiencia se ordena por `start` (más reciente primero). Sin `end` se muestra como actual.
- La formación se ordena por `start` (más reciente primero). Sin `end` se muestra como actual.
- Cada proyecto lleva una `category`: `personal`, `contribution` (colaboración en un proyecto ajeno) o `client`. Se agrupan en ese orden y, dentro de cada categoría, por `order`.

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

En modo inmersivo cada panel queda fijo mientras dura su parada. Las secciones con varios elementos avanzan uno a la vez con el scroll; cada elemento marcado con `data-step` es un paso. Al pie del panel hay puntos y botones anterior/siguiente (`StepNavigation`), y las flechas ←/→ del teclado saltan al elemento o parada vecina. El texto largo de cada elemento va en un bloque `step-detail` que se despliega con "Ver detalle" (`DetailToggle`), en ambos modos.

En modo clásico, Sobre mí muestra el avatar de astronauta (`public/images/avatar-astronauta.svg`) con efecto holográfico (`HologramPortrait`), las tecnologías se presentan como hologramas (`TechHologram`) y los proyectos usan un selector de misiones (`ProjectMission` + `src/interactions/missionSelector.ts`): la lista numerada a la izquierda y la pantalla del proyecto activo a la derecha, que cambia al pasar el mouse o al hacer clic. La pantalla es un carrusel de capturas (`ProjectGallery` + `src/interactions/projectGallery.ts`) que avanza con las flechas, los puntos, las teclas ←/→ o deslizando en táctil. El mapa de ruta del encabezado y la telemetría solo existen en este modo. El botón "Atravesar el agujero de gusano" de Contacto vuelve al inicio en ambos modos; en el inmersivo lo hace con el salto por el agujero y suma una misión.

El recorrido sigue distancias reales: base de lanzamiento (Inicio), estación orbital a 408 km (Sobre mí: objetivo, bio y formación, un módulo por bloque), base lunar a 384.400 km (Tecnologías: el cohete orbita la Luna y pasa sobre un puesto por grupo, ubicado donde está el cohete cuando ese grupo está activo), cinturón de asteroides a 2,8 UA (Proyectos: una estrella por proyecto y el minijuego de control manual), enjambre de Dyson a 4,2 años luz (Experiencia: un colector en forma de flor por empleo, que despliega sus velas y recibe un haz de energía de la estrella cuando está activo) y agujero de gusano (Contacto). Las distancias de la telemetría están en `src/scene/core/telemetry.ts`, una por parada.

Cada parada define sus `waypoints` (por dónde pasa el cohete), su `cameraOffset` y su `update`. Para añadir una parada: crea un archivo en `stages/`, agrégalo en `journey.ts`, añade su identificador en `stageIds` (`src/i18n/ui.ts`) y crea su sección en `src/components/sections/`.
