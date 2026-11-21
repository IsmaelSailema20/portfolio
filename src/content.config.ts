import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { projectCategories } from './i18n/ui';

const localizedText = z.object({
  es: z.string().min(1),
  en: z.string().min(1),
});

const localizedParagraphs = z.object({
  es: z.array(z.string().min(1)).min(1),
  en: z.array(z.string().min(1)).min(1),
});

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/);

const profile = defineCollection({
  loader: glob({ pattern: 'profile.yaml', base: './src/content' }),
  schema: z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    email: z.email(),
    role: localizedText,
    tagline: localizedText,
    objective: localizedText,
    bio: localizedParagraphs,
    links: z.array(
      z.object({
        kind: z.enum(['github', 'linkedin', 'other']),
        label: z.string().min(1),
        url: z.url(),
      }),
    ),
    portrait: z.string().min(1).optional(),
  }),
});

const skills = defineCollection({
  loader: file('./src/content/skills.yaml'),
  schema: z.object({
    name: localizedText,
    description: localizedText,
    items: z.array(z.string().min(1)).min(1),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
  schema: z.object({
    company: z.string().min(1),
    start: yearMonth,
    end: yearMonth.optional(),
    role: localizedText,
    summary: localizedText,
    challenge: z.object({
      problem: localizedText,
      approach: localizedText,
    }),
    technologies: z.array(z.string().min(1)),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/education' }),
  schema: z.object({
    institution: z.string().min(1),
    degree: localizedText,
    start: z.number().int(),
    end: z.number().int().optional(),
  }),
});

const courses = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/courses' }),
  schema: z.object({
    title: localizedText,
    institution: z.string().min(1),
    year: z.number().int(),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/projects' }),
  schema: z.object({
    order: z.number().int(),
    year: z.number().int(),
    category: z.enum(projectCategories),
    title: localizedText,
    summary: localizedText,
    description: localizedText,
    technologies: z.array(z.string().min(1)),
    images: z
      .array(
        z.object({
          source: z.string().min(1),
          caption: localizedText,
        }),
      )
      .min(1)
      .optional(),
    repository: z.url().optional(),
    demo: z.url().optional(),
  }),
});

export const collections = { profile, skills, experience, education, courses, projects };
