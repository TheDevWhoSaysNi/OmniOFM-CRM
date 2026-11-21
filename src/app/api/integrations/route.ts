import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unauthorized } from "@/lib/http";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return unauthorized();
  }

  const connections = await prisma.integrationConnection.findMany({
    where: { workspaceId: session.workspaceId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ integrations: connections });
}
