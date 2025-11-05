import { useNavigate } from "react-router-dom";
import { useCharacter } from '../contexts/CharacterContext';

const ChatHeader = ({ onToggleSidebar }: { onToggleSidebar: () => void }) => {
  const navigate = useNavigate();
  const { selectedCharacter } = useCharacter();

  return (
    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200 z-50 relative bg-gradient-to-r from-blue-50 via-white to-purple-50">
      <button 
        onClick={onToggleSidebar}
        className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center space-x-2">
        <div className="relative">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border border-white"></div>
        </div>
        <div className="text-center">
          <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SoulSync
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            {selectedCharacter?.name || 'AI 상담사'}
          </p>
        </div>
      </div>

      <div className="space-x-2">
        <button
          onClick={() => navigate("/diagnosis")}
          className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg text-xs font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
        >
          진단하기
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;