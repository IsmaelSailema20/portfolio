# Portafolio · Misión espacial

![Astro](https://img.shields.io/badge/Astro-BC52EE?logo=astro&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?logo=threedotjs&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-0AE448?logo=greensock&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white)
![Stryker](https://img.shields.io/badge/Stryker-E74C3C?logo=stryker&logoColor=white)

Mi portafolio como un viaje en cohete: despegas desde Ecuador y, a medida que haces scroll, cada parada del recorrido presenta una parte de mi perfil, hasta cruzar un agujero de gusano para contactarme.

**[Ver el sitio →](https://ismaelsailema20.github.io/portfolio/)**

## Destacado

- **Recorrido 3D guiado por scroll:** estación orbital, base lunar, cinturón de asteroides y enjambre de Dyson, con distancias reales en la telemetría.
- **Modo clásico:** una vista de lectura rápida con hologramas, avatar de astronauta y un selector de misiones con capturas de cada proyecto.
- **Minijuego:** en el cinturón de asteroides puedes tomar el control del cohete.
- **Español e inglés:** todo el contenido existe en ambos idiomas.
- **Contacto directo:** el formulario envía el mensaje sin salir del sitio.
- **Lógica probada:** tests unitarios con Vitest y tests de mutación con Stryker sobre los cálculos de la escena, las interacciones, los idiomas y el minijuego.

## Ejecutar

```bash
npm install
npm run dev
```

| Comando                 | Acción                        |
| ----------------------- | ----------------------------- |
| `npm run dev`           | Servidor de desarrollo        |
| `npm run build`         | Genera el sitio en `dist/`    |
| `npm test`              | Tests unitarios               |
| `npm run test:mutation` | Tests de mutación             |

El contenido se edita en los archivos YAML de `src/content/`.
