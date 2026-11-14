import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Interview Atlas | 案件検索・応募・面談練習",
  description: "29職種のフリーランス案件検索・制作会社調査・応募管理・面談練習",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
