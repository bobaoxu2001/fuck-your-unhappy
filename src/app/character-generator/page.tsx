import { redirect } from "next/navigation";

export default function CharacterGeneratorPage() {
  // The old standalone image lab bypassed the main flow's redaction and safety context.
  redirect("/");
}
