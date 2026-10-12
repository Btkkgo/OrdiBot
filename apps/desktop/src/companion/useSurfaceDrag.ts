import { useRef, type PointerEvent } from "react";
import { invoke } from "@tauri-apps/api/core";

/** A captured pointer keeps movement available while the borderless native surface moves. */
export function useSurfaceDrag(
  onClick?: () => void,
  onError?: (error: unknown) => void,
) {
  const pointer = useRef<
    | {
        id: number;
        x: number;
        y: number;
        moved: boolean;
        queue: Promise<unknown>;
      }
    | undefined
  >(undefined);
  const enqueue = (phase: string, dx = 0, dy = 0) => {
    const p = pointer.current;
    if (p)
      p.queue = p.queue
        .then(() => invoke("surface_drag", { phase, dx, dy }))
        .catch((e) => {
          onError?.(e);
        });
  };
  return {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (
        e.button !== 0 ||
        (!onClick &&
          (e.target as Element).closest("button,input,select,textarea"))
      )
        return;
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      pointer.current = {
        id: e.pointerId,
        x: e.screenX,
        y: e.screenY,
        moved: false,
        queue: Promise.resolve(),
      };
      enqueue("start");
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      const p = pointer.current;
      if (!p || p.id !== e.pointerId) return;
      const dx = e.screenX - p.x,
        dy = e.screenY - p.y;
      if (Math.abs(dx) + Math.abs(dy) > 5) p.moved = true;
      if (p.moved) enqueue("move", dx, dy);
    },
    onPointerUp(e: PointerEvent<HTMLElement>) {
      const p = pointer.current;
      if (!p || p.id !== e.pointerId) return;
      enqueue("end");
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
      const click = !p.moved;
      void p.queue.then(() => {
        if (click) onClick?.();
      });
      pointer.current = undefined;
    },
    onPointerCancel(e: PointerEvent<HTMLElement>) {
      if (pointer.current?.id === e.pointerId) {
        enqueue("end");
        pointer.current = undefined;
      }
    },
  };
}
