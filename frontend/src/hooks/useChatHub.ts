import { useEffect, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { MessageDto } from "@/api/messages";

const TOKEN_KEY = "bookify_auth_token";

export function useChatHub(onMessage: (msg: MessageDto) => void) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("/hubs/chat", {
        accessTokenFactory: () => localStorage.getItem(TOKEN_KEY) ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ReceiveMessage", (msg: MessageDto) => {
      onMessageRef.current(msg);
    });

    connection.start().catch(err => console.error("SignalR connect error:", err));
    connectionRef.current = connection;

    return () => {
      connection.stop();
    };
  }, []);

  const sendMessage = useCallback((receiverId: number, content: string) => {
    connectionRef.current?.invoke("SendMessage", receiverId, content).catch(console.error);
  }, []);

  return { sendMessage };
}
