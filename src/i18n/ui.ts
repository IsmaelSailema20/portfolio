import type { Locale } from './locales';

export const stageIds = ['home', 'about', 'experience', 'projects', 'contact'] as const;

export type StageId = (typeof stageIds)[number];

export interface UiDictionary {
  siteDescription: string;
  skipToContent: string;
  navigationLabel: string;
  routeLabel: string;
  telemetryLabel: string;
  mission: string;
  stop: string;
  stageNames: Record<StageId, string>;
  sectionTitles: Record<Exclude<StageId, 'home'>, string>;
  navigationItems: Record<Exclude<StageId, 'home'>, string>;
  mode: {
    toggleLabel: string;
    immersive: string;
    classic: string;
  };
  languageSwitchLabel: string;
  hero: {
    telemetry: string;
    callToAction: string;
    scrollHint: string;
  };
  about: {
    skillsTitle: string;
  };
  experience: {
    present: string;
    problem: string;
    approach: string;
    manualControlHint: string;
  };
  projects: {
    repository: string;
    demo: string;
  };
  contact: {
    lead: string;
    email: string;
    downloadCurriculum: string;
    crossWormhole: string;
    backToStart: string;
  };
  footer: {
    madeIn: string;
    coordinates: string;
  };
  minigame: {
    title: string;
    instructions: string;
    time: string;
    hits: string;
  };
}

export const ui: Record<Locale, UiDictionary> = {
  es: {
    siteDescription: 'Portafolio de desarrollo de software: un viaje espacial que despega desde Ecuador.',
    skipToContent: 'Saltar al contenido',
    navigationLabel: 'Secciones',
    routeLabel: 'Ruta de la misión',
    telemetryLabel: 'Telemetría',
    mission: 'Misión',
    stop: 'Parada',
    stageNames: {
      home: 'Base de lanzamiento',
      about: 'Estación orbital',
      experience: 'Cinturón de asteroides',
      projects: 'Enjambre de Dyson',
      contact: 'Agujero de gusano',
    },
    sectionTitles: {
      about: 'Sobre mí',
      experience: 'Experiencia',
      projects: 'Proyectos',
      contact: '¿Listo para saltar a una nueva galaxia juntos?',
    },
    navigationItems: {
      about: 'Sobre mí',
      experience: 'Experiencia',
      projects: 'Proyectos',
      contact: 'Contacto',
    },
    mode: {
      toggleLabel: 'Modo inmersivo',
      immersive: 'Inmersivo',
      classic: 'Clásico',
    },
    languageSwitchLabel: 'Read in English',
    hero: {
      telemetry: 'LAT 0° 0′ 0″ · Mitad del Mundo',
      callToAction: 'Inicia la misión',
      scrollHint: 'Scroll para despegar',
    },
    about: {
      skillsTitle: 'Tecnologías',
    },
    experience: {
      present: 'Actualidad',
      problem: 'Desafío',
      approach: 'Enfoque',
      manualControlHint: 'Espacio · control manual',
    },
    projects: {
      repository: 'Código',
      demo: 'Demo',
    },
    contact: {
      lead: 'Escríbeme o revisa mi trabajo. Respondo en español e inglés.',
      email: 'Correo',
      downloadCurriculum: 'Descargar CV',
      crossWormhole: 'Atravesar el agujero',
      backToStart: 'Volver al inicio',
    },
    footer: {
      madeIn: 'Hecho en Quito, Ecuador',
      coordinates: '0° 13′ S · 78° 30′ O',
    },
    minigame: {
      title: 'Control manual',
      instructions: 'Esquiva los meteoritos con las flechas. Esc para salir.',
      time: 'Tiempo',
      hits: 'Impactos',
    },
  },
  en: {
    siteDescription: 'Software development portfolio: a space journey that lifts off from Ecuador.',
    skipToContent: 'Skip to content',
    navigationLabel: 'Sections',
    routeLabel: 'Mission route',
    telemetryLabel: 'Telemetry',
    mission: 'Mission',
    stop: 'Stop',
    stageNames: {
      home: 'Launch base',
      about: 'Orbital station',
      experience: 'Asteroid belt',
      projects: 'Dyson swarm',
      contact: 'Wormhole',
    },
    sectionTitles: {
      about: 'About me',
      experience: 'Experience',
      projects: 'Projects',
      contact: 'Ready to jump to a new galaxy together?',
    },
    navigationItems: {
      about: 'About',
      experience: 'Experience',
      projects: 'Projects',
      contact: 'Contact',
    },
    mode: {
      toggleLabel: 'Immersive mode',
      immersive: 'Immersive',
      classic: 'Classic',
    },
    languageSwitchLabel: 'Leer en español',
    hero: {
      telemetry: 'LAT 0° 0′ 0″ · Middle of the World',
      callToAction: 'Start the mission',
      scrollHint: 'Scroll to lift off',
    },
    about: {
      skillsTitle: 'Technologies',
    },
    experience: {
      present: 'Present',
      problem: 'Challenge',
      approach: 'Approach',
      manualControlHint: 'Space · manual control',
    },
    projects: {
      repository: 'Code',
      demo: 'Demo',
    },
    contact: {
      lead: 'Write to me or take a look at my work. I reply in Spanish and English.',
      email: 'Email',
      downloadCurriculum: 'Download CV',
      crossWormhole: 'Cross the wormhole',
      backToStart: 'Back to start',
    },
    footer: {
      madeIn: 'Made in Quito, Ecuador',
      coordinates: '0° 13′ S · 78° 30′ W',
    },
    minigame: {
      title: 'Manual control',
      instructions: 'Dodge the meteors with the arrow keys. Esc to exit.',
      time: 'Time',
      hits: 'Hits',
    },
  },
};
