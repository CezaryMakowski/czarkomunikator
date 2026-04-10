import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { auth } from "@/auth";

const chatRequestSchema = z.object({
  currentUserId: z.string(),
  partnerId: z.string(),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const body = await request.json();
  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { currentUserId, partnerId } = parsed.data;

  if (session?.user?.id !== currentUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { name: true },
  });

  if (!partner) {
    return NextResponse.json(
      { error: "chat partner not found" },
      { status: 404 },
    );
  }

  // Szukaj istniejącej konwersacji między tymi dwoma użytkownikami
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      AND: [
        { users: { some: { id: currentUserId } } },
        { users: { some: { id: partnerId } } },
      ],
    },
  });

  if (existingConversation) {
    return NextResponse.json({
      conversationId: existingConversation.id,
      chatPartnerName: partner.name,
    });
  }

  // Utwórz nową konwersację
  const newConversation = await prisma.conversation.create({
    data: {
      users: {
        connect: [{ id: currentUserId }, { id: partnerId }],
      },
    },
  });

  return NextResponse.json({
    conversationId: newConversation.id,
    chatPartnerName: partner.name,
  });
}
