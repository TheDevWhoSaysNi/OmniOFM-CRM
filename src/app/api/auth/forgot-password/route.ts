import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { badRequest } from "@/lib/http";
import { generateRandomToken, sha256 } from "@/lib/security";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return badRequest("Invalid request body", parsed.error.flatten());
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const rawToken = generateRandomToken(32);
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  // Placeholder until email provider is wired:
  // in non-production we return the reset token for easy local testing.
  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== "production" ? { devResetToken: rawToken } : {}),
  });
}
