import AutomotiveHero from "@/components/auth/AutomotiveHero";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <main className="min-h-dvh bg-[#f5f7fa] lg:flex">
      <AutomotiveHero />
      <RegisterForm />
    </main>
  );
}