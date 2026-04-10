import { auth } from "@/auth";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import RegistryForm from "@/components/RegistryForm";

export default async function Login() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Rejestracja</h1>
        <div className={styles.formWrapper}>
          <RegistryForm />
        </div>
      </div>
    </main>
  );
}
