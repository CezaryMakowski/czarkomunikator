import styles from "./page.module.css";
import SignOut from "@/components/SignOut";
import UserList from "@/components/UserList";
import { auth } from "@/auth";
import { PresenceProvider } from "@/hooks/PresenceContext";

export default async function Home() {
  const session = await auth();
  let currentUser: { id: string; name: string } = { id: "", name: "" };
  if (session?.user?.id && session?.user?.name) {
    currentUser = { id: session.user.id, name: session.user.name };
  }

  return (
    <PresenceProvider currentUserId={currentUser.id}>
      <main className={styles.main}>
        <SignOut name={currentUser.name || "Guest"} userId={currentUser.id} />
        <UserList currentUserId={currentUser.id} />
      </main>
    </PresenceProvider>
  );
}
