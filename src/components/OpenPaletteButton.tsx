"use client";
export default function OpenPaletteButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => window.dispatchEvent(new CustomEvent("phonehub:open-palette"))}
    >
      {children}
    </button>
  );
}
