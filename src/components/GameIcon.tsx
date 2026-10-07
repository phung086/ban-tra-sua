const paths: Record<string, string> = {
  cup: "M7 8h10l-1 12H8L7 8Zm-1-3h12M14 5l2-3M9 12h6",
  box: "m3 7 9-4 9 4v11l-9 4-9-4V7Zm0 0 9 4 9-4M12 11v11m-4-17 9 4",
  tool: "m14 3-2 5 4 4 5-2a7 7 0 0 1-9 7l-5 5-4-4 5-5A7 7 0 0 1 14 3Z",
  chat: "M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5",
  board: "M7 5H4v16h16V5h-3M8 3h8v4H8V3Zm0 8h8m-8 4h5",
  coin: "M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM14 8h-3a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-3m2-10v12",
  star: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  leaf: "M20 3C7 2 2 8 5 15s15 7 15-12ZM5 19 16 8m-6 6V9m0 5h5",
  person: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-3a8 8 0 0 1 16 0v3",
  settings:
    "M12 3v3m0 12v3M3 12h3m12 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};
export function GameIcon({ name = "cup" }: { name?: string }) {
  return (
    <svg
      className={`game-icon icon-${name}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] ?? paths.cup} />
    </svg>
  );
}
