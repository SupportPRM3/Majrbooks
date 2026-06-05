import { supabase } from "@/integrations/supabase/client";

// Notification types
export type NotificationType =
  | "task_assigned"
  | "task_due"
  | "task_overdue"
  | "invoice_paid"
  | "invoice_overdue"
  | "timesheet_submitted"
  | "timesheet_approved"
  | "timesheet_rejected"
  | "client_invitation"
  | "payroll_reminder"
  | "system"
  | "info"
  | "warning"
  | "success";

interface CreateNotificationParams {
  userId: string;
  recipientId?: string;
  type: NotificationType;
  title: string;
  message?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  recipientId,
  type,
  title,
  message,
  referenceType,
  referenceId,
}: CreateNotificationParams) {
  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    recipient_id: recipientId || null,
    notification_type: type,
    title,
    message: message || null,
    reference_type: referenceType || null,
    reference_id: referenceId || null,
  });

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for task assignment
 */
export async function notifyTaskAssigned(
  assigneeUserId: string,
  taskTitle: string,
  taskId: string,
  assignedBy?: string
) {
  await createNotification({
    userId: assigneeUserId,
    type: "task_assigned",
    title: `New task assigned: ${taskTitle}`,
    message: assignedBy ? `Assigned by ${assignedBy}` : undefined,
    referenceType: "task",
    referenceId: taskId,
  });
}

/**
 * Create notifications for task due soon
 */
export async function notifyTaskDueSoon(
  userId: string,
  taskTitle: string,
  taskId: string,
  daysUntilDue: number
) {
  await createNotification({
    userId,
    type: "task_due",
    title: `Task due ${daysUntilDue === 0 ? "today" : `in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`}`,
    message: taskTitle,
    referenceType: "task",
    referenceId: taskId,
  });
}

/**
 * Create notifications for overdue task
 */
export async function notifyTaskOverdue(
  userId: string,
  taskTitle: string,
  taskId: string
) {
  await createNotification({
    userId,
    type: "task_overdue",
    title: "Task is overdue",
    message: taskTitle,
    referenceType: "task",
    referenceId: taskId,
  });
}

/**
 * Create notifications for invoice payment received
 */
export async function notifyInvoicePaid(
  userId: string,
  invoiceNumber: string,
  invoiceId: string,
  amount: number
) {
  await createNotification({
    userId,
    type: "invoice_paid",
    title: "Payment received",
    message: `Invoice #${invoiceNumber} - $${amount.toFixed(2)}`,
    referenceType: "invoice",
    referenceId: invoiceId,
  });
}

/**
 * Create notifications for overdue invoice
 */
export async function notifyInvoiceOverdue(
  userId: string,
  invoiceNumber: string,
  invoiceId: string,
  clientName: string
) {
  await createNotification({
    userId,
    type: "invoice_overdue",
    title: "Invoice is overdue",
    message: `Invoice #${invoiceNumber} for ${clientName}`,
    referenceType: "invoice",
    referenceId: invoiceId,
  });
}

/**
 * Create notifications for timesheet submission
 */
export async function notifyTimesheetSubmitted(
  managerUserId: string,
  employeeName: string,
  timesheetId: string
) {
  await createNotification({
    userId: managerUserId,
    type: "timesheet_submitted",
    title: "Timesheet submitted for approval",
    message: `${employeeName} has submitted their timesheet`,
    referenceType: "timesheet",
    referenceId: timesheetId,
  });
}

/**
 * Create notifications for timesheet approval
 */
export async function notifyTimesheetApproved(
  employeeUserId: string,
  timesheetId: string
) {
  await createNotification({
    userId: employeeUserId,
    type: "timesheet_approved",
    title: "Timesheet approved",
    message: "Your timesheet has been approved",
    referenceType: "timesheet",
    referenceId: timesheetId,
  });
}

/**
 * Create notifications for timesheet rejection
 */
export async function notifyTimesheetRejected(
  employeeUserId: string,
  timesheetId: string,
  reason?: string
) {
  await createNotification({
    userId: employeeUserId,
    type: "timesheet_rejected",
    title: "Timesheet rejected",
    message: reason || "Your timesheet has been rejected. Please review and resubmit.",
    referenceType: "timesheet",
    referenceId: timesheetId,
  });
}

/**
 * Create notifications for payroll reminder
 */
export async function notifyPayrollReminder(
  userId: string,
  message: string
) {
  await createNotification({
    userId,
    type: "payroll_reminder",
    title: "Payroll reminder",
    message,
  });
}

/**
 * Create a general system notification
 */
export async function notifySystem(
  userId: string,
  title: string,
  message?: string
) {
  await createNotification({
    userId,
    type: "system",
    title,
    message,
  });
}

/**
 * Create a success notification
 */
export async function notifySuccess(
  userId: string,
  title: string,
  message?: string
) {
  await createNotification({
    userId,
    type: "success",
    title,
    message,
  });
}

/**
 * Create a warning notification
 */
export async function notifyWarning(
  userId: string,
  title: string,
  message?: string
) {
  await createNotification({
    userId,
    type: "warning",
    title,
    message,
  });
}
