export async function updateLastSeen(userId: string) {
  try {
    await fetch("/api/user", {
      method: "POST",
      body: JSON.stringify({
        action: "leave",
        userId,
      }),
    });
  } catch (error) {
    console.error("Error updating user status:", error);
  }
}
