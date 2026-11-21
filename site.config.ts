export const githubUser: string = 'IsmaelSailema20';
export const repositoryName: string = 'portfolio';

const isUserSite = repositoryName === `${githubUser}.github.io`;

export const siteUrl = `https://${githubUser}.github.io`;
export const basePath = isUserSite ? '/' : `/${repositoryName}`;
