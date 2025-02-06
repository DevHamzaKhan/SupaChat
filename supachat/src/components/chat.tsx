"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { RealtimeSubscription } from "@supabase/supabase-js";
import { Input } from "./ui/input";
import { Button } from "./ui/button";

type Message = {
  id: number;
  created_at: string;
  username: string;
  message: string;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_KEY!
);

export default function Chat() {
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("Username");
  const [messages, setMessages] = useState<Message[]>([]);
  const [subscription, setSubscription] = useState<RealtimeSubscription | null>(null);

  useEffect(() => {
    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Setup realtime subscription
    const sub = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    setSubscription(sub);

    return () => {
      sub?.unsubscribe();
    };
  }, []);

  async function onSend() {
    if (message.trim().length === 0) return;
    
    const { error } = await supabase
      .from('messages')
      .insert([{ username, message }]);
    
    if (!error) setMessage("");
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="flex-1"
        />
        <Input
          placeholder="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => e.key === "Enter" && onSend()}
          className="flex-[3]"
        />
        <Button onClick={onSend}>Send</Button>
      </div>
      
      <div className="space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[75%] ${
              username === msg.username
                ? "ml-auto bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800"
            }`}
          >
            <div className="text-sm font-medium">{msg.username}</div>
            <div>{msg.message}</div>
            <div className="text-xs opacity-75 mt-1">
              {new Date(msg.created_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}