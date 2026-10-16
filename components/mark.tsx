export function Mark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 22.5h16M10.5 22.5V14l5.5-4 5.5 4v8.5"
        className="stroke-primary-foreground"
        fill="none"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 22.5v-4.2h4v4.2" className="stroke-primary-foreground" fill="none" strokeWidth="1.7" />
    </svg>
  );
}
