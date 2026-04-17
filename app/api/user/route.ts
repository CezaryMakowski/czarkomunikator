import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        lastSeenAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const { action, userId } = await req.json();

  if (action === "leave") {
    const result = await prisma.user.update({
      where: { id: userId },
      data: { lastSeenAt: new Date() },
    });

    if (!result) {
      console.error("Failed to update user status for userId:", userId);
      return NextResponse.json(
        { error: "Failed to update user status" },
        { status: 500 },
      );
    }
  }
  return NextResponse.json({ message: "User status updated" });
}

export async function DELETE(req: NextRequest) {
  const { userId } = await req.json();
  const result = await prisma.conversation.deleteMany({
    where: {
      users: {
        some: {
          id: userId,
        },
      },
    },
  });

  if (!result) {
    console.error("Failed to delete conversations for userId:", userId);
    return NextResponse.json(
      { error: "Failed to delete conversations" },
      { status: 500 },
    );
  }

  const user = await prisma.user.delete({
    where: { id: userId },
  });

  if (!user) {
    console.error("Failed to delete user with userId:", userId);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }

  return NextResponse.json({ message: "Account deleted successfully" });
}
