// 카드
import React, { useCallback } from 'react';
import type { Character } from '../contexts/CharacterContext';
import AnimatedImage from './AnimatedImage';

interface CharacterCardProps {
  character: Character;
  onClick: (character: Character) => void;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ character, onClick }) => {
  // 선택 핸들러
  const handleSelect = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      onClick(character);
    },
    [character, onClick]
  );

  // 키보드 선택
  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick(character);
      }
    },
    [character, onClick]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKey}
      className="group relative flex flex-col items-center cursor-pointer bg-white rounded-3xl p-8 shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 hover:border-blue-200 transform focus:outline-none focus:ring-2 focus:ring-purple-300/60"
      aria-label={`${character.name} 선택`}
    >
      {/* 배경 */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* 아바타 */}
      <div className="relative z-10 mb-6 h-40 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full p-4 shadow-lg overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-100 to-purple-100 group-hover:shadow-xl">
          <AnimatedImage
            src={character.image}
            alt={character.name}
            wrapperClassName="w-full h-full rounded-full"
          />
        </div>

        {/* 포커스 하이라이트 */}
        <div className="absolute inset-20 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* 미리보기 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 transition-all duration-300 pointer-events-none z-20 group-hover:opacity-100">
          <div className="relative bg-white rounded-2xl shadow-2xl p-4 border border-gray-200 w-64">
            <img
              src={character.image}
              alt={`${character.name} 미리보기`}
              className="w-full h-48 object-contain rounded-xl"
              draggable={false}
            />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white" />
            </div>
          </div>
        </div>
      </div>
      {/* 텍스트 */}
      <div className="relative z-10 text-center h-24 flex flex-col justify-center">
        <h3 className="text-xl font-bold text-gray-800 mb-4 transition-colors duration-300 group-hover:text-blue-600">
          {character.name}
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed transition-colors duration-300 group-hover:text-gray-700 line-clamp-2">
          {character.description}
        </p>
      </div>

      {/* 액션 */}
      <div className="relative z-10 h-16 flex items-center justify-center">
        <div className="opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
          <button
            type="button"
            className="px-6 py-2 rounded-full text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600"
          >
            선택하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;
