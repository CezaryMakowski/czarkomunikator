import { auth } from "@/auth";
import styles from "./page.module.css";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";

export default async function Login({
  searchParams,
}: {
  searchParams?: Promise<{ auth?: string }>;
}) {
  const authToken = (await searchParams)?.auth;
  const session = await auth();
  if (session) redirect("/");
  return (
    <main className={styles.main}>
      <section className={styles.panel}>
        <h1 className={styles.title}>Zaloguj sie</h1>
        {authToken && (
          <span className={styles.authMessage}>
            musisz sie zalogowac przed kontynuowaniem
          </span>
        )}
        <LoginForm />
      </section>
    </main>
  );
}
