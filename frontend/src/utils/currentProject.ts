export const CURRENT_PROJECT_ID_KEY = 'nebula_current_project_id';
export const CURRENT_PROJECT_NAME_KEY = 'nebula_current_project_name';
export const CURRENT_PROJECT_CHANGED_EVENT = 'nebula:current-project-changed';

export interface CurrentProjectSnapshot {
  id: number;
  name?: string;
}

const parsePositiveInt = (value: string | null): number | null => {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const readCurrentProjectId = (): number | null => {
  if (typeof window === 'undefined') return null;
  return parsePositiveInt(window.localStorage.getItem(CURRENT_PROJECT_ID_KEY));
};

export const readCurrentProjectName = (): string | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(CURRENT_PROJECT_NAME_KEY);
  return value && value.trim().length > 0 ? value : null;
};

export const setCurrentProject = (project: CurrentProjectSnapshot): void => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(CURRENT_PROJECT_ID_KEY, String(project.id));
  if (project.name && project.name.trim()) {
    window.localStorage.setItem(CURRENT_PROJECT_NAME_KEY, project.name.trim());
  }

  window.dispatchEvent(
    new CustomEvent(CURRENT_PROJECT_CHANGED_EVENT, {
      detail: { id: project.id, name: project.name },
    })
  );
};

export const clearCurrentProject = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(CURRENT_PROJECT_ID_KEY);
  window.localStorage.removeItem(CURRENT_PROJECT_NAME_KEY);
  window.dispatchEvent(new CustomEvent(CURRENT_PROJECT_CHANGED_EVENT, { detail: { id: null } }));
};
