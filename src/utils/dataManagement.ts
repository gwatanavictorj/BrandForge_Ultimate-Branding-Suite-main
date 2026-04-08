import { BrandProject } from '../types';

/**
 * Utility to export all projects to a JSON file.
 */
export const exportProjects = (projects: BrandProject[]) => {
  const dataStr = JSON.stringify(projects, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `BrandForge_Backup_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

/**
 * Utility to parse and validate imported JSON data.
 */
export const parseImportFile = (file: File): Promise<BrandProject[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          // Simple validation: check if items have required properties
          const isValid = json.every(p => p.id && p.name && p.ownerId);
          if (isValid) {
            resolve(json as BrandProject[]);
          } else {
            reject(new Error('Invalid project data format. Missing required fields (id, name, or ownerId).'));
          }
        } else {
          reject(new Error('Invalid format. File must contain an array of projects.'));
        }
      } catch (err) {
        reject(new Error('Failed to parse JSON file. Ensure it is a valid BrandForge backup.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
};
