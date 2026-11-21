import type { Locale } from './locales';

export const stageIds = ['home', 'about', 'skills', 'projects', 'experience', 'contact'] as const;

export type StageId = (typeof stageIds)[number];

export const projectCategories = ['personal', 'contribution', 'client'] as const;

export type ProjectCategory = (typeof projectCategories)[number];

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
  stepNavigation: {
    label: string;
    previous: string;
    next: string;
    goTo: string;
  };
  detail: {
    show: string;
    hide: string;
  };
  hero: {
    telemetry: string;
    callToAction: string;
    scrollHint: string;
  };
  about: {
    avatarAlt: string;
    objectiveTitle: string;
    biographyTitle: string;
    educationTitle: string;
  };
  experience: {
    present: string;
    problem: string;
    approach: string;
  };
  projects: {
    repository: string;
    demo: string;
    manualControlHint: string;
    categories: Record<ProjectCategory, string>;
    gallery: {
      label: string;
      previous: string;
      next: string;
      goTo: string;
    };
  };
  contact: {
    lead: string;
    email: string;
    formTitle: string;
    nameLabel: string;
    emailLabel: string;
    subjectLabel: string;
    messageLabel: string;
    send: string;
    formHint: string;
    downloadCurriculum: string;
    sending: string;
    success: string;
    failure: string;
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
      skills: 'Base lunar',
      projects: 'Cinturón de asteroides',
      experience: 'Enjambre de Dyson',
      contact: 'Agujero de gusano',
    },
    sectionTitles: {
      about: 'Sobre mí',
      skills: 'Tecnologías',
      projects: 'Proyectos',
      experience: 'Experiencia',
      contact: '¿Listo para saltar a una nueva galaxia juntos?',
    },
    navigationItems: {
      about: 'Sobre mí',
      skills: 'Tecnologías',
      projects: 'Proyectos',
      experience: 'Experiencia',
      contact: 'Contacto',
    },
    mode: {
      toggleLabel: 'Modo inmersivo',
      immersive: 'Inmersivo',
      classic: 'Clásico',
    },
    languageSwitchLabel: 'Read in English',
    stepNavigation: {
      label: 'Navegar entre elementos',
      previous: 'Anterior',
      next: 'Siguiente',
      goTo: 'Ir al elemento',
    },
    detail: {
      show: 'Ver detalle',
      hide: 'Ocultar detalle',
    },
    hero: {
      telemetry: 'LAT 0° 0′ 0″ · Mitad del Mundo',
      callToAction: 'Inicia la misión',
      scrollHint: 'Scroll para despegar',
    },
    about: {
      avatarAlt: 'Avatar de astronauta con el parche de Ecuador',
      objectiveTitle: 'Objetivo profesional',
      biographyTitle: 'Quién soy',
      educationTitle: 'Formación',
    },
    experience: {
      present: 'Actualidad',
      problem: 'Desafío',
      approach: 'Enfoque',
    },
    projects: {
      repository: 'Código',
      demo: 'Demo',
      manualControlHint: 'Espacio · control manual',
      categories: {
        personal: 'Proyecto personal',
        contribution: 'Colaboración',
        client: 'Cliente',
      },
      gallery: {
        label: 'Capturas de',
        previous: 'Imagen anterior',
        next: 'Imagen siguiente',
        goTo: 'Ver imagen',
      },
    },
    contact: {
      lead: 'Escríbeme o revisa mi trabajo. Respondo en español e inglés.',
      email: 'Correo',
      formTitle: 'Envíame un mensaje',
      nameLabel: 'Nombre',
      emailLabel: 'Tu correo',
      subjectLabel: 'Asunto',
      messageLabel: 'Mensaje',
      send: 'Enviar mensaje',
      formHint: 'Te responderé al correo que indiques.',
      sending: 'Enviando transmisión…',
      success: 'Mensaje recibido. Te responderé pronto.',
      failure: 'No se pudo enviar. Inténtalo de nuevo o escríbeme al correo.',
      downloadCurriculum: 'Descargar CV',
      crossWormhole: 'Atravesar el agujero',
      backToStart: 'Volver al inicio',
    },
    footer: {
      madeIn: 'Hecho en Ambato, Ecuador',
      coordinates: '1° 15′ S · 78° 37′ O',
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
      skills: 'Lunar base',
      projects: 'Asteroid belt',
      experience: 'Dyson swarm',
      contact: 'Wormhole',
    },
    sectionTitles: {
      about: 'About me',
      skills: 'Technologies',
      projects: 'Projects',
      experience: 'Experience',
      contact: 'Ready to jump to a new galaxy together?',
    },
    navigationItems: {
      about: 'About',
      skills: 'Skills',
      projects: 'Projects',
      experience: 'Experience',
      contact: 'Contact',
    },
    mode: {
      toggleLabel: 'Immersive mode',
      immersive: 'Immersive',
      classic: 'Classic',
    },
    languageSwitchLabel: 'Leer en español',
    stepNavigation: {
      label: 'Browse items',
      previous: 'Previous',
      next: 'Next',
      goTo: 'Go to item',
    },
    detail: {
      show: 'Show details',
      hide: 'Hide details',
    },
    hero: {
      telemetry: 'LAT 0° 0′ 0″ · Middle of the World',
      callToAction: 'Start the mission',
      scrollHint: 'Scroll to lift off',
    },
    about: {
      avatarAlt: 'Astronaut avatar with the Ecuador patch',
      objectiveTitle: 'Career goal',
      biographyTitle: 'Who I am',
      educationTitle: 'Education',
    },
    experience: {
      present: 'Present',
      problem: 'Challenge',
      approach: 'Approach',
    },
    projects: {
      repository: 'Code',
      demo: 'Demo',
      manualControlHint: 'Space · manual control',
      categories: {
        personal: 'Personal project',
        contribution: 'Contribution',
        client: 'Client',
      },
      gallery: {
        label: 'Screenshots of',
        previous: 'Previous image',
        next: 'Next image',
        goTo: 'Show image',
      },
    },
    contact: {
      lead: 'Write to me or take a look at my work. I reply in Spanish and English.',
      email: 'Email',
      formTitle: 'Send me a message',
      nameLabel: 'Name',
      emailLabel: 'Your email',
      subjectLabel: 'Subject',
      messageLabel: 'Message',
      send: 'Send message',
      formHint: 'I will reply to the email you provide.',
      sending: 'Sending transmission…',
      success: 'Message received. I will get back to you soon.',
      failure: 'The message could not be sent. Try again or email me directly.',
      downloadCurriculum: 'Download CV',
      crossWormhole: 'Cross the wormhole',
      backToStart: 'Back to start',
    },
    footer: {
      madeIn: 'Made in Ambato, Ecuador',
      coordinates: '1° 15′ S · 78° 37′ W',
    },
    minigame: {
      title: 'Manual control',
      instructions: 'Dodge the meteors with the arrow keys. Esc to exit.',
      time: 'Time',
      hits: 'Hits',
    },
  },
};
