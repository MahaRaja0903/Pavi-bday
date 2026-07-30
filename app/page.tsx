"use client";

import dynamic from "next/dynamic";

// Since BirthdayApp uses framer-motion and some browser specific features (like window/canvas confetti),
// it's safest to dynamically import it without SSR.
const BirthdayApp = dynamic(() => import("@/components/BirthdayApp"), { ssr: false });

export default function Page() {
  return <BirthdayApp />;
}
