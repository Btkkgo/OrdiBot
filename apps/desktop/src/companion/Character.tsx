/** Original OrdiBot "Orbit" character. Drawn for this app, no reference artwork reused. */
export function Character({ headOnly = false }: { headOnly?: boolean }) {
  return (
    <svg
      className="orbit-character"
      viewBox={headOnly ? "8 0 50 51" : "0 0 64 76"}
      role="img"
      aria-label="OrdiBot 原创小角色 Orbit"
    >
      <ellipse cx="32" cy="70" rx="20" ry="3" fill="#000" opacity=".15" />
      <path
        d="M16 42Q4 41 6 57Q10 65 18 58"
        fill="#be9bf2"
        stroke="#59415e"
        strokeWidth="2"
      />
      <path
        d="M18 60L17 68Q20 71 25 67M38 64L39 69Q45 71 48 67"
        fill="#efb36d"
        stroke="#6f4e41"
        strokeWidth="2"
      />
      <path
        d="M15 31L17 13Q19 8 30 24L41 23Q52 8 54 15L53 35"
        fill="#f4c984"
        stroke="#6f4e41"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M18 36Q10 55 19 64Q30 70 46 63Q57 56 50 36"
        fill="#f8e6bf"
        stroke="#6f4e41"
        strokeWidth="2"
      />
      <path
        d="M13 39Q11 28 22 24Q37 19 48 28Q57 40 45 48Q33 54 18 48Z"
        fill="#fff3d6"
        stroke="#6f4e41"
        strokeWidth="2"
      />
      <path d="M18 18L21 27L27 25M48 18L44 26L50 28" fill="#e9a78b" />
      <ellipse cx="23" cy="38" rx="2" ry="3" fill="#60464e" />
      <ellipse cx="42" cy="38" rx="2" ry="3" fill="#60464e" />
      <path
        d="M30 42Q33 46 36 42"
        fill="none"
        stroke="#60464e"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <ellipse cx="19" cy="44" rx="4" ry="2" fill="#ecb3a0" />
      <ellipse cx="46" cy="44" rx="4" ry="2" fill="#ecb3a0" />
      <path
        d="M16 54Q32 61 50 53L49 60Q31 67 17 61Z"
        fill="#be9bf2"
        stroke="#6f4e41"
        strokeWidth="1.5"
      />
      <path d="M43 58L47 66L40 66L39 59" fill="#a184da" />
      <path
        d="M26 12Q20 7 25 3Q34 0 36 8"
        fill="#b89add"
        stroke="#6f4e41"
        strokeWidth="1.5"
      />
      <path d="M29 9L31 18" stroke="#6f4e41" strokeWidth="1.5" />
    </svg>
  );
}
