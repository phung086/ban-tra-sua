import type { ReactNode } from "react";
export function RoomBackdrop({ children, kind }: { children: ReactNode; kind: string }) { return <div className={`room-panel room-${kind}`}>{children}</div>; }
