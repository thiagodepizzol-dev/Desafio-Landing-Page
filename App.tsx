import React, { useState, useEffect } from 'react';

// --- CONFIGURAÇÃO DO FIREBASE (MODULAR SDK V9+) ---
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc,
  doc,
  updateDoc, 
  getDoc,
  query,
  where,
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInAnonymously,
  createUserWithEmailAndPassword, 
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
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp(); 
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
    const existingApps = getApps();
    const foundApp = existingApps.find(a => a.name === "TargetApp");

    if (!foundApp) {
      targetApp = initializeApp(targetAppConfig, "TargetApp");
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
    icon: <img src="https://i.ibb.co/nhLZZxv/Iniciar-Desafio-Agora.png" alt="Ícone Clareza Mental - Desafio 7 Dias" className="w-auto h-9 object-contain" />,
    title: 'Clareza Mental',
    description: 'Reduza o ruído mental e encontre o foco.',
  },
  {
    icon: <img src="https://i.ibb.co/scgBYLk/Iniciar-Desafio-Agora-2.png" alt="Ícone Força Interior - Desafio 7 Dias" className="w-auto h-9 object-contain" />,
    title: 'Força Interior',
    description: 'Construa resiliência para lidar com desafios.',
  },
  {
    icon: <img src="https://i.ibb.co/v4GXYJtk/Iniciar-Desafio-Agora-1.png" alt="Ícone Presença Plena - Desafio 7 Dias" className="w-auto h-9 object-contain" />,
    title: 'Presença Plena',
    description: 'Viva o momento presente com mais intensidade.',
  },
  {
    icon: <img src="https://i.ibb.co/Lz2MT9tF/Iniciar-Desafio-Agora-3.png" alt="Ícone Equilíbrio Emocional - Desafio 7 Dias" className="w-auto h-8 object-contain" />,
    title: 'Equilíbrio Emocional',
    description: 'Aprenda a regular suas emoções de forma saudável.',
  },
];

const textTestimonials = [
  {
    text: "Eu vivia com falta de ar por ansiedade. Em 2 semanas de Protocolo, senti meu peito abrir. Durmo a noite toda agora.",
    author: "Juliana K.",
    initials: "JK"
  },
  {
    text: "Simples e direto. 10 minutos que mudam o meu dia. O Thiago explica de um jeito que a gente entende o porquê faz.",
    author: "Roberto M.",
    initials: "RM"
  },
  {
    text: "Minha digestão melhorou, minha pele melhorou. É impressionante como a respiração afeta tudo.",
    author: "Carla D.",
    initials: "CD"
  }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'success'>('landing');
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({ name: '', phone: '', email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // States para a tela de sucesso
  const [accessCredentials, setAccessCredentials] = useState<{email: string, password: string, phone: string} | null>(null);
  const [fetchingCredentials, setFetchingCredentials] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const init = async () => {
      if (!auth || !db) return;

      try {
        if (!auth.currentUser) {
           await signInAnonymously(auth);
        }
      } catch (error: any) {
        console.warn("Autenticação anônima falhou:", error.code);
      }

      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('status') === 'success';

      if (isSuccess) {
        setCurrentView('success');
        setFetchingCredentials(true);
        setFetchError('');
        
        const urlUserId = params.get('uid');
        const pendingUserId = urlUserId || localStorage.getItem('pending_user_id');
        
        if (pendingUserId) {
          try {
            console.log("Buscando usuário:", pendingUserId);
            
            // 1. Tenta buscar pelo ID do documento (padrão)
            let userSnap = await getDoc(doc(db, "users", pendingUserId));
            let userData = userSnap.exists() ? userSnap.data() : null;
            let docRef = userSnap.exists() ? userSnap.ref : null;

            // 2. Se não achou e o ID parece ser um UID de Auth (longo), tenta buscar pelo campo 'uid'
            if (!userData && pendingUserId.length > 20) {
               console.log("Documento não encontrado pelo ID direto. Tentando buscar pelo campo 'uid'...");
               const q = query(collection(db, "users"), where("uid", "==", pendingUserId));
               const querySnapshot = await getDocs(q);
               if (!querySnapshot.empty) {
                 userSnap = querySnapshot.docs[0];
                 userData = userSnap.data();
                 docRef = userSnap.ref;
                 console.log("Usuário encontrado via query uid!");
               }
            }
            
            if (userData && docRef) {
              const { email, password, phone } = userData;
              // Se não tiver senha salva (usuário antigo), define uma mensagem
              const displayPassword = password || "Senha enviada por e-mail";
              
              setAccessCredentials({ email, password: displayPassword, phone });

              // Atualiza o status na Landing Page
              await updateDoc(docRef, {
                paymentStatus: "pago",
                updatedAt: serverTimestamp()
              });
              
              // Cria o usuário no App Principal se tiver senha válida
              if (email && password) {
                const targetAuth = getTargetAuth();
                if (targetAuth) {
                  try {
                    await createUserWithEmailAndPassword(targetAuth, email, password);
                    await updateDoc(docRef, { accountCreatedInTarget: true });
                  } catch (createError: any) {
                    if (createError.code === 'auth/email-already-in-use') {
                      await updateDoc(docRef, { accountCreatedInTarget: true, accountExists: true });
                    }
                  }
                }
              }
            } else {
              setFetchError("Usuário não encontrado no banco de dados.");
            }
            
            if (!urlUserId) {
               localStorage.removeItem('pending_user_id');
            }
            
          } catch (error: any) {
            console.error("Erro no processo de pós-pagamento:", error);
            setFetchError("Erro ao recuperar dados: " + error.message);
          } finally {
            setFetchingCredentials(false);
          }
        } else {
          setFetchingCredentials(false);
          setFetchError("ID do usuário não identificado.");
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
          const generatedPassword = generateRandomPassword();
          const docRef = await addDoc(collection(db, "users"), {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: generatedPassword, 
            status: "cadastro_inicial", 
            paymentStatus: "pendente", 
            createdAt: serverTimestamp(),
            origin: "landing_page_7dias",
            uid: auth?.currentUser?.uid || 'anonymous_guest'
          });
          
          localStorage.setItem('pending_user_id', docRef.id);
        }
      } catch (error: any) {
        console.warn("Erro ao salvar (continuando fluxo):", error.message);
      } finally {
        setStatusMessage('Redirecionando para Pagamento...');
        const hotmartBaseUrl = "https://pay.hotmart.com/F102989418Q";
        const params = new URLSearchParams({
          off: 'lkux89fa',
          name: formData.name,
          email: formData.email
        });

        setTimeout(() => {
          window.location.href = `${hotmartBaseUrl}?${params.toString()}`;
        }, 1000);
      }
    }
  };

  const getWhatsAppLink = () => {
    if (!accessCredentials) return "#";
    const { email, password, phone } = accessCredentials;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const formattedPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;

    const message = `Boas vindas ao Desafio de 7 dias com Thiago De Pizzol! Estou enviando essa mensagem para liberar os dados para seu acesso ao Desafio!

Login: ${email}
Senha: ${password}

Clique no link abaixo e coloque as credenciais acima para iniciar o desafio:

https://thiagodepizzol.com.br/app/`;

    return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
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
        <div className="bg-white/90 backdrop-blur-md p-6 md:p-12 rounded-3xl shadow-2xl max-w-3xl w-full text-center border border-white/50 animate-fade-in my-8">
          <div className="mx-auto bg-[#7ca982] w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-10 h-10 md:w-12 md:h-12 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-bold text-slate-800 mb-2">
            Pagamento Confirmado!
          </h1>
          <p className="text-slate-600 mb-8">Seu acesso foi liberado com sucesso.</p>
          
          {/* Estados de Carregamento e Erro */}
          {fetchingCredentials && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3a6b5d] mx-auto mb-4"></div>
              <p className="text-slate-500">Recuperando suas credenciais...</p>
            </div>
          )}

          {fetchError && !fetchingCredentials && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8 border border-red-200">
              <p className="font-bold">Atenção</p>
              <p>{fetchError}</p>
              <p className="text-sm mt-2">Por favor, entre em contato com o suporte no WhatsApp.</p>
            </div>
          )}

          {/* Exibição das Credenciais */}
          {accessCredentials && (
            <div className="bg-white border-2 border-[#3a6b5d]/30 rounded-2xl p-6 md:p-8 mb-8 shadow-lg relative overflow-hidden animate-fade-in-up">
               <div className="absolute top-0 left-0 w-full h-2 bg-[#3a6b5d]"></div>
               
               <h3 className="font-bold text-xl text-[#3a6b5d] mb-4 uppercase tracking-wide">
                 Seus Dados de Acesso
               </h3>
               
               <div className="flex flex-col gap-4 text-left max-w-md mx-auto">
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                   <p className="text-xs text-slate-500 uppercase font-bold mb-1">Login (E-mail)</p>
                   <p className="font-mono text-lg text-slate-800 break-all">{accessCredentials.email}</p>
                 </div>
                 
                 <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                   <p className="text-xs text-slate-500 uppercase font-bold mb-1">Senha</p>
                   <p className="font-mono text-xl text-[#3a6b5d] font-bold tracking-wider">{accessCredentials.password}</p>
                 </div>
               </div>

               <div className="mt-6">
                 <a 
                   href={getWhatsAppLink()}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#20bd5a] transition-colors shadow-md w-full md:w-auto justify-center"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                     <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                   </svg>
                   Salvar dados no meu WhatsApp
                 </a>
                 <p className="text-xs text-slate-500 mt-2">Clique para abrir uma conversa com você mesmo e salvar a senha.</p>
               </div>
            </div>
          )}

          <div className="bg-white/70 rounded-2xl p-6 md:p-8 mb-8 text-left shadow-inner">
            <h3 className="font-bold text-xl mb-4 flex items-center gap-3 text-slate-800">
              <span className="bg-[#3a6b5d] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">!</span>
              Como Acessar
            </h3>
            <ul className="space-y-4 text-slate-700 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Passo 1:</strong> Copie sua senha acima.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Passo 2:</strong> Clique no botão abaixo para ir ao Portal do Aluno.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1.5 w-2 h-2 bg-[#3a6b5d] rounded-full flex-shrink-0"></div>
                <span><strong>Passo 3:</strong> Use seu e-mail e a senha gerada para entrar.</span>
              </li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-3">
            <a 
              href="https://thiagodepizzol.com.br/app/"
              className="w-full sm:w-auto px-10 py-4 bg-[#3a6b5d] text-white font-bold text-lg rounded-full shadow-lg hover:bg-[#2c5247] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 block mx-auto"
            >
              ACESSAR PORTAL AGORA
            </a>
            
            <button 
              onClick={() => window.location.href = window.location.origin} 
              className="text-slate-500 hover:text-slate-700 text-sm font-semibold mt-2"
            >
              Voltar ao Início
            </button>
          </div>
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
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-4">
            Reduza ansiedade e aperto no peito<span className="text-[#3a6b5d]"> com 7 técnicas respiratórias <span className="text-red-500/90">em apenas 10 minutos por dia.</span></span>
          </h1>
          
          <div className="my-4 bg-red-500/90 p-4 rounded-lg shadow-md">
            <p className="text-white font-bold text-sm md:text-base leading-snug">
              "Respiração é o único método capaz de desligar a resposta de luta ou fuga em menos de 3 minutos."
            </p>
          </div>

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
              <p className="text-sm text-slate-500 mt-1">Por apenas</p>
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
                  Quero controlar minha ansiedade em 7 dias
                </div>
              )}
            </button>
            
            {/* Garantia */}
            <div className="mt-4 flex items-center justify-center gap-2 text-center opacity-90">
              
              <p className="text-xs md:text-sm text-slate-600">
                <strong>🛡 Garantia total:</strong> Se em 7 dias você não sentir diferença, devolvo seu dinheiro.
              </p>
            </div>
          </div>
        </div>

        {/* Image Column (Apenas Desktop) */}
        <div className="hidden md:flex justify-center items-center relative">
          
          {/* Frase Flutuante (Depoimento) - Atualizado: Sem fundo, texto preto, linha única */}
          <div className="absolute top-0 left-0 z-20">
             <p className="text-black font-bold italic text-lg lg:text-xl whitespace-nowrap leading-tight">
               "Eu só quero parar esse aperto no peito AGORA."
             </p>
             <p className="text-xs text-black/80 italic font-normal text-right mt-1">
               mensagem recebida no instagram
             </p>
          </div>

          <img
            src="https://i.ibb.co/848jsfj6/Untitled-design-3-1.png"
            alt="Thiago De Pizzol especialista em respiração"
            className="max-w-md lg:max-w-lg drop-shadow-2xl animate-fade-in-up"
          />
        </div>
      </main>

      {/* --- NOVA SEÇÃO DEPOIMENTOS TEXTUAIS (ABAIXO DO HERO) --- */}
      <section className="py-8 md:py-12 bg-white/20 backdrop-blur-sm border-y border-white/20">
        <div className="container mx-auto px-4">
          
          {/* FRASE FLUTUANTE (MOBILE ONLY) - Antes do slide */}
          <div className="md:hidden text-center mb-6">
             <p className="text-black font-bold italic text-lg leading-tight">
               "Eu só quero parar esse aperto no peito AGORA."
             </p>
             <p className="text-xs text-black/80 italic font-normal mt-1">
               mensagem recebida no instagram
             </p>
          </div>

          {/* Versão DESKTOP (Grid) */}
          <div className="hidden md:grid md:grid-cols-3 gap-6">
            {textTestimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/60 p-6 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col h-full border border-white/40">
                <svg className="w-8 h-8 text-[#3a6b5d]/30 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z"></path></svg>
                <p className="text-slate-700 italic mb-4 flex-grow">"{testimonial.text}"</p>
                <div className="flex items-center gap-2 mt-auto">
                   <div className="w-8 h-8 rounded-full bg-[#3a6b5d]/20 flex items-center justify-center text-[#3a6b5d] font-bold text-xs">{testimonial.initials}</div>
                   <p className="font-bold text-[#3a6b5d] text-sm">- {testimonial.author}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Versão MOBILE (Slide/Carousel Horizontal) */}
          <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 px-2">
            {textTestimonials.map((testimonial, index) => (
              <div key={index} className="min-w-[85vw] snap-center bg-white/60 p-6 rounded-xl shadow-sm flex flex-col h-full border border-white/40">
                <svg className="w-8 h-8 text-[#3a6b5d]/30 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z"></path></svg>
                <p className="text-slate-700 italic mb-4 flex-grow">"{testimonial.text}"</p>
                <div className="flex items-center gap-2 mt-auto">
                   <div className="w-8 h-8 rounded-full bg-[#3a6b5d]/20 flex items-center justify-center text-[#3a6b5d] font-bold text-xs">{testimonial.initials}</div>
                   <p className="font-bold text-[#3a6b5d] text-sm">- {testimonial.author}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

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

      {/* --- NOVA SEÇÃO: O QUE VOCÊ VAI RECEBER --- */}
      <section className="py-12 bg-[#3a6b5d]/5 backdrop-blur-sm border-t border-white/20">
        <div className="container mx-auto px-4 max-w-5xl">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-slate-700 uppercase tracking-wide">
            O que você vai receber
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Item 1 - 7 técnicas */}
            <div className="bg-white/60 p-5 rounded-xl flex items-center gap-4 shadow-sm border border-white/50">
              <div className="bg-[#3a6b5d] text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="font-bold text-xl">7</span>
              </div>
              <p className="font-semibold text-slate-700 text-lg">7 técnicas</p>
            </div>

            {/* Item 2 - Aulas rápidas */}
            <div className="bg-white/60 p-5 rounded-xl flex items-center gap-4 shadow-sm border border-white/50">
               <div className="bg-[#3a6b5d] text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                 </svg>
               </div>
               <p className="font-semibold text-slate-700 text-lg">Aulas rápidas e eficientes de 10 minutos</p>
            </div>

            {/* Item 3 - Acesso vitalício */}
            <div className="bg-white/60 p-5 rounded-xl flex items-center gap-4 shadow-sm border border-white/50">
               <div className="bg-[#3a6b5d] text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                 </svg>
               </div>
               <p className="font-semibold text-slate-700 text-lg">Acesso vitalício as técnicas</p>
            </div>

            {/* Item 4 - Guia PDF */}
            <div className="bg-white/60 p-5 rounded-xl flex items-center gap-4 shadow-sm border border-white/50">
               <div className="bg-[#3a6b5d] text-white w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                 </svg>
               </div>
               <p className="font-semibold text-slate-700 text-lg">Guia PDF</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SEÇÃO: QUEM É THIAGO DE PIZZOL --- */}
      <section className="py-12 md:py-16 bg-white/20 backdrop-blur-sm border-t border-white/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 max-w-6xl mx-auto">
            
            {/* Imagem Desktop: Esquerda / Mobile: Topo */}
            <div className="w-full md:w-1/2 flex justify-center">
               <img
                 src="https://thiagodepizzol.com.br/img/Untitled%20design%20(5).jpg"
                 alt="Thiago De Pizzol professor de yoga"
                 className="rounded-2xl shadow-2xl max-w-full h-auto border-4 border-white/50"
               />
            </div>

            {/* Texto */}
            <div className="w-full md:w-1/2 text-left">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-6 uppercase tracking-wide">
                Quem é Thiago De Pizzol
              </h2>
              <p className="text-slate-700 mb-4 text-lg leading-relaxed">
                Professor de Yoga, especialista em respiração, meditador há 17 anos, criador do Programa Online de Yoga e do método Moksha Experience.
              </p>
              <p className="text-slate-700 mb-6 leading-relaxed">
                Mais de 1500 aulas ministradas, centenas de alunos atendidos e milhares transformados através da respiração consciente.
              </p>

              <p className="font-bold text-[#3a6b5d] mb-3 text-lg">Ensina uma prática baseada em:</p>
              <ul className="space-y-2 mb-8">
                {['neurociência', 'fisiologia respiratória', 'regulação emocional', 'Yoga tradicional', 'atenção plena'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-slate-700">
                    <span className="text-green-600 bg-green-100 rounded-full w-6 h-6 flex items-center justify-center text-xs">✔</span> {item}
                  </li>
                ))}
              </ul>

              <p className="text-slate-800 font-medium italic border-l-4 border-[#3a6b5d] pl-4 py-3 bg-white/40 rounded-r-lg shadow-sm">
                "Você vai aprender com alguém que vive isso todos os dias."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SEÇÃO DE CONQUISTAS (FEATURES) --- */}
      <section className="py-12 bg-white/30 backdrop-blur-sm mt-0 border-t border-white/20">
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

      {/* --- SEÇÃO CUSTO + VALOR --- */}
      <section className="py-12 bg-[#3a6b5d] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Desafio dos 7 Dias – 7 Técnicas Respiratórias</h2>

          <div className="bg-white/10 p-8 rounded-2xl max-w-3xl mx-auto backdrop-blur-sm border border-white/20">
            <p className="text-lg mb-2 opacity-90">Apenas</p>
            <p className="text-5xl md:text-6xl font-bold mb-2">3x R$ 9,90</p>
            <p className="text-xl opacity-80 mb-6">(R$ 29,70 total)</p>

            <div className="flex flex-col md:flex-row justify-center gap-2 md:gap-4 text-sm md:text-base font-medium opacity-90 mb-8">
              <span>Acesso imediato</span>
              <span className="hidden md:inline">|</span>
              <span>Suporte por Whatsapp</span>
              <span className="hidden md:inline">|</span>
              <span>Garantia total de satisfação</span>
            </div>

            <div className="bg-white/20 p-4 rounded-xl inline-block">
              <p className="font-semibold text-lg">
                "Por menos que o preço de um café, você aprende a controlar ansiedade com as próprias mãos."
              </p>
            </div>

            <button
               onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
               className="block w-full md:w-auto mx-auto mt-8 bg-white text-[#3a6b5d] font-bold py-4 px-10 rounded-full shadow-lg hover:bg-green-50 transition-colors uppercase tracking-wider"
            >
              Quero começar agora
            </button>
          </div>
        </div>
      </section>

      {/* --- SEÇÃO DEPOIMENTO (LIMPA E CORRIGIDA) --- */}
      <section className="py-12 md:py-16 bg-white/20 backdrop-blur-sm mt-0 border-t border-white/20">
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