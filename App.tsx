import React, { useState, useEffect } from 'react';
import { BrainIcon, StrengthIcon, MeditationIcon, LotusIcon } from './components/Icons';

// --- CONFIGURAÇÃO DO FIREBASE (MODULAR SDK V9+) ---
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
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
           console.log("Autenticado anonimamente no Firebase (UID):", auth.currentUser?.uid);
        }
      } catch (error: any) {
        if (error.code === 'auth/admin-restricted-operation') {
          console.warn("AVISO: Autenticação Anônima desabilitada no Console. O app tentará salvar dados como visitante.");
        } else {
          console.error("Erro na Autenticação Anônima:", error.message);
        }
      }

      const params = new URLSearchParams(window.location.search);
      if (params.get('status') === 'success') {
        setCurrentView('success');
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
      setStatusMessage('Salvando dados...');

      try {
        // Garantir login antes de escrever (Retry)
        if (auth && !auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (authError: any) {
             // Ignora erro de admin-restricted, pois pode ser que as regras do banco sejam publicas
             if(authError.code !== 'auth/admin-restricted-operation') {
                console.error("Falha ao tentar logar antes de salvar:", authError);
             }
          }
        }

        if (!db) {
          throw new Error("Conexão com Banco de Dados não estabelecida.");
        }

        console.log("Enviando dados para o Firestore:", formData);

        // 1. Salvar no Firebase
        const docRef = await addDoc(collection(db, "users"), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          status: "cadastro_realizado", 
          createdAt: serverTimestamp(),
          origin: "landing_page_7dias",
          uid: auth?.currentUser?.uid || 'anonymous'
        });

        console.log("SUCESSO! Documento gravado com ID: ", docRef.id);

        setStatusMessage('Redirecionando...');
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. Redirecionar para a tela de obrigado
        setCurrentView('success');
        window.scrollTo(0, 0);
        setIsLoading(false);

      } catch (error: any) {
        console.error("ERRO AO SALVAR:", error);
        
        // Alerta amigável para explicar o erro técnico
        let msg = "Erro desconhecido.";
        
        if (error.code === 'permission-denied') {
          // Mensagem ultra específica para ajudar o usuário
          msg = `ERRO DE PERMISSÃO!\n\nPara corrigir, escolha UMA das opções:\n1. Vá no Firebase Console -> Authentication e ATIVE o provedor 'Anonymous'.\nOU\n2. Vá no Firestore Database -> Rules e mude para 'allow read, write: if true;'`;
        } else if (error.code === 'unavailable') {
          msg = "Serviço indisponível. Verifique sua conexão.";
        } else {
          msg = error.message;
        }

        alert(`Não foi possível salvar os dados:\n${msg}`);
        setIsLoading(false);
        setStatusMessage('');
      }
    }
  };

  // --- TELA DE OBRIGADO (Pós-Cadastro) ---
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
            Cadastro Confirmado!
          </h1>
          
          <div className="bg-green-100 border-l-4 border-[#3a6b5d] text-[#2c5247] p-4 mb-6 text-left rounded">
             <p className="font-bold">Seus dados foram salvos com sucesso.</p>
             <p className="text-sm">Você está mais perto de transformar sua rotina.</p>
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
                <span><strong>Verifique seu E-mail:</strong> Enviamos mais informações para o endereço cadastrado.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Aguarde o Contato:</strong> Nossa equipe entrará em contato em breve.</span>
              </li>
            </ul>
          </div>

          <button 
            onClick={() => window.location.reload()} 
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