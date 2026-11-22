export const githubUser: string = 'IsmaelSailema20';
export const repositoryName: string = 'portfolio';
export const contactFormAccessKey: string = '74672e04-d965-4344-b05d-5050e9447fc6';

const isUserSite = repositoryName === `${githubUser}.github.io`;

export const siteUrl = `https://${githubUser}.github.io`;
export const basePath = isUserSite ? '/' : `/${repositoryName}`;
