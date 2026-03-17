import './globals.css';

export const metadata = {
  title: 'Revenue Recovery Engine — Setup Wizard',
  description: 'Set up your Revenue Recovery Engine in 5 easy steps.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
