export default function Footer() {
  return (
    <footer className="shrink-0 border-t py-5" style={{ borderColor: "var(--dc-border)", background: "var(--dc-surface)" }} role="contentinfo">
      <div className="dc-text-muted mx-auto flex max-w-7xl flex-col justify-between gap-1 px-4 text-xs sm:flex-row sm:px-6">
        <span>Portfolio ukázka · nikoli produkční CRM</span>
        <span>Data zůstávají pouze v prohlížeči</span>
      </div>
    </footer>
  );
}
