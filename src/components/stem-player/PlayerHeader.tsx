import { FIGMA } from "../../figma/layout";

export default function PlayerHeader() {
  return (
    <header
      className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex w-full shrink-0 items-center justify-center"
      style={{ height: FIGMA.header.height }}
    >
      <h1 className="header-title whitespace-nowrap text-content-primary">Stem Player</h1>
    </header>
  );
}
