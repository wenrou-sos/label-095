import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import TagManagement from "@/pages/TagManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tags" element={<TagManagement />} />
        <Route path="/rfm" element={<Home />} />
        <Route path="/consumption" element={<Home />} />
        <Route path="/behavior" element={<Home />} />
        <Route path="/space" element={<Home />} />
        <Route path="/recommend" element={<Home />} />
        <Route path="/export" element={<Home />} />
        <Route path="/other" element={<div className="text-center text-xl">Other Page - Coming Soon</div>} />
      </Routes>
    </Router>
  );
}
