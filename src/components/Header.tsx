import Link from "next/link";

export function Header() {
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark" aria-hidden="true">M</span>
        <span>MedImage QC</span>
      </Link>
      <nav aria-label="Main navigation">
        <Link href="/analyze">Analyze</Link>
        <Link href="/methodology">Methodology</Link>
        <Link href="/about">About</Link>
      </nav>
      <div className="local-badge"><span aria-hidden="true">●</span> Local processing</div>
    </header>
  );
}
