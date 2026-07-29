import { useEffect, useState } from 'react';
import { projectsApi } from '../api/modules';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  useEffect(() => { projectsApi.list().then(setProjects).catch(() => {}); }, []);
  return projects;
}
