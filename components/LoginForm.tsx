"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import styles from "../styles/LoginForm.module.css";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type FormInput = {
  email: string;
  password: string;
};

export default function ContactForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>();

  const onSubmit: SubmitHandler<FormInput> = async (data) => {
    try {
      const email = data.email.trim().toLowerCase();

      const res = await signIn("credentials", {
        redirect: false,
        email,
        password: data.password,
      });
      if (!res?.error) {
        router.push("/");
      } else {
        console.error("Login error:", res.error);
        setError("password", { message: "Niepoprawny email lub hasło" });
      }
    } catch (err) {
      setError("password", {
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
      });
      console.error(err);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`  ${styles.form} glass-window`}
    >
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input {...register("email")} required id="email" type="email" />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Haslo</label>
        <input
          {...register("password")}
          required
          type="password"
          id="password"
        />
      </div>

      {errors.password && (
        <p className={styles.error}>{errors.password.message}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitBtn}
      >
        Zaloguj
      </button>

      <p className={styles.registerText}>
        Nie masz konta?{" "}
        <Link href="/rejestracja" className={styles.registerLink}>
          Zarejestruj sie
        </Link>
      </p>
    </form>
  );
}
