import { useState, useRef, useEffect } from "react"
import { Bot, User } from "lucide-react"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Avatar, AvatarFallback } from "../../components/ui/avatar"

export default function BusinessDashboard() {
  const salesData = [
    { title: "Salon Sales", value: "$0" },
    { title: "Website Sales", value: "$0" },
    { title: "Product Sales", value: "$0" },
  ]

  // Historial de mensajes
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [userMessage, setUserMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Scroll automático al final
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Manejar envío de mensajes
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (userMessage.trim() === "") return;

    const userMsg = { role: "user", text: userMessage };
    setMessages((prev) => [...prev, userMsg]);
    setUserMessage("");
    setLoading(true);

    try {
      const res = await fetch("https://staging-app.rizosfelices.co/agent/api/ask?mode=production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "default_user" // O usa un ID de usuario real
        },
        body: JSON.stringify({ question: userMessage }), // Cambiado de 'query' a 'question'
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Error en la respuesta del servidor");
      }

      const data = await res.json();
      const agentResponse = data.response || data.answer || "No response from agent.";

      setMessages((prev) => [...prev, { role: "agent", text: agentResponse }]);
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "agent",
          text: err instanceof Error ? `❌ ${err.message}` : "❌ Error desconocido"
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col">
      {/* Header - Dashboard Cards */}
      <header className="border-b border-gray-100 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-black mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {salesData.map((item, index) => (
              <Card key={index} className="bg-white shadow-sm border border-gray-100 rounded-xl">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-600">{item.title}</h3>
                    <p className="text-xl font-semibold text-black">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content - Business AI Agent Assistant */}
      <main className="flex-1 p-8 relative">
        <div className="max-w-5xl mx-auto h-full flex flex-col pb-24">
          {/* Profile Avatar */}
          <div className="flex justify-end mb-6">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gray-100">
                <User className="h-5 w-5 text-gray-600" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* AI Agent Section */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Bot className="h-5 w-5 text-black" />
              <h2 className="text-xl font-semibold text-black">Business AI Agent</h2>
            </div>

            {/* Chat Messages */}
            <div
              className="space-y-4 flex-1 mb-8 overflow-y-auto pr-2 custom-scrollbar"
              style={{ maxHeight: "450px" }}
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <Card
                    className={`shadow-sm rounded-2xl px-4 py-3 max-w-3xl break-words ${msg.role === "user"
                        ? "bg-gray-700 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                      }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </Card>
                </div>
              ))}

              {loading && (
                <Card className="bg-gray-100 shadow-sm rounded-xl max-w-3xl px-4 py-3">
                  <p className="text-sm text-gray-500">Escribiendo...</p>
                </Card>
              )}
              <div ref={chatEndRef}></div>
            </div>
          </div>
        </div>

        {/* Input Area - Fixed Bottom */}
        <form
          onSubmit={handleSendMessage}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4"
        >
          <div className="max-w-5xl mx-auto flex gap-2">
            <Input
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              placeholder="Type here to talk to your business agent..."
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition"
            >
              Send
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
