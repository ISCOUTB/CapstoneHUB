"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../components/auth-provider";
import PasswordInput from "../components/password-input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isValidEmail } from "@/lib/validation";

const INVALID_CREDENTIALS_MESSAGES = new Set([
  "invalid credentials",
  "credenciales inválidas",
]);

function getLoginErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : "";

  if (INVALID_CREDENTIALS_MESSAGES.has(message.trim().toLowerCase())) {
    return "Correo o contraseña incorrectos.";
  }

  return message || "No se pudo iniciar sesión";
}

/** Ruta interna a la que volver tras el login (`?next=`), si es segura. */
function getPostLoginPath(): string {
  const next = new URLSearchParams(window.location.search).get("next");

  if (!next) {
    return "/home";
  }

  try {
    const resolved = new URL(next, window.location.origin);

    if (resolved.origin !== window.location.origin) {
      return "/home";
    }

    return resolved.pathname + resolved.search + resolved.hash;
  } catch {
    return "/home";
  }
}

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Ingresa tu correo electrónico.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Ingresa un correo electrónico válido.");
      return;
    }

    if (!password) {
      setErrorMessage("Ingresa tu contraseña.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      router.push(getPostLoginPath());
      router.refresh();
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            placeholder="usuario@correo.com"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            placeholder="Tu contraseña"
          />
        </Field>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" />}
          {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
        </Button>

        {errorMessage ? (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-utb-blue hover:underline"
          >
            Crear cuenta
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
