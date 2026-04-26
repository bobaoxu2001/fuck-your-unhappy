import CharacterGenerator from "@/components/CharacterGenerator";

export default function CharacterGeneratorPage() {
  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#FFE4F3_0,#FAF5FF_34%,#E0F2FE_100%)] px-4 py-8 text-gray-950 md:px-8">
      <CharacterGenerator />
    </main>
  );
}
