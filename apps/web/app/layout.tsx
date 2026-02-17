export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, fontFamily: 'sans-serif', padding: 16 }}>{children}</body>
    </html>
  );
}
