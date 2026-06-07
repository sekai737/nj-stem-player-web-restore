import { FIGMA } from "../../figma/layout";
import FigmaIconButton from "../stem-player/FigmaIconButton";
import type { ComponentProps } from "react";

type FixedNavIconButtonProps = Omit<ComponentProps<typeof FigmaIconButton>, "size">;

export default function FixedNavIconButton(props: FixedNavIconButtonProps) {
  return <FigmaIconButton {...props} size={FIGMA.header.fixedNavIcon} />;
}
