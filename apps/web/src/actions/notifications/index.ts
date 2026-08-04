/** Actions do módulo `notifications` — uma rota por arquivo. */
export {
  createNotification,
  type CreateNotificationInput,
} from "./create-notification.action";
export {
  deleteNotification,
  type DeleteNotificationInput,
} from "./delete-notification.action";
export {
  getNotification,
  type GetNotificationInput,
} from "./get-notification.action";
export {
  listNotifications,
  type ListNotificationsInput,
} from "./list-notifications.action";
export {
  markNotificationAsRead,
  type MarkNotificationAsReadInput,
} from "./mark-notification-as-read.action";
export {
  updateNotification,
  type UpdateNotificationInput,
} from "./update-notification.action";
