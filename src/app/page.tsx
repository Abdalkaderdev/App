"use client";

import VoiceSphere from "../components/VoiceSphere";

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 grid place-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8 w-full">
        <VoiceSphere />
        <a href="/docs" className="underline text-blue-600">
          Read our docs
        </a>
      </main>
    </div>
  );
}
