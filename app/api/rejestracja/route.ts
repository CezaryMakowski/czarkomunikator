import { RegistryFormInput, registryFormSchema } from "@/lib/zod/schemas";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const data: RegistryFormInput = await req.json();

  const result = registryFormSchema.safeParse(data);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }

  const password = await bcrypt.hash(data.password, 12);
  const email = data.email.toLowerCase();
  const existingUserEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUserEmail)
    return NextResponse.json(
      { error: { email: "podany email już istnieje" } },
      { status: 422 },
    );

  const existingUserName = await prisma.user.findUnique({
    where: { name: data.name },
  });

  if (existingUserName)
    return NextResponse.json(
      { error: { name: "podana nazwa użytkownika już istnieje" } },
      { status: 422 },
    );

  const user = await prisma.user.create({
    data: {
      email,
      name: data.name,
      hashedPassword: password,
    },
  });

  if (!user)
    return NextResponse.json(
      { success: false },
      { status: 500, statusText: "Nie można utworzyć użytkownika" },
    );

  return NextResponse.json(user);
}
