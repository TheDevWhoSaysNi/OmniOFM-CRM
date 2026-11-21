import { NotificationChannel, NotificationType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";

type Recipient = {
  userId: string;
  workspaceId: string;
  email: string;
  pushToken: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
};

async function sendEmail(email: string, message: string) {
  if (!env.RESEND_API_KEY || !env.NOTIFY_FROM_EMAIL) {
    throw new Error("Email provider is not configured.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.NOTIFY_FROM_EMAIL,
      to: [email],
      subject: "NiCRM Account Notice",
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email delivery failed: ${await response.text()}`);
  }
}

async function sendPush(pushToken: string, message: string) {
  if (!env.ONESIGNAL_APP_ID || !env.ONESIGNAL_API_KEY) {
    throw new Error("Push provider is not configured.");
  }

  const response = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Basic ${env.ONESIGNAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: env.ONESIGNAL_APP_ID,
      include_external_user_ids: [pushToken],
      headings: { en: "NiCRM Account Notice" },
      contents: { en: message },
    }),
  });

  if (!response.ok) {
    throw new Error(`Push delivery failed: ${await response.text()}`);
  }
}

export async function notifyUser(
  recipient: Recipient,
  type: NotificationType,
  message: string,
  metadata?: Record<string, unknown>
) {
  const channels: NotificationChannel[] = [];
  if (recipient.emailNotifications && recipient.email) {
    channels.push("EMAIL");
  }
  if (recipient.pushNotifications && recipient.pushToken) {
    channels.push("PUSH");
  }

  await Promise.all(
    channels.map(async (channel) => {
      try {
        if (channel === "EMAIL") {
          await sendEmail(recipient.email, message);
        } else {
          await sendPush(recipient.pushToken!, message);
        }

        await prisma.notificationLog.create({
          data: {
            workspaceId: recipient.workspaceId,
            userId: recipient.userId,
            channel,
            type,
            message,
            metadata: metadata as Prisma.InputJsonValue | undefined,
            deliveredAt: new Date(),
          },
        });
      } catch (error) {
        await prisma.notificationLog.create({
          data: {
            workspaceId: recipient.workspaceId,
            userId: recipient.userId,
            channel,
            type,
            message,
            metadata: {
              ...(metadata ?? {}),
              error: error instanceof Error ? error.message : "Unknown notification error",
            } as Prisma.InputJsonValue,
          },
        });
      }
    })
  );
}
