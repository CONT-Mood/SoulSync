// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CharacterProvider } from "./contexts/CharacterContext";

import Login from "./pages/Login";
import ChatMain from "./pages/ChatMain";
import DiagnosisPick from "./pages/DiagnosisPick";
import CrisisSupport from "./pages/CrisisSupport"; // 위기지원 페이지
import CharacterPick from "./pages/CharacterPick";
import PSS from "./pages/PSS";
import PHQ9 from "./pages/PHQ9";
import GAD7 from "./pages/GAD7";
import MKPQ16 from "./pages/MKPQ16";
import ChatLog from "./pages/ChatLog";

function App() {
  return (
    <CharacterProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/chat" element={<ChatMain />} />
          <Route path="/diagnosis" element={<DiagnosisPick />} />
          <Route path="/crisis" element={<CrisisSupport />} /> {/* 위기지원 */}
          <Route path="/pss" element={<PSS />} />
          <Route path="/phq9" element={<PHQ9 />} />
          <Route path="/gad7" element={<GAD7 />} />
          <Route path="/mkpq16" element={<MKPQ16 />} />
          <Route path="/chatlog" element={<ChatLog />} />
          <Route path="/pick" element={<CharacterPick />} />
        </Routes>
      </BrowserRouter>
    </CharacterProvider>
  );
}

export default App;
