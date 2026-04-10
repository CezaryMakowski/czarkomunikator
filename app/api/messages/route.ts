import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { messageSchema, sendMessageSchema } from "@/lib/zod/schemas";
import { z } from "zod";

const markSeenSchema = z.object({
  conversationId: z.string(),
});

export async function GET(request: NextRequest) {
  const conversationId = request.nextUrl.searchParams.get("conversationId");

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversationId query parameter is required" },
      { status: 400 },
    );
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true } } },
  });

  const parsed = messages.map((message) => {
    const parsedMessage = messageSchema.parse({
      ...message,
      senderName: message.sender.name ?? "Unknown user",
    });
    return parsedMessage;
  });

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const data = await request.json();

  const parsed = sendMessageSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { body, image, conversationId, clientSideId } = parsed.data;

  const session = await auth();
  const currentUserId = session?.user?.id;
  if (!currentUserId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const conversationExists = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversationExists) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 },
    );
  }

  const message = await prisma.message.create({
    data: {
      body: body ?? null,
      image: image ?? null,
      conversationId,
      clientSideId: clientSideId ?? null,
      senderId: currentUserId,
    },
    include: { sender: { select: { name: true } } },
  });

  const result = messageSchema.parse({
    ...message,
    senderName: message.sender.name,
  });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const currentUserId = session?.user?.id;
  if (!currentUserId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = markSeenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { conversationId } = parsed.data;

  const updated = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: currentUserId },
      seen: false,
    },
    data: { seen: true },
  });

  return NextResponse.json({ updated: updated.count });
}
