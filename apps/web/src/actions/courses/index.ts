/** Actions do módulo `courses` — uma rota por arquivo. */
export { createCourse, type CreateCourseInput } from "./create-course.action";
export { deleteCourse, type DeleteCourseInput } from "./delete-course.action";
export { getCourse, type GetCourseInput } from "./get-course.action";
export {
  getCourseByOldId,
  type GetCourseByOldIdInput,
} from "./get-course-by-old-id.action";
export { listCourses, type ListCoursesInput } from "./list-courses.action";
export {
  listCoursesByInstitution,
  type ListCoursesByInstitutionInput,
} from "./list-courses-by-institution.action";
export {
  searchCourses,
  type SearchCoursesInput,
} from "./search-courses.action";
export { toggleCourse, type ToggleCourseInput } from "./toggle-course.action";
export { updateCourse, type UpdateCourseInput } from "./update-course.action";
