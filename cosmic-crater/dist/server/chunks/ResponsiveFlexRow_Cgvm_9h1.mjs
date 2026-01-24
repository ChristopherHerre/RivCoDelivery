import { jsx } from 'react/jsx-runtime';
import 'react';

function ResponsiveFlexRow({
  children,
  className = "",
  justify = "between",
  align = "center",
  card = false,
  vertical = false,
  borderTop = false,
  margin = "",
  variant = "primary"
}) {
  const justifyClass = justify === "end" ? "justify-end" : justify === "start" ? "justify-start" : "justify-between";
  const alignClass = align === "start" ? "items-start" : align === "stretch" ? "items-stretch" : "items-center";
  const alignStackClass = align === "stretch" ? "max-sm:items-stretch" : "max-sm:items-start";
  const backgroundClass = "";
  const shadowClass = "";
  const paddingClass = variant === "nested" ? "" : "p-4";
  const roundedClass = "";
  const baseClasses = `${backgroundClass} ${shadowClass} ${roundedClass} ${paddingClass} flex`;
  const cardClasses = card ? "h-full" : "";
  const verticalClass = vertical ? "flex-col" : "";
  const responsiveVerticalClass = vertical ? "" : "max-sm:flex-col";
  const borderTopClass = borderTop ? "mt-auto pt-2" : "";
  const marginClass = margin || "";
  const allClasses = [
    baseClasses,
    justifyClass,
    alignClass,
    verticalClass,
    cardClasses,
    borderTopClass,
    marginClass,
    responsiveVerticalClass,
    "max-sm:gap-2",
    alignStackClass,
    "max-sm:items-stretch",
    className
  ].filter(Boolean).join(" ");
  return /* @__PURE__ */ jsx("div", { className: allClasses, children });
}

export { ResponsiveFlexRow as R };
