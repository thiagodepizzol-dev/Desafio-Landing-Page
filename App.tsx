
import React, { useState } from 'react';
import { BrainIcon, StrengthIcon, MeditationIcon, LotusIcon } from './components/Icons';

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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // O link base da Hotmart
  const hotmartLink = "https://pay.hotmart.com/F102989418Q";

  // Constrói a URL final com o e-mail do comprador para rastreamento
  // Hotmart usa o parâmetro 'email' para pré-preencher o campo de e-mail no checkout
  const checkoutUrl = email ? `${hotmartLink}?email=${encodeURIComponent(email)}` : hotmartLink;


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

          <form onSubmit={(e) => e.preventDefault()} className="mt-8 space-y-4">
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

            <div className="pt-4 text-center">
              <p className="text-4xl font-bold text-slate-700">3 x R$9,90</p>
              <p className="text-sm text-slate-500 mt-1">Acesso imediato às 7 técnicas respiratórias</p>
            </div>

            <a
              href={checkoutUrl}
              target="_blank" // Abre em uma nova aba para não perder a página original
              rel="noopener noreferrer"
              className="block w-full text-center mt-4 bg-[#7ca982] text-white font-bold py-4 rounded-lg shadow-lg hover:bg-[#6a9370] transition-colors duration-300 transform hover:scale-105"
            >
              ADQUIRIR AGORA
            </a>
          </form>
        </div>

        {/* Image Column */}
        <div className="hidden md:flex justify-center items-center">
          <img
            src="https://i.ibb.co/848jsfj6/Untitled-design-3-1.png"
            alt="Homem sorrindo"
            className="max-w-md lg:max-w-lg drop-shadow-2xl"
          />
        </div>
      </main>

      <section className="py-12 bg-white/30 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-700">O que você vai conquistar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-4">
                <div className="flex justify-center mb-4">
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
