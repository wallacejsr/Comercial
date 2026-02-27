import { useState, useEffect } from 'react';
import { MessageSquare, Send, Phone, User, Search } from 'lucide-react';
import { cn } from '../lib/utils';

interface Chat {
  id: number;
  customer_name: string;
  last_message: string;
  time: string;
  unread?: number;
}

export default function Communication() {
  const [chats, setChats] = useState<Chat[]>([
    { id: 1, customer_name: 'João Silva', last_message: 'Olá, gostaria de saber mais sobre o produto.', time: '10:30', unread: 2 },
    { id: 2, customer_name: 'Maria Oliveira', last_message: 'Obrigada pelo retorno!', time: 'Ontem' },
    { id: 3, customer_name: 'Carlos Souza', last_message: 'Pode me enviar a proposta por aqui?', time: 'Segunda' },
  ]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(chats[0]);
  const [message, setMessage] = useState('');

  return (
    <div className="h-[calc(100vh-12rem)] flex bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversas..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={cn(
                "w-full p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors text-left",
                selectedChat?.id === chat.id && "bg-indigo-50"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-bold text-slate-900 truncate">{chat.customer_name}</h4>
                  <span className="text-[10px] text-slate-400">{chat.time}</span>
                </div>
                <p className="text-xs text-slate-500 truncate">{chat.last_message}</p>
              </div>
              {chat.unread && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedChat.customer_name}</h3>
                  <span className="text-xs text-emerald-500 font-medium">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                  <Phone size={20} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all">
                  <MessageSquare size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50 overflow-y-auto space-y-4">
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-md border border-slate-200">
                  <p className="text-sm text-slate-700">{selectedChat.last_message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">10:30</span>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-indigo-600 p-3 rounded-2xl rounded-tr-none shadow-sm max-w-md text-white">
                  <p className="text-sm">Olá! Claro, como posso ajudar hoje?</p>
                  <span className="text-[10px] text-indigo-200 mt-1 block">10:31</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form 
                onSubmit={(e) => { e.preventDefault(); setMessage(''); }}
                className="flex items-center gap-3"
              >
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem..." 
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  type="submit"
                  className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageSquare size={48} className="mb-4 opacity-20" />
            <p>Selecione uma conversa para começar</p>
          </div>
        )}
      </div>
    </div>
  );
}
