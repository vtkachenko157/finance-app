// client/src/pages/SettingsPage.jsx
import React, { useState } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { currentUser, logout } = useAuth();

  const [initialCapital, setInitialCapital] = useState({ cash: '0', card: '0' });
  const [defaultCurrency, setDefaultCurrency] = useState('UAH');
  // Список доступних для вибору валют
  const availableCurrencies = [
    { code: 'UAH', text: 'Гривня (UAH, ₴)' },
    { code: 'USD', text: 'Долар (USD, $)' },
    { code: 'EUR', text: 'Євро (EUR, €)' },
    { code: 'PLN', text: 'Злотий (PLN, zł)' },
    { code: 'GBP', text: 'Фунт стерлінгів (GBP)' },
    { code: 'CHF', text: 'Швейцарський франк (CHF)' },
    { code: 'CAD', text: 'Канадський долар (CAD)' }
  ];

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  // ЗБЕРЕЖЕННЯ НАЛАШТУВАНЬ
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSaving(true);

    try {
      // Оновлення глобальної валюти в профілі юзера
    await fetch('http://localhost:5000/api/users/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firebaseId: currentUser.uid, 
          mainCurrency: defaultCurrency 
        })
      });

      if (Number(initialCapital.cash) > 0) {
        await fetch('http://localhost:5000/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.uid, 
            accountName: 'Готівка', 
            type: 'cash', 
            initialBalance: Number(initialCapital.cash), 
            currency: defaultCurrency 
          })
        });
      }

      if (Number(initialCapital.card) > 0) {
        await fetch('http://localhost:5000/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userId: currentUser.uid, 
            accountName: 'Картка ', 
            type: 'manual_card', 
            initialBalance: Number(initialCapital.card), 
            currency: defaultCurrency 
          })
        });
      }
      

      alert('Налаштування та стартовий капітал успішно збережено!');
      setInitialCapital({});
    } catch (error) {
      console.error('Помилка збереження:', error);
      alert('Не вдалося зберегти налаштування. Перевірте зʼєднання з сервером.');
    } finally {
      setIsSaving(false);
    }
  };

  // ПОВНЕ ВИДАЛЕННЯ АКАУНТУ
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'ВИДАЛИТИ' || !currentUser) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${currentUser.uid}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Помилка видалення бази даних');

      await currentUser.delete();      
      alert('Акаунт успішно та безповоротно видалено.');
      logout();
    } catch (err) {
      console.error("Помилка при видаленні акаунту:", err.message);
      // В разі невдалої спроби необхідна "свіжа" авторизація для видалення акаунту з міркувань безпеки
      alert("Не вдалося видалити профіль. Треба повторити спробу.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 antialiased text-black pb-12">
      <Header />

      <main className="max-w-3xl mx-auto px-4 md:px-8 mt-8 animate-in fade-in duration-300">
        <h2 className="text-3xl font-black text-neutral-900 mb-2 text-center">Налаштування профілю</h2>
        <p className="text-gray-500 text-sm mb-8 text-center">Конфігурація фінансового простору та керування приватністю.</p>

        <div className="space-y-8">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
             Глобальні параметри
            </h2>
            
            <form onSubmit={handleSavePreferences} className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Задання початкового капіталу</h4>
                <p className="text-xs text-gray-400 mb-3">
                  Вкажи суми, якими хочеш керувати.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Стартовий баланс (Готівка)</label>
                    <input 
                      type="number" 
                      value={initialCapital.cash}
                      onChange={(e) => setInitialCapital({...initialCapital, cash: e.target.value})}
                      placeholder="0.00" 
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-stroke outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Стартовий баланс (Картка)</label>
                    <input 
                      type="number" 
                      value={initialCapital.card}
                      onChange={(e) => setInitialCapital({...initialCapital, card: e.target.value})}
                      placeholder="0.00" 
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-stroke outline-none font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-1">Основна валюта</label>
                <p className="text-xs text-gray-400 mb-3">Обери валюту, за якою додаток рахуватиме твій капітал.</p>
                <select 
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full md:w-1/2 p-3.5 rounded-xl bg-neutral-50 border border-transparent outline-none font-bold text-sm"
                >
                  {availableCurrencies.map((curr) => (
                    <option key={curr.code} value={curr.code}>
                      {curr.text}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-black text-white font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-neutral-800 transition shadow-sm disabled:opacity-50"
                >
                  {isSaving ? 'Збереження...' : 'Зберегти зміни капіталу'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-rose-50/50 border border-rose-100 rounded-3xl p-6 md:p-8 shadow-sm">
            <p className="text-xs text-rose-600 max-w-xl mb-4">
              Видалення профілю призведе до повного знищення облікового запису, а також очищення всіх рахунків та транзакцій.
            </p>
            <button 
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-rose-600 text-white font-bold px-6 py-3.5 rounded-xl text-sm hover:bg-rose-700 transition shadow-md"
            >
              Видалити акаунт назавжди
            </button>
          </div>
        </div>
      </main>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 relative border animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => { setIsDeleteModalOpen(false); setDeleteConfirmText(''); }}
              className="absolute top-4 right-4 text-gray-400 text-xl font-bold"
            >✕</button>
            
            <h4 className="text-lg font-black text-rose-600 mb-2">Ти впевнений що хочеш цього?</h4>
            <p className="text-xs text-gray-500 mb-4">
              Ця дія не вертається. Для підтвердження введіть слово <span className="font-extrabold text-black">ВИДАЛИТИ</span>.
            </p>
            
            <div className="space-y-4">
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Введіть великими літерами..." 
                className="w-full p-3.5 rounded-xl bg-neutral-50 border border-gray-100 outline-none focus:border-rose-500 font-bold text-center text-sm uppercase tracking-wider"
              />
              <button 
                disabled={deleteConfirmText !== 'ВИДАЛИТИ'}
                onClick={handleDeleteAccount}
                className={`w-full py-4 rounded-xl font-bold text-base transition text-white shadow-md ${
                  deleteConfirmText === 'ВИДАЛИТИ' ? 'bg-rose-600 hover:bg-rose-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Підтверджую видалення профілю
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;