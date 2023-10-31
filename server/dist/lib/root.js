import path from 'path';
// Get the URL of the current module
const currentModuleUrl = new URL(import.meta.url);
// Extract the directory name
export const __dirname = path.dirname(currentModuleUrl.pathname + '../').slice(1);
