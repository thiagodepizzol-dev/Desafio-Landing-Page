import React, { useState, useEffect } from 'react';
import { BrainIcon, StrengthIcon, MeditationIcon, LotusIcon } from './components/Icons';

// --- CONFIGURAÇÃO DO FIREBASE (MODULAR SDK V9+) ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

// CONFIGURAÇÃO ATUALIZADA - PROJETO: landing-page-21-dias
const firebaseConfig = {
  apiKey: "AIzaSyCg3_sT2kBasVSfP_hgFJEOGrx3Yo-HzA0",
  authDomain: "landing-page-21-dias.firebaseapp.com",
  projectId: "landing-page-21-dias",
  storageBucket: "landing-page-21-dias.firebasestorage.app",
  messagingSenderId: "778155461530",
  appId: "1:778155461530:web:fddca2f3cfdd7dc5680823",
  measurementId: "G-CHX9DN432N"
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
  console.log("Firebase inicializado para o projeto:", firebaseConfig.projectId);
  
} catch (error) {
  console.warn("Aviso na inicialização do Firebase:", error);
}

const features = [
  {
    icon: <img src="https://i.ibb.co/nhLZZxv/Iniciar-Desafio-Agora.png" alt="Clareza Mental" className="w-auto h-9 object-contain" />,
    title: 'Clareza Mental',
    description: 'Reduza o ruído mental e encontre o foco.',
  },
  {
    icon: <img src="https://i.ibb.co/scgBYLk/Iniciar-Desafio-Agora-2.png" alt="Clareza Mental" className="w-auto h-9 object-contain" />,
    title: 'Força Interior',
    description: 'Construa resiliência para lidar com desafios.',
  },
  {
    icon: <img src="https://i.ibb.co/v4GXYJtk/Iniciar-Desafio-Agora-1.png" alt="Clareza Mental" className="w-auto h-9 object-contain" />,
    title: 'Presença Plena',
    description: 'Viva o momento presente com mais intensidade.',
  },
  {
    icon: <img src="https://i.ibb.co/Lz2MT9tF/Iniciar-Desafio-Agora-3.png" alt="Clareza Mental" className="w-auto h-8 object-contain" />,
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

  // Autenticação Anônima e Lógica de Retorno do Pagamento
  useEffect(() => {
    const init = async () => {
      // Se o Firebase não inicializou, aborta silenciosamente
      if (!auth || !db) return;

      // 1. Tenta autenticação anônima se não estiver logado
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
           console.log("Usuário autenticado anonimamente.");
        }
      } catch (error: any) {
        console.warn("Autenticação anônima falhou:", error.code);
      }

      // 2. Verifica se voltou da Hotmart com sucesso
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('status') === 'success';

      if (isSuccess) {
        setCurrentView('success');
        
        // Recupera o ID do usuário salvo antes de ir para a Hotmart
        const pendingUserId = localStorage.getItem('pending_user_id');
        
        if (pendingUserId) {
          try {
            console.log("Atualizando status de pagamento para o usuário:", pendingUserId);
            const userRef = doc(db, "users", pendingUserId);
            
            // Atualiza o documento no Firestore
            await updateDoc(userRef, {
              paymentStatus: "pago",
              updatedAt: serverTimestamp()
            });
            
            console.log("Status atualizado para 'pago'!");
            // Limpa o ID para não tentar atualizar de novo desnecessariamente
            localStorage.removeItem('pending_user_id');
          } catch (error) {
            console.error("Erro ao atualizar status de pagamento:", error);
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
        if (db) {
          console.log("Salvando pré-cadastro no Firestore...");
          
          // Salva os dados com status pendente
          const docRef = await addDoc(collection(db, "users"), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            status: "cadastro_inicial", 
            paymentStatus: "pendente", // Variável indicando que ainda não pagou
            createdAt: serverTimestamp(),
            origin: "landing_page_7dias",
            uid: auth?.currentUser?.uid || 'anonymous_guest'
          });
          
          console.log("ID gerado:", docRef.id);
          
          // Salva o ID no navegador para recuperar na volta
          localStorage.setItem('pending_user_id', docRef.id);
        }
      } catch (error: any) {
        console.warn("Erro ao salvar (continuando fluxo):", error.message);
      } finally {
        setStatusMessage('Redirecionando para Pagamento...');
        
        // Constrói URL do Hotmart com parâmetros
        const hotmartBaseUrl = "https://pay.hotmart.com/F102989418Q";
        const params = new URLSearchParams({
          off: 'mzsvtlfu',
          name: formData.name,
          email: formData.email
          // Nota: O Hotmart preencherá automaticamente se os nomes dos campos forem compatíveis
        });

        // Delay para o usuário ler a mensagem
        setTimeout(() => {
          window.location.href = `${hotmartBaseUrl}?${params.toString()}`;
        }, 1000);
      }
    }
  };

  // --- TELA DE OBRIGADO (Pós-Pagamento) ---
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
            Pagamento Confirmado!
          </h1>
          
          <div className="bg-green-100 border-l-4 border-[#3a6b5d] text-[#2c5247] p-4 mb-6 text-left rounded">
             <p className="font-bold">Bem-vindo ao Desafio!</p>
             <p className="text-sm">Seu pagamento foi identificado e seu acesso será liberado em instantes.</p>
          </div>

          <p className="text-lg md:text-xl text-slate-700 mb-8 leading-relaxed">
            Parabéns por dar o primeiro passo no <span className="font-bold text-[#3a6b5d]">Desafio dos 7 Dias</span>.
          </p>

          <div className="bg-white/70 rounded-2xl p-8 mb-8 text-left shadow-inner">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-3 text-slate-800">
              <span className="bg-[#3a6b5d] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
              Próximos Passos
            </h3>
            <ul className="space-y-4 text-slate-700">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Verifique seu E-mail:</strong> O link de acesso à plataforma foi enviado para o endereço cadastrado.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Whatsapp:</strong> Caso não encontre o e-mail, verifique sua caixa de spam ou entre em contato.</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.href = window.location.origin} // Volta para a home limpa
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
          
          {/* Imagem visível apenas no mobile (md:hidden) */}
          <div className="md:hidden flex justify-center mb-6">
            <img 
              src="https://i.ibb.co/848jsfj6/Untitled-design-3-1.png" 
              alt="Thiago De Pizzol" 
              className="max-w-[200px] drop-shadow-xl animate-fade-in-up" 
            />
          </div>

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
              className={`block w-full mt-4 bg-transparent p-0 border-none shadow-none hover:scale-105 transition-transform duration-300 ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-full bg-[#7ca982] text-white font-bold py-4 rounded-lg shadow-lg flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {statusMessage || 'PROCESSANDO...'}
                </div>
              ) : (
                <div className="w-full bg-[#3a6b5d] text-white font-bold py-4 rounded-lg shadow-lg uppercase tracking-wider flex items-center justify-center">
                  INICIAR DESAFIO AGORA
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Image Column (Apenas Desktop) */}
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