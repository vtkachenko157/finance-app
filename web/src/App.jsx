import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import SettingsPage from './pages/SettingsPage';
import AccountsPage from './pages/AcountsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-finance-text antialiased">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/settings" element={<SettingsPage/>} />
          <Route path="/accounts" element={<AccountsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;