import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import FakeApiDemo from './components/FakeApiDemo';
import Home from './pages/Home';
import Dashboard from './pages/dashboard';
import Kalimantan from './pages/kalimantan';
import Petengoran from './pages/petengoran';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/kalimantan/*" element={<Kalimantan />} />
        <Route path="/petengoran/*" element={<Petengoran />} />
        <Route path="/demo" element={<FakeApiDemo />} />
      </Routes>
    </Router>
  );
};

export default App;