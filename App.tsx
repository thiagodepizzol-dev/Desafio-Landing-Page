import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO DO FIREBASE (MODULAR SDK V9+) ---
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  updateDoc, 
  getDoc, // Importado para ler a senha salva
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously,
  createUserWithEmailAndPassword, // Importado para criar o usuário no segundo app
  Auth
} from "firebase/auth";

// 1. CONFIGURAÇÃO - PROJETO ATUAL (LANDING PAGE)
const firebaseConfig = {
  apiKey: "AIzaSyCg3_sT2kBasVSfP_hgFJEOGrx3Yo-HzA0",
  authDomain: "landing-page-21-dias.firebaseapp.com",
  projectId: "landing-page-21-dias",
  storageBucket: "landing-page-21-dias.firebasestorage.app",
  messagingSenderId: "778155461530",
  appId: "1:778155461530:web:fddca2f3cfdd7dc5680823",
  measurementId: "G-CHX9DN432N"
};

// 2. CONFIGURAÇÃO - PROJETO DE DESTINO (ONDE O USUÁRIO VAI LOGAR)
const targetAppConfig = {
  apiKey: "AIzaSyBcuvdJ7rGvw9OPcogja9BdTnda7ihJZmk",
  authDomain: "dias-3b6d2.firebaseapp.com",
  projectId: "dias-3b6d2",
  storageBucket: "dias-3b6d2.firebasestorage.app",
  messagingSenderId: "761341789041",
  appId: "1:761341789041:web:46798555abde44faedacd0",
  measurementId: "G-9Y1K16JC7M"
};

// Inicialização segura do Firebase Principal (Landing Page)
let app: FirebaseApp;
let db: any;
let auth: any;

try {
  // Padrão Singleton para o app DEFAULT
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp(); // Pega o app default
  }
  
  db = getFirestore(app);
  auth = getAuth(app);
  
} catch (error) {
  console.warn("Aviso na inicialização do Firebase Principal:", error);
}

// Função para inicializar o App Secundário (Target)
const getTargetAuth = (): Auth | null => {
  try {
    let targetApp: FirebaseApp;
    // Verifica se já existe um app com o nome "TargetApp" para não duplicar
    const existingApps = getApps();
    const foundApp = existingApps.find(a => a.name === "TargetApp");

    if (!foundApp) {
      targetApp = initializeApp(targetAppConfig, "TargetApp"); // Nomeia a instância secundária
    } else {
      targetApp = foundApp;
    }
    
    return getAuth(targetApp);
  } catch (error) {
    console.error("Erro ao inicializar Firebase Secundário:", error);
    return null;
  }
};

const features = [
  {
    icon: <img src="https://i.ibb.co/nhLZZxv/Iniciar-Desafio-Agora.png" alt="Clareza Mental" className="w-auto h-9 object-contain" />,
    title: 'Clareza Mental',
    description: 'Reduza o ruído mental e encontre o foco.',
  },
  {
    icon: <img src="https://i.ibb.co/scgBYLk/Iniciar-Desafio-Agora-2.png" alt="Força Interior" className="w-auto h-9 object-contain" />,
    title: 'Força Interior',
    description: 'Construa resiliência para lidar com desafios.',
  },
  {
    icon: <img src="https://i.ibb.co/v4GXYJtk/Iniciar-Desafio-Agora-1.png" alt="Presença Plena" className="w-auto h-9 object-contain" />,
    title: 'Presença Plena',
    description: 'Viva o momento presente com mais intensidade.',
  },
  {
    icon: <img src="https://i.ibb.co/Lz2MT9tF/Iniciar-Desafio-Agora-3.png" alt="Equilíbrio Emocional" className="w-auto h-8 object-contain" />,
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
      // Se o Firebase principal não inicializou, aborta silenciosamente
      if (!auth || !db) return;

      // 1. Tenta autenticação anônima se não estiver logado (para poder ler/escrever no Firestore da LP)
      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
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
            const userRef = doc(db, "users", pendingUserId);
            
            // A. Busca os dados do usuário para pegar a SENHA gerada
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
              const userData = userSnap.data();
              const { email, password } = userData;

              // B. Atualiza o status na Landing Page
              await updateDoc(userRef, {
                paymentStatus: "pago",
                updatedAt: serverTimestamp()
              });
              
              console.log("Status de pagamento atualizado na LP.");

              // C. Cria o usuário no Firebase de Destino (App Principal)
              if (email && password) {
                const targetAuth = getTargetAuth();
                if (targetAuth) {
                  try {
                    console.log("Tentando criar usuário no App de Destino...");
                    await createUserWithEmailAndPassword(targetAuth, email, password);
                    console.log("SUCESSO: Usuário criado no App de Destino!");
                    
                    // Opcional: Atualizar na LP que a conta foi criada
                    await updateDoc(userRef, { accountCreatedInTarget: true });

                  } catch (createError: any) {
                    // Ignora erro se o usuário já existir (auth/email-already-in-use)
                    if (createError.code === 'auth/email-already-in-use') {
                      console.log("Usuário já existe no App de Destino.");
                      await updateDoc(userRef, { accountCreatedInTarget: true, accountExists: true });
                    } else {
                      console.error("Erro ao criar usuário no App de Destino:", createError);
                    }
                  }
                }
              }
            }
            
            // Limpa o ID para não tentar rodar o script novamente
            localStorage.removeItem('pending_user_id');
            
          } catch (error) {
            console.error("Erro no processo de pós-pagamento:", error);
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

  // Função auxiliar para gerar senha aleatória
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      setStatusMessage('Cadastrando...');

      try {
        if (db) {
          // Gera uma senha aleatória para o novo usuário
          const generatedPassword = generateRandomPassword();

          // Salva os dados com status pendente e a senha gerada
          const docRef = await addDoc(collection(db, "users"), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: generatedPassword, // Nova senha salva aqui
            status: "cadastro_inicial", 
            paymentStatus: "pendente", // Variável indicando que ainda não pagou
            createdAt: serverTimestamp(),
            origin: "landing_page_7dias",
            uid: auth?.currentUser?.uid || 'anonymous_guest'
          });
          
          console.log("Usuário criado com ID:", docRef.id);
          
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
             <p className="text-sm">Seu pagamento foi identificado e sua conta foi criada.</p>
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
      className="min-h-screen w-full text-slate-800 font-sans flex flex-col"
    >
      <main className="container mx-auto px-4 pt-8 md:pt-16 pb-0 grid md:grid-cols-2 gap-8 items-center flex-grow">
        {/* Content Column */}
        <div className="bg-white/30 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-lg">
          
          {/* Imagem visível apenas no mobile (md:hidden) */}
          <div className="md:hidden flex justify-center mb-6">
            <img 
              src="https://i.ibb.co/tTQmdyYK/Untitled-design-3-1.png" 
              alt="Thiago De Pizzol" 
              className="max-w-[200px] drop-shadow-xl animate-fade-in-up" 
            />
          </div>

          <p className="font-semibold text-slate-600 mb-2">Desafio dos 7 Dias com <span className="font-bold">Thiago De Pizzol</span></p>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight">
            Transforme Estresse e Ansiedade em <span className="text-[#3a6b5d]">Força e Presença com <span className="text-red-500/90">apenas 10 minutos por dia.</span></span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            7 Técnicas respiratórias para equilíbriar sua mente e emoções.
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

      {/* --- NOVA SEÇÃO DE DORES (ANSIEDADE/ESTRESSE) --- */}
      <section className="py-12 md:py-16 mt-8 md:mt-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-slate-700 leading-snug">
            Você sente que está <br className="md:hidden" /> <span className="text-red-500/80">perdendo o controle?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            
            {/* Dor 1: Mente Acelerada */}
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-l-4 border-red-400/70 hover:shadow-md transition-all hover:-translate-y-1">
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🤯</span> Mente Agitada
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Você deita para dormir, mas os pensamentos não param. O dia todo é uma corrida contra o tempo dentro da sua própria cabeça.
              </p>
            </div>

            {/* Dor 2: Sintomas Físicos */}
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-l-4 border-red-400/70 hover:shadow-md transition-all hover:-translate-y-1">
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🫀</span> Aperto no Peito
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Aquela sensação física de angústia repentina, coração acelerado ou falta de ar, mesmo sem estar fazendo esforço físico.
              </p>
            </div>

            {/* Dor 3: Irritabilidade/Medo */}
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-2xl shadow-sm border-l-4 border-red-400/70 hover:shadow-md transition-all hover:-translate-y-1">
              <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚡</span> Estresse Constante
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Pequenas coisas tiram você do sério. A sensação de sobrecarga faz você travar ou reagir de forma explosiva com quem ama.
              </p>
            </div>

          </div>
        </div>
      </section>

      <section className="py-12 bg-white/30 backdrop-blur-sm">
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

      {/* --- SEÇÃO DEPOIMENTO (LIMPA E CORRIGIDA) --- */}
      <section className="py-12 md:py-16 bg-white/20 backdrop-blur-sm mt-8 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-700 mb-8">
            Ela passou pelo treinamento!
          </h2>
          <div className="flex justify-center">
             <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 bg-black">
                <iframe 
                  width="361" 
                  height="642" 
                  src="https://www.youtube.com/embed/K_gcymad1Sc" 
                  title="Depoimento de Aluna" 
                  allow="autoplay; fullscreen"
                  allowFullScreen
                  loading="lazy"
                  className="max-w-full h-auto aspect-[9/16] w-[320px] md:w-[361px]"
                ></iframe>
             </div>
          </div>
        </div>
      </section>

      {/* Rodapé Simples */}
      <footer className="bg-[#3a6b5d] text-white py-8 text-center mt-auto">
        <div className="container mx-auto px-4">
          <p className="font-semibold">&copy; {new Date().getFullYear()} Desafio 7 Dias. Todos os direitos reservados.</p>
          <p className="text-sm opacity-80 mt-2">Thiago De Pizzol - Transformação e Autoconhecimento.</p>
        </div>
      </footer>

      {/* --- BOTÃO FLUTUANTE DO WHATSAPP --- */}
      <a
        href="https://wa.me/5517981463355?text=Desafio"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 flex items-center justify-center animate-bounce-slow"
        aria-label="Fale conosco no WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          fill="currentColor"
          className="text-white"
          viewBox="0 0 16 16"
        >
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
      </a>
    </div>
  );
}