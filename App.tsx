
import React, { useState } from 'react';
import { BrainIcon, StrengthIcon, MeditationIcon, LotusIcon } from './components/Icons';

// This component is defined outside App to prevent re-creation on every render.
const PhoneMockup: React.FC = () => {
  return (
    <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[250px] w-[125px] sm:h-[400px] sm:w-[200px] md:h-[500px] md:w-[250px] shadow-2xl">
        <div className="h-[20px] w-[3px] bg-gray-800 absolute -start-[13px] top-[50px] rounded-s-lg"></div>
        <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[13px] top-[80px] rounded-s-lg"></div>
        <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[13px] top-[120px] rounded-s-lg"></div>
        <div className="h-[48px] w-[3px] bg-gray-800 absolute -end-[13px] top-[100px] rounded-e-lg"></div>
        <div className="rounded-[2rem] overflow-hidden w-full h-full bg-gradient-to-br from-cyan-100 to-blue-200">
            <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-700">
                <p className="text-xs sm:text-lg font-bold">Desafio 7 Dias</p>
                <div className="w-12 h-12 sm:w-20 sm:h-20 my-2 sm:my-4">
                    <LotusIcon />
                </div>
                <p className="text-[8px] sm:text-xs font-light">Respirar para Transformar</p>
            </div>
        </div>
    </div>
  );
};


export default function App() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, you would handle the form submission here.
    alert(`Obrigado, ${name}! Seu cadastro foi recebido.`);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#d7e9f8] via-[#e8f3f2] to-[#d8eee9] text-slate-800 font-sans overflow-x-hidden">
      <main className="container mx-auto px-6 py-12">
        
        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">

          {/* Left Column: Text & Form */}
          <div className="w-full lg:w-1/2 max-w-lg text-center lg:text-left">
            <p className="font-semibold text-slate-600 mb-2">Desafio 7 Dias</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Transforme Estresse e Ansiedade em <span className="text-[#3a6b5d]">Força e Presença</span>
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              7 Técnicas Respiratórias Para Equilíbrio do Sistema Nervoso
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <input 
                type="text" 
                placeholder="Nome" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-3 rounded-lg bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7ca982]"
                required
              />
              <input 
                type="tel" 
                placeholder="Celular"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-5 py-3 rounded-lg bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7ca982]"
                required
              />
              <input 
                type="email" 
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-lg bg-white shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#7ca982]"
                required
              />

              <div className="pt-4">
                <p className="text-4xl font-bold text-slate-700">3 x R$9,90</p>
                <p className="text-sm text-slate-500 mt-1">Aceso imediato às 7 técnicas respiratórias</p>
              </div>

              <button type="submit" className="w-full mt-4 bg-[#7ca982] text-white font-bold py-4 rounded-lg shadow-lg hover:bg-[#6a9370] transition-colors duration-300 transform hover:scale-105">
                ADQUIRIR AGORA
              </button>
            </form>
          </div>

          {/* Right Column: Image */}
          <div className="w-full lg:w-1/2 flex items-center justify-center mt-10 lg:mt-0">
            <div className="relative">
                <img 
                    src="https://picsum.photos/seed/wellness-man/600/800" 
                    alt="Man smiling in a calm environment" 
                    className="rounded-full object-cover w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] lg:w-[500px] lg:h-[500px] opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/50 backdrop-blur-sm rounded-full w-[350px] h-[350px] sm:w-[450px] sm:h-[450px] lg:w-[550px] lg:h-[550px]"></div>
                <div className="relative flex items-center justify-center transform lg:scale-110">
                    <img 
                        src="https://picsum.photos/seed/happy-person/600/900" 
                        alt="A happy person holding a phone"
                        className="object-cover w-full max-w-sm rounded-[50px] opacity-0"
                    />
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                        <PhoneMockup />
                    </div>
                    <div className="absolute -bottom-20 -right-20 lg:-bottom-24 lg:-right-28 text-white p-2 bg-gradient-to-tr from-white/30 to-transparent backdrop-blur-md rounded-full w-40 h-40 lg:w-52 lg:h-52 hidden lg:block">
                      <div className="w-full h-full border-2 border-dashed border-white/50 rounded-full"></div>
                    </div>
                    <div className="absolute -top-16 -left-16 text-white p-2 bg-gradient-to-tr from-white/30 to-transparent backdrop-blur-md rounded-full w-32 h-32 hidden lg:block">
                        <div className="w-full h-full border-2 border-dashed border-white/50 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 lg:mt-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 text-center text-slate-700">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 p-3 bg-white/70 rounded-full shadow-md mb-4">
                <BrainIcon />
              </div>
              <p className="font-semibold">Reduza o Estresse e a Ansiedade</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 p-3 bg-white/70 rounded-full shadow-md mb-4">
                <StrengthIcon />
              </div>
              <p className="font-semibold">Aumente Foco e Força Interior</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 p-3 bg-white/70 rounded-full shadow-md mb-4">
                <MeditationIcon />
              </div>
              <p className="font-semibold">Cultive a Presença e a Calma Diária</p>
            </div>
          </div>
          <p className="text-center mt-12 text-slate-500 max-w-2xl mx-auto">
            Parte de um treinamento respiratório para regular o sistema nervoso.
          </p>
        </div>
      </main>
    </div>
  );
}
