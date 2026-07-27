import { useEffect, useRef } from "react";

/**
 * Kéo-để-trượt: nhấn giữ chuột và kéo bên trong vùng cuộn để pan ngang (và dọc).
 * Dùng Pointer Events + setPointerCapture để kéo mượt kể cả khi con trỏ ra ngoài.
 * Bỏ qua khi bắt đầu trên phần tử tương tác (button/link/input) để không cản click.
 * Cuộn bằng trackpad/thanh cuộn vẫn hoạt động song song (không can thiệp wheel).
 */
export function useDragScroll<T extends HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let dragging = false;
        let startX = 0;
        let startY = 0;
        let startLeft = 0;
        let startTop = 0;

        const onPointerDown = (e: PointerEvent) => {
            // Chỉ nút chuột trái; bỏ qua khi nhấn trúng control tương tác.
            if (e.button !== 0) return;
            const target = e.target as HTMLElement | null;
            if (target && target.closest('button, a, input, select, textarea, [role="button"]')) return;

            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = el.scrollLeft;
            startTop = el.scrollTop;
            el.setPointerCapture?.(e.pointerId);
            el.style.cursor = "grabbing";
            el.style.userSelect = "none";
        };

        const onPointerMove = (e: PointerEvent) => {
            if (!dragging) return;
            el.scrollLeft = startLeft - (e.clientX - startX);
            el.scrollTop = startTop - (e.clientY - startY);
        };

        const endDrag = (e: PointerEvent) => {
            if (!dragging) return;
            dragging = false;
            el.releasePointerCapture?.(e.pointerId);
            el.style.cursor = "";
            el.style.userSelect = "";
        };

        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", endDrag);
        el.addEventListener("pointercancel", endDrag);

        return () => {
            el.removeEventListener("pointerdown", onPointerDown);
            el.removeEventListener("pointermove", onPointerMove);
            el.removeEventListener("pointerup", endDrag);
            el.removeEventListener("pointercancel", endDrag);
        };
    }, []);

    return ref;
}
