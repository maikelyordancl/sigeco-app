import MainLayout from "@/components/Layout/MainLayout";
import { ReactNode } from "react";

// Next.js espera este tipo de estructura para layouts
export default function Layout({ children }: { children: ReactNode }) {
  return <MainLayout>{children}</MainLayout>;
}
