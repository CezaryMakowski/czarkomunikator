"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registryFormSchema, type RegistryFormInput } from "@/lib/zod/schemas";
import styles from "@/styles/RegistryForm.module.css";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegistryForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegistryFormInput>({ resolver: zodResolver(registryFormSchema) });
  const [isUnknownError, setIsUnknownError] = useState(false);

  async function onSubmit(data: RegistryFormInput) {
    setIsUnknownError(false);
    let URL = process.env.NEXT_PUBLIC_NEXTAUTH_URL as string;
    try {
      const res = await fetch(`${URL}/api/rejestracja`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      const responseData = await res.json();

      const hasServerErrors =
        responseData.error?.name || responseData.error?.email;

      if (responseData.error?.name) {
        setError("name", {
          type: "server",
          message: responseData.error.name,
        });
      }

      if (responseData.error?.email) {
        setError("email", {
          type: "server",
          message: responseData.error.email,
        });
      }

      if (!hasServerErrors && !res.ok) {
        throw new Error(res.statusText);
      }

      if (res.ok) {
        signIn("credentials", {
          email: data.email,
          password: data.password,
          redirectTo: "/",
        });
      }
    } catch (error) {
      console.error(error);
      setIsUnknownError(true);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`  ${styles.form} glass-window`}
    >
      <div className={styles.inputWrapper}>
        <label htmlFor="name">Imię:</label>
        <input {...register("name")} id="name" />
        {errors.name && <p className={styles.error}>{errors.name.message}</p>}
      </div>

      <div className={styles.inputWrapper}>
        <label htmlFor="email">Email:</label>
        <input {...register("email")} type="email" id="email" />
        {errors.email && <p className={styles.error}>{errors.email.message}</p>}
      </div>

      <div className={styles.inputWrapper}>
        <label htmlFor="password">Hasło:</label>
        <input {...register("password")} type="password" id="password" />
        {errors.password && (
          <p className={styles.error}>{errors.password.message}</p>
        )}
      </div>

      <div className={styles.inputWrapper}>
        <label htmlFor="confirmPassword">Powtórz hasło:</label>
        <input
          {...register("confirmPassword")}
          type="password"
          id="confirmPassword"
        />
        {errors.confirmPassword && (
          <p className={styles.error}>{errors.confirmPassword.message}</p>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        Zarejestruj
      </button>
      {isUnknownError && (
        <div className={styles.unknownError}>
          <p className={styles.error}>
            coś poszło nie tak, spróbuj ponownie później
          </p>
        </div>
      )}
      <p className={styles.loginText}>
        Masz już konto?{" "}
        <Link href="/login" className={styles.loginLink}>
          zaloguj się
        </Link>
      </p>
    </form>
  );
}
