import { archiveProject, unarchiveProject } from "../../../lib/project";

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")!;
  const body = await readBody(event);
  if (body.archived) {
    return archiveProject(event, id);
  } else {
    return unarchiveProject(event, id);
  }
});
