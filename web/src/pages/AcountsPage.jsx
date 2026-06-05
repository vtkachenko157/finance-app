import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useAuth } from '../context/AuthContext';

const AccountsPage = () => {
  const { currentUser } = useAuth();
  // === СТЕЙТИ ДАНИХ ТА МОДАЛОК ===
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false); // Спільна модалка для редагування/коригування/видалення

  // Структура створення нового рахунку
  const [addType, setAddType] = useState('manual'); 
  const [newAccount, setNewAccount] = useState({
    accountName: '',
    type: 'cash', 
    initialBalance: '',
    currency: 'UAH',
    apiProvider: 'monobank', 
    apiToken: ''
  });
  // Стейт для керування обраним рахунком (редагування, коригування, видалення)
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ЗАВАНТАЖЕННЯ РАХУНКІВ 
  const fetchAccounts = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/accounts?userId=${currentUser.uid}`);
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      console.error("Помилка завантаження рахунків:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchAccounts();
  }, [currentUser]);

  // СТВОРЕННЯ РАХУНКУ 
  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const payload = {
      userId: currentUser.uid,
      accountName: newAccount.accountName,
      currency: newAccount.currency,
      type: addType === 'manual' ? newAccount.type : 'api_bank',
      initialBalance: addType === 'manual' ? Number(newAccount.initialBalance || 0) : 0,
      ...(addType === 'api' && {
        apiProvider: newAccount.apiProvider,
        apiToken: newAccount.apiToken
      })
    };

    try {
      const response = await fetch('http://localhost:5000/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Помилка сервера при створенні');
      // Повідомлення про створення рахунку або ж помилку
      alert(addType === 'manual' ? 'Рахунок створено!' : 'Банк успішно підключено!');
      setIsAddModalOpen(false);
      setNewAccount({ accountName: '', type: 'cash', initialBalance: '', currency: 'UAH', apiProvider: 'monobank', apiToken: '' });
      fetchAccounts();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ОНОВЛЕННЯ ДАНИХ
  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    if (!selectedAccount || isSubmitting) return;
    setIsSubmitting(true);

    const accountId = selectedAccount._id || selectedAccount.id; // береться id з MongoDB

    try {
      // Відправляємо PUT запит для оновлення полей рахунку
      const response = await fetch(`http://localhost:5000/api/accounts/${accountId}?userId=${currentUser.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: currentUser.uid,
          accountName: editName,
          balance: Number(editBalance)
        })
      });
      if (!response.ok) throw new Error('Не вдалося оновити дані рахунку');
      // Повідомлення про зміни або ж помилки
      alert('Зміни успішно збережено!');
      setIsManageModalOpen(false);
      fetchAccounts();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ВИДАЛЕННЯ РАХУНКУ
  const handleDeleteAccount = async () => {
    if (!selectedAccount || isSubmitting) return;
    
    const confirmDelete = window.confirm(`Ти впевнений, що хочеш повністю видалити рахунок "${selectedAccount.accountName}"? Усі пов'язані транзакції будуть зачеплені.`);
    if (!confirmDelete) return;

    setIsSubmitting(true);

  const accountId = selectedAccount._id; // береться id з MongoDB
  const response = await fetch(`http://localhost:5000/api/accounts/${accountId}?userId=${currentUser.uid}`, {
    method: 'DELETE'
  });
      if (!response.ok) throw new Error('Не вдалося видалити рахунок з бази');

      alert('Рахунок безповоротно видалено.');
      setIsManageModalOpen(false);
      fetchAccounts();
    }

  // Вибір поточної валюти рахунку
  const getCurrencySign = (curr) => {
    if (curr === 'UAH') return '₴';
    if (curr === 'USD') return '$';
    if (curr === 'EUR') return '€';
    return curr;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-bold">Завантаження профілю...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-neutral-50 antialiased text-black pb-12">
      <Header />

      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-8 animate-in fade-in duration-300">
        
        {/* ЗАГОЛОВОК СТОРІНКИ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-neutral-900">Управління гаманцями</h2>
            <p className="text-gray-500 text-sm">Перегляд, перейменування, коригування балансів та видалення рахунків.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-black text-white font-black px-6 py-4 rounded-2xl text-sm hover:bg-neutral-800 transition shadow-md flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <span>+</span> Додати рахунок
          </button>
        </div>

        {/* КАРТКИ РАХУНКІВ */}
        <div>
          <h3 className="text-lg font-black text-gray-400 uppercase tracking-wider mb-4">Активні рахунки</h3>
          {loading ? (
            <div className="text-sm text-gray-400 animate-pulse">Завантаження фінансів...</div>
          ) : accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((acc) => (
                <div key={acc._id || acc.id} className="bg-white border border-gray-100 p-6 rounded-[28px] shadow-sm flex flex-col justify-between h-44 hover:shadow-md transition relative group overflow-hidden">
                  <div className="flex items-start justify-between z-10">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">{acc.accountName}</h4>
                      <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mt-0.5">
                        {acc.type === 'cash' ? 'Готівка' : acc.type === 'api_bank' ? 'API Синхронізація' : 'Картка (Ручна)'}
                      </p>
                    </div>
                    {/* Виклик панелі управління рахунком */}
                    <button 
                      onClick={() => {
                        setSelectedAccount(acc);
                        setEditName(acc.accountName);
                        setEditBalance(acc.balance);
                        setIsManageModalOpen(true);
                      }}
                      className="p-2 bg-neutral-50 rounded-xl text-gray-400 hover:text-black hover:bg-neutral-100 transition"
                      title="Налаштування рахунку"
                    >
                      ✏️
                    </button>
                  </div>
                  <div className="z-10">
                    <span className="text-3xl font-black text-neutral-900">
                      {acc.balance.toLocaleString('uk-UA')} {getCurrencySign(acc.currency)}
                    </span>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-neutral-50 rounded-full group-hover:scale-110 transition z-0"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-white border border-dashed rounded-3xl text-gray-400 text-sm">
              Немає створених рахунків. Натисніть кнопку вище, щоб додати стартовий гаманець.
            </div>
          )}
        </div>

        {/* СЕКЦІЯ 2: ТАБЛИЦЯ */}
        {!loading && accounts.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-[32px] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="text-lg font-bold text-gray-800">Зведена таблиця джерел</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-[11px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-100">
                    <th className="p-4 pl-6">Назва</th>
                    <th className="p-4">Тип обліку</th>
                    <th className="p-4">Валюта</th>
                    <th className="p-4 text-right pr-6">Баланс</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm font-medium">
                  {accounts.map((acc) => (
                    <tr key={acc._id || acc.id} className="hover:bg-neutral-50/60 transition">
                      <td className="p-4 pl-6 font-bold text-gray-900">{acc.accountName}</td>
                      <td className="p-4 text-gray-500">
                        {acc.type === 'cash' ? 'Ручний (Готівка)' : acc.type === 'api_bank' ? 'API банку' : 'Ручний (Банківська картка)'}
                      </td>
                      <td className="p-4"><span className="bg-neutral-100 text-xs px-2 py-1 rounded-md font-bold">{acc.currency}</span></td>
                      <td className="p-4 text-right pr-6 font-black text-base text-neutral-900">
                        {acc.balance.toLocaleString('uk-UA')} {getCurrencySign(acc.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* МОДАЛКА: СТВОРЕННЯ РАХУНКУ                                */}
      {/* ========================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 md:p-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-black transition font-bold p-2">✕</button>
            
            <h3 className="text-2xl font-black text-neutral-900 mb-6">Додати новий рахунок</h3>

            <div className="flex bg-neutral-100 p-1 rounded-xl mb-6">
              <button 
                type="button"
                onClick={() => setAddType('manual')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${addType === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
              >
                Ручний рахунок
              </button>
              <button 
                type="button"
                onClick={() => setAddType('api')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition ${addType === 'api' ? 'bg-white text-black shadow-sm' : 'text-gray-500'}`}
              >
                Банк по API
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Назва рахунку</label>
                <input 
                  required 
                  type="text" 
                  value={newAccount.accountName}
                  onChange={(e) => setNewAccount({...newAccount, accountName: e.target.value})}
                  placeholder="Наприклад: Гаманець, якась картка" 
                  className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-primary outline-none font-medium text-sm" 
                />
              </div>

              {addType === 'manual' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Тип активу</label>
                    <select 
                      value={newAccount.type}
                      onChange={(e) => setNewAccount({...newAccount, type: e.target.value})}
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent outline-none font-medium text-sm"
                    >
                      <option value="cash">Готівка</option>
                      <option value="manual_bank">Картка (Ручний ввід)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Стартовий баланс</label>
                    <input 
                      required 
                      type="number" 
                      value={newAccount.initialBalance}
                      onChange={(e) => setNewAccount({...newAccount, initialBalance: e.target.value})}
                      placeholder="0.00" 
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-primary outline-none font-bold text-sm" 
                    />
                  </div>
                </div>
              )}

              {addType === 'api' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Оберіть банк</label>
                    <select 
                      value={newAccount.apiProvider}
                      onChange={(e) => setNewAccount({...newAccount, apiProvider: e.target.value})}
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent outline-none font-bold text-sm"
                    >
                      <option value="monobank">Monobank</option>
                    </select>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Персональний API-Токен</label>
                      <a href="https://api.monobank.ua/" target="_blank" rel="noreferrer" className="text-[10px] text-neutral-500 underline font-bold hover:text-black">Отримати токен Monobank ↗</a>
                    </div>
                    <input 
                      required 
                      type="password" 
                      value={newAccount.apiToken}
                      onChange={(e) => setNewAccount({...newAccount, apiToken: e.target.value})}
                      placeholder="Вставити токен" 
                      className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-primary outline-none text-xs font-mono" 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Валюта рахунку</label>
                <select 
                  value={newAccount.currency}
                  onChange={(e) => setNewAccount({...newAccount, currency: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent outline-none font-bold text-sm"
                >
                  <option value="UAH">UAH (₴)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="PLN">PLN (zł)</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-black font-black py-4 rounded-xl text-base shadow-md hover:brightness-105 transition mt-4 disabled:opacity-50"
              >
                {isSubmitting ? 'Обробка...' : addType === 'manual' ? 'Створити рахунок' : 'Підключити банк'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* СПІЛЬНА МОДАЛКА: УПРАВЛІННЯ РАХУНКОМ (Редагування/Видалення) */}
      {/* ========================================================= */}
      {isManageModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsManageModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 md:p-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <button onClick={() => setIsManageModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-black text-lg font-bold">✕</button>
            
            <h4 className="text-xl font-black text-neutral-900 mb-2">Налаштування рахунку</h4>
            <p className="text-xs text-gray-400 mb-6">Зміна імені, коригування фактичного балансу або повне видалення.</p>

            <form onSubmit={handleUpdateAccount} className="space-y-4">
              {/* ПЕРЕЙМЕНУВАННЯ */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Назва рахунку</label>
                <input 
                  required
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-primary outline-none text-sm font-bold"
                />
              </div>

              {/* КОРИГУВАННЯ БАЛАНСУ */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Фактичний баланс ({selectedAccount.currency})</label>
                <input 
                  required
                  type="number" 
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-neutral-50 border border-transparent focus:bg-white focus:border-brand-primary outline-none font-black text-base"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-100">
                {/* КНОПКА ЗБЕРЕЖЕННЯ ЗМІН */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-neutral-900 text-white font-bold py-3.5 rounded-xl text-sm shadow-md hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Збереження...' : 'Зберегти зміни'}
                </button>

                {/* КНОПКА ПОВНОГО ВИДАЛЕННЯ */}
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={handleDeleteAccount}
                  className="w-full bg-rose-50 text-rose-600 font-bold py-3.5 rounded-xl text-sm hover:bg-rose-100 transition disabled:opacity-50 mt-2"
                >
                  ❌ Видалити рахунок повністю
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AccountsPage;