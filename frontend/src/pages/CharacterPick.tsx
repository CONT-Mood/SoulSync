import React from 'react';
import { useNavigate } from 'react-router-dom';
import CharacterCard from '../components/CharacterPickForm';
import { useCharacter, type Character } from '../contexts/CharacterContext';

import empathImg from '../assets/empath.png';
import cognitiveImg from '../assets/cognitive.png';
import advisorImg from '../assets/advisor.png';
import traumaImg from '../assets/trauma.png';

const CharacterPick: React.FC = () => {
  const navigate = useNavigate();
  const { setSelectedCharacter } = useCharacter();

  const handleCharacterSelect = (character: Character) => {
    console.log(`${character.name} 캐릭터 선택됨`);
    setSelectedCharacter(character);
    navigate('/chat');
  };

  const characters: Character[] = [
    {
      id: "empath",
      name: "공감적 경청가형",
      image: empathImg,
      description: "당신의 이야기를 진심으로 들어주고 공감해주는 따뜻한 친구입니다.",
      personality: "따뜻하고 공감적이며, 감정을 깊이 이해하려고 노력합니다.",
      greeting: "안녕하세요! 저는 당신의 이야기를 진심으로 들어드릴게요. 어떤 일이든 편하게 말씀해주세요."
    },
    {
      id: "cognitive",
      name: "인지적 통찰가형", 
      image: cognitiveImg,
      description: "문제를 다각도로 분석하고 깊이 있는 통찰을 제공하는 지혜로운 친구입니다.",
      personality: "논리적이고 분석적이며, 문제의 근본 원인을 찾아 해결책을 제시합니다.",
      greeting: "안녕하세요! 저는 문제를 다각도로 분석하여 깊이 있는 통찰을 제공해드릴게요. 어떤 고민이 있으신가요?"
    },
    {
      id: "advisor",
      name: "현실적 조언가형",
      image: advisorImg,
      description: "실용적이고 현실적인 해결책을 제시해주는 신뢰할 수 있는 친구입니다.",
      personality: "현실적이고 실용적이며, 구체적이고 실행 가능한 조언을 제공합니다.",
      greeting: "안녕하세요! 저는 현실적이고 실용적인 조언으로 도움을 드릴게요. 어떤 문제를 해결하고 싶으신가요?"
    },
    {
      id: "trauma",
      name: "트라우마 민감형",
      image: traumaImg,
      description: "트라우마와 심리적 상처에 특별히 민감하고 전문적인 도움을 제공하는 친구입니다.",
      personality: "트라우마에 대한 깊은 이해를 바탕으로 안전하고 전문적인 상담을 제공합니다.",
      greeting: "안녕하세요! 저는 트라우마와 심리적 상처에 특별히 민감한 상담을 제공해드릴게요. 안전한 공간에서 이야기해주세요."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-300/5 to-purple-300/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 text-center mb-16">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
          <span className="text-2xl font-bold text-white">S</span>
        </div>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          당신의 친구를 선택하세요
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          각기 다른 성격과 전문성을 가진 AI 친구들과 만나보세요.<br />
          당신에게 가장 맞는 친구를 선택하여 대화를 시작해보세요.
        </p>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {characters.map((character, index) => (
            <div
              key={character.name}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CharacterCard
                character={character}
                onClick={handleCharacterSelect}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-16 text-center">
        <div className="flex items-center justify-center space-x-2">
          <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">S</span>
          </div>
          <p className="text-gray-500 text-sm">
            <span className="font-medium"></span> 각 캐릭터에 마우스를 올려보시면 더 자세한 정보를 확인할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CharacterPick;
