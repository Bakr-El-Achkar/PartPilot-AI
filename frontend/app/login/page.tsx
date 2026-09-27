import AutomotiveHero from "@/components/auth/AutomotiveHero";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-[#f5f7fa] lg:flex">
      <AutomotiveHero />
      <LoginForm />
    </main>
  );
}