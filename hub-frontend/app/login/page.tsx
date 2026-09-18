import LoginForm from "./login-form";
import { UtbLogo } from "../components/utb-logo";

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center text-foreground">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="utb-rise grid w-full overflow-hidden rounded-3xl bg-card shadow-xl shadow-utb-blue/10 ring-1 ring-utb-blue/10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Panel institucional */}
          <div className="noise-overlay relative overflow-hidden bg-gradient-to-br from-utb-deep-blue via-utb-navy to-utb-blue/40 p-8 sm:p-10 lg:p-12">
            <div className="grid-lines-dark pointer-events-none absolute inset-0 opacity-60" />
            <div className="utb-orb pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-utb-blue/25 blur-3xl" />

            <div className="relative z-10 flex h-full flex-col gap-6">
              <UtbLogo size={40} className="text-white" />

              <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-utb-blue-pale/70 uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Acceso privado
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Inicia sesión para editar proyectos
              </h1>

              <p className="max-w-lg text-sm leading-relaxed text-white/50">
                Los visitantes públicos pueden consultar los proyectos, pero solo
                los usuarios autenticados pueden crear propuestas, actualizar
                estados y añadir observaciones.
              </p>
            </div>
          </div>

          {/* Formulario */}
          <div className="flex items-center p-8 sm:p-10 lg:p-12">
            <div className="w-full">
              <p className="mb-6 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                Credenciales
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
