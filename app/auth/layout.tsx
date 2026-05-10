"use server"
import Link from "next/link";

type AuthPagesLayoutProps = {
  children: React.ReactNode;
};
const AuthPagesLayout = ({ children }: AuthPagesLayoutProps) => {
  return (
    <section className="min-h-screen w-full bg-[#FDFEFF] flex flex-col items-center">
      <section className="flex-1 w-full flex items-center justify-center px-4 py-10">
        <section className=" max-w-[680px]">{children}</section>
      </section>

      <footer className="w-full px-6 pb-6 pt-2">
        <p className="text-center text-sm text-slate-600">
          <span className="mr-1">Need assistance?</span>
          <Link className="text-slate-900 underline underline-offset-2" href="/contact">
            Contact us
          </Link>
        </p>

        <p className="mt-10 text-xs text-slate-400">Powered by Nexoris Technologies</p>
      </footer>
    </section>
  );
};

export default AuthPagesLayout;
