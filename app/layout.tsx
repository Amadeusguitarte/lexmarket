import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'LexMarket · El siguiente paso, en buenas manos', description: 'Comparte tu caso, conoce propuestas y encuentra acompañamiento jurídico para avanzar.' };
export default function RootLayout({ children }: Readonly<{children:React.ReactNode}>) { return <html lang="es"><body>{children}</body></html>; }
