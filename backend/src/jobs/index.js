const cron = require("node-cron");
const { backgroundJobTimezone, enableBackgroundJobs } = require("../config/env");
const { supabase } = require("../db/supabase");
const { listPendingNotifications, markNotificationStatus } = require("../services/notificationQueueService");
const { sendEmail } = require("../services/emailService");

async function cleanupOldDraftSubmissions() {
  const threshold = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
  await supabase
    .from("submissions")
    .delete()
    .eq("status", "draft")
    .lt("created_at", threshold);
}

async function processPendingNotifications() {
  const pending = await listPendingNotifications();
  if (pending.error) {
    throw pending.error;
  }

  for (const notification of pending.data || []) {
    try {
      const sendResult = await sendEmail({
        to: notification.recipient_email,
        subject: notification.subject,
        text: notification.body
      });

      await markNotificationStatus(notification.id, {
        status: sendResult.skipped ? "failed" : "sent",
        sent_at: sendResult.skipped ? null : new Date().toISOString()
      });
    } catch (error) {
      await markNotificationStatus(notification.id, {
        status: "failed"
      });
    }
  }
}

function startBackgroundJobs() {
  if (!enableBackgroundJobs) {
    return;
  }

  cron.schedule("0 * * * *", () => {
    cleanupOldDraftSubmissions().catch((error) => console.error("Draft cleanup failed:", error.message));
  }, { timezone: backgroundJobTimezone });

  cron.schedule("*/10 * * * *", () => {
    processPendingNotifications().catch((error) => console.error("Notification processing failed:", error.message));
  }, { timezone: backgroundJobTimezone });
}

module.exports = { startBackgroundJobs };
