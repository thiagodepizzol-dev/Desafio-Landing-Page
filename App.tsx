
import React, { useState, useEffect } from 'react';
import { BrainIcon, StrengthIcon, MeditationIcon, LotusIcon } from './components/Icons';

// --- CONFIGURAÇÃO DO FIREBASE (MODULAR SDK V9+) ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// PREENCHA COM SEUS DADOS DO CONSOLE DO FIREBASE AQUI:
const firebaseConfig = {
  apiKey: "AIzaSyBcuvdJ7rGvw9OPcogja9BdTnda7ihJZmk",
  authDomain: "dias-3b6d2.firebaseapp.com",
  projectId: "dias-3b6d2",
  storageBucket: "dias-3b6d2.firebasestorage.app",
  messagingSenderId: "761341789041",
  appId: "1:761341789041:web:46798555abde44faedacd0",
  measurementId: "G-9Y1K16JC7M"
};

// Inicialização segura do Firebase fora do componente
let app;
let db: any;
let auth: any;

try {
  // Padrão Singleton para evitar recriação em hot-reloads
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  
  // Inicializar serviços
  db = getFirestore(app);
  auth = getAuth(app);
  
} catch (error) {
  console.error("Erro crítico ao inicializar Firebase:", error);
}

const features = [
  {
    icon: <BrainIcon className="w-8 h-8 text-[#3a6b5d]" />,
    title: 'Clareza Mental',
    description: 'Reduza o ruído mental e encontre o foco.',
  },
  {
    icon: <StrengthIcon className="w-8 h-8 text-[#3a6b5d]" />,
    title: 'Força Interior',
    description: 'Construa resiliência para lidar com desafios.',
  },
  {
    icon: <MeditationIcon className="w-8 h-8 text-[#3a6b5d]" />,
    title: 'Presença Plena',
    description: 'Viva o momento presente com mais intensidade.',
  },
  {
    icon: <LotusIcon className="w-8 h-8 text-[#3a6b5d]" />,
    title: 'Equilíbrio Emocional',
    description: 'Aprenda a regular suas emoções de forma saudável.',
  },
];

export default function App() {
  // State para controlar a visualização: 'landing' ou 'success'
  const [currentView, setCurrentView] = useState<'landing' | 'success'>('landing');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Autenticação Anônima e Verificação de Pagamento
  useEffect(() => {
    const init = async () => {
      // Se o Firebase não inicializou, aborta
      if (!auth || !db) {
        console.error("Firebase não está pronto (auth ou db nulos). Verifique o console.");
        return;
      }

      // Tenta autenticação anônima
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
           console.log("Autenticado anonimamente no Firebase");
        }
      } catch (error: any) {
        console.warn("Aviso: Autenticação anônima falhou.", error.message);
      }

      const params = new URLSearchParams(window.location.search);
      
      if (params.get('status') === 'success') {
        setCurrentView('success');
        
        const storedEmail = localStorage.getItem('pendingRegistrationEmail');

        if (storedEmail) {
          try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", storedEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
              querySnapshot.forEach(async (docSnap: any) => {
                await updateDoc(docSnap.ref, {
                  status: "pago",
                  pagamentoConfirmadoEm: serverTimestamp()
                });
                console.log(`Usuário ${docSnap.id} marcado como pago.`);
              });
              localStorage.removeItem('pendingRegistrationEmail');
            }
          } catch (error) {
            console.error("Erro ao atualizar pagamento no Firebase:", error);
          }
        }
      }
    };

    init();
  }, []);

  const validate = () => {
    let tempErrors = { name: '', phone: '', email: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      tempErrors.name = 'O nome é obrigatório.';
      isValid = false;
    }

    if (!formData.email.trim()) {
      tempErrors.email = 'O email é obrigatório.';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Formato de email inválido.';
      isValid = false;
    }

    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.phone.trim()) {
      tempErrors.phone = 'O celular é obrigatório.';
      isValid = false;
    } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      tempErrors.phone = 'O celular deve ter 10 ou 11 dígitos, incluindo o DDD.';
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      setStatusMessage('Cadastrando...');

      try {
        if (!db) throw new Error("Firebase não configurado corretamente (db nulo).");

        // Garantir login antes de escrever
        if (auth && !auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (authError: any) {
            console.warn("Login anônimo falhou no submit, tentando salvar mesmo assim...");
          }
        }

        // 1. Salvar no Firebase
        try {
          await addDoc(collection(db, "users"), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            status: "aguardando_pagamento", 
            createdAt: serverTimestamp(),
            origin: "landing_page_7dias"
          });
        } catch (writeError: any) {
          // Se for erro de permissão, repassa para o catch externo
          throw writeError;
        }

        // 2. Salvar email no LocalStorage
        localStorage.setItem('pendingRegistrationEmail', formData.email);

        setStatusMessage('Redirecionando para pagamento...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. Redirecionar para o Hotmart
        const hotmartUrl = `https://pay.hotmart.com/F102989418Q?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}`;
        window.location.href = hotmartUrl;

      } catch (error: any) {
        console.error("Erro ao salvar dados:", error);
        
        let userMessage = "Ocorreu um erro ao processar seu cadastro.";
        
        // Tratamento específico de erros comuns
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
           alert(`⚠️ ERRO DE PERMISSÃO:\n\nO Firebase bloqueou a gravação. Verifique se 'Anonymous Auth' está habilitado e se as Regras do Firestore permitem escrita.`);
        } else if (error.code === 'auth/admin-restricted-operation' || error.code === 'auth/operation-not-allowed') {
           alert(`⚠️ CONFIGURAÇÃO NECESSÁRIA:\n\nA Autenticação Anônima não está habilitada no Firebase.\n\n1. Acesse o Console do Firebase.\n2. Vá em Authentication > Sign-in method.\n3. Ative o provedor 'Anonymous' (Anônimo).`);
        } else {
           alert(`${userMessage}\n\nDetalhes: ${error.message || error.toString()}`);
        }
        
        setIsLoading(false);
        setStatusMessage('');
      }
    }
  };

  // --- TELA DE OBRIGADO (Pós-Venda) ---
  if (currentView === 'success') {
    return (
      <div
        style={{
          backgroundImage: "url('https://i.ibb.co/dJ0yRQq7/Untitled-design.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
        className="min-h-screen w-full text-slate-800 font-sans flex items-center justify-center p-4"
      >
        <div className="bg-white/60 backdrop-blur-md p-8 md:p-12 rounded-3xl shadow-2xl max-w-2xl w-full text-center border border-white/50 animate-fade-in">
          <div className="mx-auto bg-[#7ca982] w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-slate-800 mb-4">
            Parabéns!
          </h1>
          
          <div className="bg-green-100 border-l-4 border-[#3a6b5d] text-[#2c5247] p-4 mb-6 text-left rounded">
             <p className="font-bold">Compra efetuada com sucesso.</p>
             <p className="text-sm">Seu cadastro já foi atualizado em nosso sistema.</p>
          </div>

          <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed">
            Você acaba de dar o primeiro passo para transformar sua vida com o <span className="font-bold text-[#3a6b5d]">Desafio dos 7 Dias</span>.
          </p>

          <div className="bg-white/70 rounded-2xl p-8 mb-8 text-left shadow-inner">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-3 text-slate-800">
              <span className="bg-[#3a6b5d] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
              O que acontece agora?
            </h3>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Verifique seu E-mail:</strong> Enviamos os dados de acesso ao aplicativo para o endereço cadastrado.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Baixe o App:</strong> Se ainda não tem, instale o aplicativo do desafio na sua loja de apps.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Comece Hoje:</strong> Sua primeira técnica respiratória já está liberada!</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.href = '/'} 
            className="w-full sm:w-auto px-10 py-4 bg-[#3a6b5d] text-white font-bold text-lg rounded-full shadow-lg hover:bg-[#2c5247] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            VOLTAR AO INÍCIO
          </button>
        </div>
      </div>
    );
  }

  // --- TELA DA LANDING PAGE ---
  return (
    <div
      style={{
        backgroundImage: "url('https://i.ibb.co/dJ0yRQq7/Untitled-design.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
      className="min-h-screen w-full text-slate-800 font-sans"
    >
      <main className="container mx-auto px-4 pt-8 md:pt-16 pb-0 grid md:grid-cols-2 gap-8 items-center">
        {/* Content Column */}
        <div className="bg-white/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg">
          <p className="font-semibold text-slate-600 mb-2">Desafio dos 7 Dias com <span className="font-bold">Thiago De Pizzol</span></p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Transforme Estresse e Ansiedade em <span className="text-[#3a6b5d]">Força e Presença</span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            7 Técnicas respiratórias para equilíbrio do sistema nervoso.
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Nome Completo"
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-5 py-3 rounded-lg bg-white shadow-sm border focus:outline-none focus:ring-2 transition-all ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#7ca982]'}`}
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <input
                type="tel"
                name="phone"
                placeholder="Celular (com DDD)"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-5 py-3 rounded-lg bg-white shadow-sm border focus:outline-none focus:ring-2 transition-all ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#7ca982]'}`}
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Seu melhor e-mail"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                className={`w-full px-5 py-3 rounded-lg bg-white shadow-sm border focus:outline-none focus:ring-2 transition-all ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#7ca982]'}`}
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
            </div>

            <div className="pt-4 text-center">
              <p className="text-4xl font-bold text-slate-700">3 x R$9,90</p>
              <p className="text-sm text-slate-500 mt-1">Acesso imediato às 7 técnicas respiratórias</p>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`block w-full text-center mt-4 bg-[#7ca982] text-white font-bold py-4 rounded-lg shadow-lg transition-all duration-300 transform ${isLoading ? 'opacity-80 cursor-not-allowed' : 'hover:bg-[#6a9370] hover:scale-105'}`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {statusMessage || 'PROCESSANDO...'}
                </span>
              ) : (
                'ADQUIRIR AGORA'
              )}
            </button>
          </div>
        </div>

        {/* Image Column */}
        <div className="hidden md:flex justify-center items-center">
          <img
            src="https://i.ibb.co/848jsfj6/Untitled-design-3-1.png"
            alt="Homem sorrindo"
            className="max-w-md lg:max-w-lg drop-shadow-2xl animate-fade-in-up"
          />
        </div>
      </main>

      <section className="py-12 bg-white/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-700">O que você vai conquistar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4 hover:bg-white/40 rounded-xl transition-colors duration-300">
                <div className="flex justify-center mb-4 transform hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-xl mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
