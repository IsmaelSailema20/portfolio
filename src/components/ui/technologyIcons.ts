import {
  siAstro,
  siAuth0,
  siChartdotjs,
  siDocker,
  siDotnet,
  siExpo,
  siExpress,
  siFastapi,
  siGit,
  siGithub,
  siJavascript,
  siJsonwebtokens,
  siLeaflet,
  siMysql,
  siNestjs,
  siNextdotjs,
  siNodedotjs,
  siNotion,
  siOpenjdk,
  siPostgresql,
  siPostman,
  siPrimereact,
  siPython,
  siReact,
  siSpring,
  siSpringboot,
  siSupabase,
  siTailwindcss,
  siTypescript,
  siVite,
  siVitest,
  siWebrtc,
  type SimpleIcon,
} from 'simple-icons';

const iconsByTechnology: Record<string, SimpleIcon> = {
  'ASP.NET Core': siDotnet,
  Astro: siAstro,
  Auth0: siAuth0,
  'Chart.js': siChartdotjs,
  Docker: siDocker,
  Expo: siExpo,
  Express: siExpress,
  FastAPI: siFastapi,
  Git: siGit,
  GitHub: siGithub,
  Java: siOpenjdk,
  JavaScript: siJavascript,
  JWT: siJsonwebtokens,
  Leaflet: siLeaflet,
  MySQL: siMysql,
  NestJS: siNestjs,
  'Next.js': siNextdotjs,
  'Node.js': siNodedotjs,
  Notion: siNotion,
  PostgreSQL: siPostgresql,
  Postman: siPostman,
  PrimeReact: siPrimereact,
  Python: siPython,
  React: siReact,
  'React Native': siReact,
  'Spring Boot': siSpringboot,
  'Spring Cloud Gateway': siSpring,
  Supabase: siSupabase,
  'Tailwind CSS': siTailwindcss,
  TypeScript: siTypescript,
  Vite: siVite,
  Vitest: siVitest,
  WebRTC: siWebrtc,
};

export function resolveTechnologyIcon(technology: string): SimpleIcon | null {
  return iconsByTechnology[technology] ?? null;
}

export function formatMonogram(technology: string): string {
  const trimmedTechnology = technology.trim();
  const words = trimmedTechnology.split(/\s+/);
  const letters =
    words.length > 1 ? words.slice(0, 2).map((word) => word[0]).join('') : trimmedTechnology.slice(0, 2);
  return letters.toUpperCase();
}
