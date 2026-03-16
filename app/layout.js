import './globals.css';

export const metadata = {
  title: 'Blueprint Personalizer',
  description: 'Personalize your Make.com blueprints with your Notion database IDs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
