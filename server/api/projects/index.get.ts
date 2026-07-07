import { listProjects } from "../../lib/project";

export default defineEventHandler((event) => {
  return listProjects(event);
});
