import MobileSidebar from "@/components/MobileSidebar";
import styles from "./page.module.css";
import SignOut from "@/components/SignOut";
import UserList from "@/components/UserList";
import Chat from "@/components/Chat";
import { auth } from "@/auth";
import { PresenceProvider } from "@/hooks/PresenceContext";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const chatPartnerId = resolvedParams.id;

  const session = await auth();
  let currentUser: { id: string; name: string } = { id: "", name: "" };
  if (session?.user?.id && session?.user?.name) {
    currentUser = { id: session.user.id, name: session.user.name };
  }

  return (
    <PresenceProvider currentUserId={currentUser.id}>
      <main className={styles.main}>
        <MobileSidebar
          currentUserName={currentUser.name}
          currentUserId={currentUser.id}
        />
        <div className={styles.chatContainer}>
          <div className={styles.sidebar}>
            <SignOut
              name={currentUser.name || "Guest"}
              userId={currentUser.id}
            />
            <UserList currentUserId={currentUser.id} />
          </div>
          <Chat currentUser={currentUser} chatPartnerId={chatPartnerId} />
        </div>
      </main>
    </PresenceProvider>
  );
}
