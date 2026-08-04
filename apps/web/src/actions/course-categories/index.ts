/** Actions do módulo `course-categories` — uma rota por arquivo. */
export {
  createCourseCategory,
  type CreateCourseCategoryInput,
} from "./create-course-category.action";
export {
  deleteCourseCategory,
  type DeleteCourseCategoryInput,
} from "./delete-course-category.action";
export {
  getCourseCategory,
  type GetCourseCategoryInput,
} from "./get-course-category.action";
export {
  getCourseCategoryByOldId,
  type GetCourseCategoryByOldIdInput,
} from "./get-course-category-by-old-id.action";
export {
  listCourseCategories,
  type ListCourseCategoriesInput,
} from "./list-course-categories.action";
export {
  toggleCourseCategory,
  type ToggleCourseCategoryInput,
} from "./toggle-course-category.action";
export {
  updateCourseCategory,
  type UpdateCourseCategoryInput,
} from "./update-course-category.action";
