import Chat from "@/components/chat";

export default function Home() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Supabase Chat</h1>
      <Chat />
    </main>
  );
}