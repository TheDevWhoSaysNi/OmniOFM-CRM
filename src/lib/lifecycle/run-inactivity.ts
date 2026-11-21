import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { notifyUser } from "@/lib/notifications/send";
import { createUserPurgeArchive } from "@/lib/compliance/purge-archive";

function toRecipient(user: {
  id: string;
  workspaceId: string;
  email: string;
  pushToken: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
}) {
  return {
    userId: user.id,
    workspaceId: user.workspaceId,
    email: user.email,
    pushToken: user.pushToken,
    emailNotifications: user.emailNotifications,
    pushNotifications: user.pushNotifications,
  };
}

function userLastActiveDate(user: {
  lastActiveAt: Date | null;
  updatedAt: Date;
  createdAt: Date;
}) {
  return user.lastActiveAt ?? user.updatedAt ?? user.createdAt;
}

export async function runInactivityLifecycle() {
  const now = new Date();
  const deactivationMs = env.INACTIVITY_DEACTIVATION_DAYS * 24 * 60 * 60 * 1000;
  const deactivationCutoff = new Date(now.getTime() - deactivationMs);
  const warningThresholdDays = [60, 75, 89].filter(
    (days) => days < env.INACTIVITY_DEACTIVATION_DAYS
  );

  const activeUsers = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      workspace: {
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      phoneNumber: true,
      pushToken: true,
      emailNotifications: true,
      pushNotifications: true,
      lastActiveAt: true,
      updatedAt: true,
      createdAt: true,
    },
  });

  let warningsLogged = 0;
  for (let ni = 0; ni < activeUsers.length; ni += 1) {
    const user = activeUsers[ni];
    const inactiveDays = Math.floor(
      (now.getTime() - userLastActiveDate(user).getTime()) / (24 * 60 * 60 * 1000)
    );
    if (!warningThresholdDays.includes(inactiveDays)) {
      continue;
    }

    const message = `Account inactivity warning: ${inactiveDays} days with no activity. Please log in to avoid automatic deactivation.`;
    const existing = await prisma.notificationLog.findFirst({
      where: {
        userId: user.id,
        type: "INACTIVITY_WARNING",
        message,
      },
      select: { id: true },
    });
    if (existing) {
      continue;
    }

    await notifyUser(toRecipient(user), "INACTIVITY_WARNING", message, { inactiveDays });
    warningsLogged += 1;
  }

  const usersToDeactivate = activeUsers.filter(
    (user) => userLastActiveDate(user) <= deactivationCutoff
  );

  for (let ni = 0; ni < usersToDeactivate.length; ni += 1) {
    const user = usersToDeactivate[ni];
    const deactivatedAt = new Date();
    const scheduledPurgeAt = new Date(
      deactivatedAt.getTime() +
        env.INACTIVITY_PURGE_DAYS_AFTER_DEACTIVATION * 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "DEACTIVATED",
        deactivatedAt,
        scheduledPurgeAt,
        removedReason: "Automatic inactivity deactivation",
      },
    });

    await notifyUser(
      toRecipient(user),
      "DEACTIVATION_NOTICE",
      "Account access has been removed due to inactivity. Contact support or an admin for reactivation.",
      {
        scheduledPurgeAt: scheduledPurgeAt.toISOString(),
      }
    );
  }

  const usersToPurge = await prisma.user.findMany({
    where: {
      status: "DEACTIVATED",
      scheduledPurgeAt: { lte: now },
    },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      phoneNumber: true,
      pushToken: true,
      emailNotifications: true,
      pushNotifications: true,
    },
  });

  for (let ni = 0; ni < usersToPurge.length; ni += 1) {
    const user = usersToPurge[ni];
    await createUserPurgeArchive(user.id, "Automatic purge after inactivity deactivation window");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: "PURGED",
        purgedAt: new Date(),
        email: `purged+${user.id}@nicrm.local`,
        displayName: "Purged account",
        phoneNumber: null,
        pushToken: null,
        passwordHash: "PURGED",
        removedReason: "Automatic purge after inactivity deactivation window",
      },
    });

    await notifyUser(
      toRecipient(user),
      "PURGE_NOTICE",
      "Your account has been purged after inactivity policy completion.",
      {}
    );
  }

  return {
    warningsLogged,
    deactivatedUsers: usersToDeactivate.length,
    purgedUsers: usersToPurge.length,
  };
}
