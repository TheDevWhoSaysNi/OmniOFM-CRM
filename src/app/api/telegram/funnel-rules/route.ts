import { NextResponse } from "next/server";
import { z } from "zod";
import { IntegrationProvider } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { badRequest, forbidden, unauthorized } from "@/lib/http";
import { getSession, hasRequiredRole } from "@/lib/auth/session";

const createRuleSchema = z.object({
  triggerKeyword: z.string().min(1).max(64),
  targetProvider: z.enum(["FANVUE", "ONLYFANS", "TELEGRAM"] satisfies [IntegrationProvider, ...IntegrationProvider[]]),
  targetLabel: z.string().max(120).optional(),
  isDefault: z.boolean().optional(),
});

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const rules = await prisma.telegramFunnelRule.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }
  if (!hasRequiredRole(session.role, ["ADMIN", "MANAGER"])) {
    return forbidden();
  }

  const parsed = createRuleSchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid funnel rule payload.", parsed.error.flatten());
  }

  const created = await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.telegramFunnelRule.updateMany({
        where: { workspaceId: session.workspaceId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.telegramFunnelRule.create({
      data: {
        workspaceId: session.workspaceId,
        triggerKeyword: parsed.data.triggerKeyword,
        targetProvider: parsed.data.targetProvider,
        targetLabel: parsed.data.targetLabel,
        isDefault: parsed.data.isDefault ?? false,
        isActive: true,
      },
    });
  });

  return NextResponse.json({ rule: created }, { status: 201 });
}
