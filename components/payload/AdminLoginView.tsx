import type { AdminViewServerProps } from "payload";
import { redirect } from "next/navigation";
import { AdminLoginForm } from "./AdminLoginForm";

export default function AdminLoginView({ initPageResult }: AdminViewServerProps) {
  if (initPageResult.req.user) {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
