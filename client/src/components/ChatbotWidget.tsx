import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import LeadCaptureForm from "./LeadCaptureForm";
import { useLocation } from "wouter";

interface ChatbotAction {
  type: "capture_lead" | "link";
  payload?: string;
  label?: { en: string; es: string };
}

interface Message {
  sender: "user" | "bot";
  message: string;
  action?: ChatbotAction;
}

export default function ChatbotWidget() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<string>("");
  const [showLeadForm, setShowLeadForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const createMutation = trpc.chatbot.createConversation.useMutation();
  const sendMutation = trpc.chatbot.sendMessage.useMutation();
  const captureLeadMutation = trpc.chatbot.captureLead.useMutation();

  useEffect(() => {
    if (isOpen && !conversationId) {
      createMutation.mutate({ language }, {
        onSuccess: (data) => {
          setConversationId(data.conversationId);
          const initialMsg = language === "es" 
            ? "¡Hola! ¿Cómo puedo ayudarte con ClearLet hoy?" 
            : "Hello! How can I help you with ClearLet today?";
          setMessages([{ sender: "bot", message: initialMsg }]);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showLeadForm]);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId) return;
    const userMsg = inputValue;
    setMessages(prev => [...prev, { sender: "user", message: userMsg }]);
    setInputValue("");

    sendMutation.mutate({ conversationId, message: userMsg, language }, {
      onSuccess: (data) => {
        // Handle legacy suggestedAction and new action object
        const action = data.action || (data.suggestedAction === "capture_lead" ? { type: "capture_lead" } : undefined);
        
        setMessages(prev => [...prev, { 
          sender: "bot", 
          message: data.message,
          action: action as ChatbotAction
        }]);

        if (action?.type === "capture_lead") {
          setShowLeadForm(true);
        }
      }
    });
  };

  const handleLeadSubmit = async (data: any) => {
    if (!conversationId) return;
    
    await captureLeadMutation.mutateAsync({
      conversationId,
      ...data
    });
    
    setShowLeadForm(false);
    const successMsg = language === "es"
      ? "¡Gracias! Hemos recibido tus datos y nos pondremos en contacto pronto."
      : "Thanks! We've received your details and will be in touch shortly.";
    
    setMessages(prev => [...prev, { 
      sender: "bot", 
      message: successMsg 
    }]);
    
    const toastMsg = language === "es" ? "¡Datos enviados!" : "Details sent successfully!";
    toast.success(toastMsg);
  };

  const handleActionClick = (action: ChatbotAction) => {
    if (action.type === "link" && action.payload) {
      if (action.payload.startsWith("http")) {
        window.open(action.payload, "_blank");
      } else {
        setLocation(action.payload);
        setIsOpen(false); // Close chat when navigating
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {isOpen ? (
        <div className="w-80 h-[500px] bg-white dark:bg-slate-900 border-2 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 bg-cyan-500 text-white flex justify-between items-center">
            <span className="font-bold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> ClearBot</span>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsOpen(false)}><X /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${m.sender === "user" ? "bg-cyan-500 text-white rounded-br-none" : "bg-white dark:bg-slate-800 border rounded-bl-none shadow-sm"}`}>
                  {m.message}
                </div>
                
                {/* Render Action Link if present */}
                {m.sender === "bot" && m.action?.type === "link" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-xs bg-white dark:bg-slate-800 hover:bg-slate-50 border-cyan-200 text-cyan-600"
                    onClick={() => handleActionClick(m.action!)}
                  >
                    {m.action.label?.[language] || "Click here"}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {sendMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border p-2 rounded-lg animate-pulse"><Loader2 className="h-4 w-4 animate-spin" /></div>
              </div>
            )}
            
            {showLeadForm && (
              <LeadCaptureForm 
                language={language}
                onSubmit={handleLeadSubmit}
                onCancel={() => setShowLeadForm(false)}
                isLoading={captureLeadMutation.isPending}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t bg-white dark:bg-slate-900 flex gap-2">
            <input 
              className="flex-1 text-sm outline-none bg-transparent" 
              placeholder={language === "es" ? "Pregúntame algo..." : "Ask me something..."} 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={showLeadForm}
            />
            <Button size="icon" className="h-8 w-8 bg-cyan-500" onClick={handleSend} disabled={sendMutation.isPending || showLeadForm}><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-cyan-500 text-white shadow-xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      )}
    </div>
  );
}
