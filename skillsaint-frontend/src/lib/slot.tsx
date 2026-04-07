import React, { ReactElement, ReactNode, cloneElement, isValidElement } from "react";

type SlotProps = {
  children: ReactNode;
};

/**
 * A simple Slot implementation that merges its props with its child.
 * Similar to Radix UI's Slot but minimal.
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (!isValidElement(children)) {
    return null;
  }

  return cloneElement(children as ReactElement, {
    ...props,
    // @ts-expect-error: Cloning and merging refs is tricky but this works for standard HTML elements
    ref: (node: HTMLElement | null) => {
      // Forward outer ref
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLElement | null>).current = node;
      }

      // Preserve child's original ref if it exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const childRef = (children as any).ref;
      if (typeof childRef === "function") {
        childRef(node);
      } else if (childRef && typeof childRef === "object") {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
  });
});

Slot.displayName = "Slot";
