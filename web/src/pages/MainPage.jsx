// client/src/pages/MainPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const MainPage = () => {
  const { currentUser } = useAuth();

  // === СТЕЙТИ КЕРУВАННЯ ІНТЕРФЕЙСОМ ===
  const [hideBalances, setHideBalances] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExtendedHistory, setIsExtendedHistory] = useState(false);

  // Фільтри для розширеного режиму
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // === СТЕЙТИ ДЛЯ ДАНИХ З БЕКЕНДУ ===
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [transactions, setTransactions] = useState([]);

  // ЗАВАНТАЖЕННЯ РАХУНКІВ КОРИСТУВАЧА
    const fetchAccounts = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/accounts?userId=${currentUser.uid}`);
        const data = await response.json();
        setAccounts(data); 
      } catch (err) {
        console.error("Помилка завантаження рахунків:", err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    useEffect(() => {
        if (currentUser) fetchAccounts();
      }, [currentUser]);

  // ЗАВАНТАЖЕННЯ ТРАНЗАКЦІЙ З БАЗИ
  const fetchTransactions = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/transactions?userId=${currentUser.uid}`);
      if (!response.ok) throw new Error('Не вдалося завантажити історію операцій');
      
      const data = await response.json();
      
      // Форматуємо даних з бази
      const formattedData = data.map(tr => ({
        id: tr._id || tr.id,
        rawAccountId: tr.accountId?._id || tr.accountId,
        amount: tr.amount,
        type: tr.type,
        categoryName: tr.categoryName,
        description: tr.description,
        accountName: tr.accountId?.accountName || 'Рахунок',
        date: new Date(tr.date).toLocaleString('uk-UA', { 
          day: 'numeric', 
          month: 'long', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }));

      setTransactions(formattedData);
    } catch (err) {
      console.error("Помилка при отриманні списку транзакцій:", err.message);
    }
  };
  useEffect(() => {
    if (currentUser) fetchTransactions();
  }, [currentUser]);


  // ВИДАЛЕННЯ ТРАНЗАКЦІЇ З РЕВЕРСОМ БАЛАНСУ
  const handleTransactionDelete = async (trToDelete) => {
    const confirmDelete = window.confirm(`Видалити операцію "${trToDelete.description || trToDelete.categoryName}" на суму ${trToDelete.amount} ₴? Баланс пов'язаного рахунку буде автоматично перераховано.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`http://localhost:5000/api/transactions/${trToDelete.id}?userId=${currentUser.uid}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Не вдалося видалити транзакцію на сервері');

      // реверс балансу рахунку на фронтенді
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => {
          const currentId = acc._id || acc.id;
          if (currentId === trToDelete.rawAccountId) {

            const reverseDiff = trToDelete.type === 'income' ? -trToDelete.amount : trToDelete.amount;
            return { ...acc, balance: acc.balance + reverseDiff };
          }
          return acc;
        })
      );

      // Видалення з локального стейту фронтенду
      setTransactions(prev => prev.filter(tr => tr.id !== trToDelete.id));
      alert('Операцію скасовано!');
    } catch (err) {
        console.error("Повна помилка видалення транзакції:", err);
        alert(`Помилка: ${err.message || 'Невідома помилка мережі або 404'}`);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);// Динамічний розрахунок загального капіталу на основі отриманих рахунків
  const totalExpenses = transactions
    .filter(tr => tr.type === 'expense')
    .reduce((sum, tr) => sum + tr.amount, 0);

  // Стейт форми нової ручної транзакції
  const [newTx, setNewTx] = useState({
    amount: '',
    type: 'expense',
    accountId: '', // автоматично виставляється на перший доступний рахунок
    categoryName: '',
    description: '',
    date: new Date().toISOString().slice(0, 16)
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const usedCategories = [
    ...new Set(transactions.map(tr => tr.categoryName))
  ];

  // ЗАВАНТАЖЕННЯ КУРСІВ ВАЛЮТ НБУ
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setRatesLoading(true);
        const response = await fetch('http://localhost:5000/api/currencies');
        if (!response.ok) {
          throw new Error('Не вдалося завантажити курси валют від сервера');
        }
        
        const data = await response.json();
        setRates(data);
      } catch (err) {
        console.error("Помилка отримання валют:", err.message);
        setRatesError(err.message);
      } finally {
        setRatesLoading(false);
      }
    };
    fetchRates();
  }, []);


  useEffect(() => {
    if (accounts.length > 0 && !newTx.accountId) {
      setNewTx(prev => ({ ...prev, accountId: accounts[0]._id || accounts[0].id }));
    }
  }, [accounts]);

  // ВІДПРАВКА ТРАНЗАКЦІЇ НА БЕКЕНД
  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.uid,
          accountId: newTx.accountId,
          amount: Number(newTx.amount),
          type: newTx.type,
          categoryName: newTx.categoryName,
          description: newTx.description,
          date: new Date(newTx.date).toISOString()
        })
      });
      if (!response.ok) {
        throw new Error('Не вдалося зберегти транзакцію на сервері');
      }

      const savedTransaction = await response.json();

      // Миттєво оновлюється баланс рахунку локально в стейті
      setAccounts(prevAccounts => 
        prevAccounts.map(acc => {
          const currentId = acc._id || acc.id;
          if (currentId === newTx.accountId) {
            const diff = newTx.type === 'income' ? Number(newTx.amount) : -Number(newTx.amount);
            return { ...acc, balance: acc.balance + diff };
          }
          return acc;
        })
      );

      // Додавання нової транзакції в локальний список на початок масиву
      setTransactions(prev => [
      {
          id: savedTransaction._id, 
          rawAccountId: newTx.accountId,
          amount: Number(newTx.amount),
          type: newTx.type,
          categoryName: newTx.categoryName,
          description: newTx.description,
          accountName: accounts.find(a => (a._id || a.id) === newTx.accountId)?.accountName || 'Рахунок',
          date: new Date(newTx.date).toLocaleString('uk-UA', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      },
      ...prev
      ]);

      setIsModalOpen(false);
      setNewTx({
        amount: '',
        type: 'expense',
        accountId: accounts[0]?._id || accounts[0]?.id || '',
        categoryName: '',
        description: '',
        date: new Date().toISOString().slice(0, 16)
      });

      alert('Операцію успішно проведено!');
    } catch (err) {
      console.error("Помилка при створенні транзакції:", err.message);
      alert(`Помилка: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ДОПОМІЖНІ ФУНКЦІЇ

  const formatAmount = (amount, currency = 'UAH') => {
    if (hideBalances) return '***';
    const sign = currency === 'UAH' ? '₴' : currency === 'USD' ? '$' : '€';
    return `${amount.toLocaleString('uk-UA')} ${sign}`;
  };

  // Логіка фільтрації транзакцій для розширеного режиму
  const filteredTransactions = transactions.filter(tr => {
    const matchesType = filterType === 'all' || tr.type === filterType;
    const matchesSearch = tr.categoryName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tr.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const displayedTransactions = isExtendedHistory ? filteredTransactions : transactions.slice(0, 5);

  
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ЗАГАЛЬНИЙ КАПІТАЛ ТА КУРСИ НБУ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* Картка загального балансу */}
        <div className="md:col-span-2 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
          <div className="flex items-center justify-between z-10">
            <span className="text-sm md:text-base font-bold text-neutral-400">Загальний баланс </span>

            <button 
              onClick={() => setHideBalances(!hideBalances)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition text-white"
              title={hideBalances ? "Показати баланси" : "Приховати баланси"}
            >
              {hideBalances ? <span className="text-lg">👀</span> : <span className="text-lg">👀</span>}
            </button>
          </div>
          <div className="my-4 z-10">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">
              {formatAmount(totalBalance, 'UAH')}
            </h2>
          </div>
          <div className="text-xs text-neutral-400 z-10">Гривня (UAH)</div>
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl"></div>
        </div>

        {/* Картка курсів валют НБУ (Живі дані з бекенду) */}
        <div className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Офіційний курс НБУ</h3>
            
            <div className="divide-y divide-gray-100">
              {ratesLoading && (
                <div className="py-6 text-center text-xs text-gray-400 animate-pulse font-medium">
                  Оновлення курсів з бази...
                </div>
              )}

              {ratesError && (
                <div className="py-6 text-center text-xs text-rose-500 font-semibold">
                  Не вдалося завантажити курси
                </div>
              )}

              {!ratesLoading && !ratesError && rates.map((rate) => (
                <div key={rate._id || rate.code} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-800 text-sm">{rate.code}</span>
                    <span className="text-xs text-gray-400">/ UAH</span>
                  </div>
                  <span className="font-bold text-neutral-900">
                    {typeof rate.rate === 'number' ? rate.rate.toFixed(2) : rate.rate} ₴
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-50">
            Дані оновлюються раз на добу
          </div>
        </div>
      </div>

      {/* БЛОК 2: МОЇ ДЖЕРЕЛА (РАХУНКИ) */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-4">Поточні баланси серед джерел</h3>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x">
          {loadingAccounts ? (
            <div className="text-sm text-gray-400 animate-pulse py-4">Завантаження рахунків...</div>
          ) : accounts.length > 0 ? (
            accounts.map((acc) => (
              <div key={acc._id || acc.id} className="min-w-[240px] md:min-w-[280px] bg-white border border-gray-100 p-5 rounded-2xl shadow-sm snap-start flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                  <span className="font-bold text-gray-700 text-sm md:text-base">{acc.accountName}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 text-gray-500 font-bold uppercase">
                    {acc.type === 'cash' ? 'Cash' : 'Card'}
                  </span>
                </div>
                <div className="text-xl md:text-2xl font-black text-neutral-900">
                  {formatAmount(acc.balance, acc.currency)}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-400 italic py-4">
              Рахунків не знайдено. Задайте стартовий капітал в налаштуваннях.
            </div>
          )}
        </div>
      </div>

      {/* БЛОК 3: ДИНАМІЧНІ ОПЕРАЦІЇ ТА СТАТИСТИКА */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Спискова часть (Транзакції) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-xl font-bold text-gray-800">
              {isExtendedHistory ? 'Вся історія операцій' : 'Останні операції'}
            </h3>
            
            {/* Кнопка перемикання виду */}
            <button 
              onClick={() => setIsExtendedHistory(!isExtendedHistory)}
              className="text-sm font-bold text-neutral-600 hover:text-black transition underline bg-transparent self-start md:self-auto"
            >
              {isExtendedHistory ? '← Назад до стислого виду' : 'Розгорнути та фільтрувати →'}
            </button>
          </div>

          {/* Excel-style панель фільтрації */}
          {isExtendedHistory && (
            <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Пошук за назвою/описом</label>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Введіть text для пошуку..." 
                  className="w-full px-3 py-2 text-sm bg-neutral-50 rounded-xl border border-gray-100 outline-none focus:border-brand-stroke"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Тип операції</label>
                <div className="flex gap-2">
                  {['all', 'expense', 'income'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterType(t)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
                        filterType === t ? 'bg-black text-white' : 'bg-neutral-50 text-gray-600 hover:bg-neutral-100'
                      }`}
                    >
                      {t === 'all' ? 'Всі' : t === 'expense' ? 'Витрати' : 'Доходи'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Головний контейнер списку операцій */}
          <div className="bg-white border border-gray-100 rounded-3xl p-2 shadow-sm">
            <div className="divide-y divide-gray-50">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tr) => (
                  <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition rounded-xl group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                        tr.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {tr.type === 'income' ? '↓' : '↑'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900">{tr.description || tr.categoryName}</h4>
                        <p className="text-[11px] text-gray-400">{tr.date} • {tr.categoryName} • <span className="italic">{tr.accountName}</span></p>
                      </div>
                    </div>
                    
                    {/* Контейнер для суми та прихованої кнопки видалення */}
                    <div className="flex items-center gap-4">
                      <div className={`font-black text-base ${
                        tr.type === 'income' ? 'text-neutral-900' : 'text-neutral-900'
                      }`}>
                        {tr.type === 'income' ? '+' : '-'}{formatAmount(tr.amount, 'UAH')}
                      </div>
                      
                      {/* Кнопка видалення транзакції (з'являється при наведенні мишки на рядок) */}
                      <button
                        onClick={() => handleTransactionDelete(tr)}
                        className="opacity-0 group-hover:opacity-100 text-xs font-bold bg-rose-50 text-rose-500 hover:bg-rose-100 p-2 rounded-xl transition-all duration-150"
                        title="Видалити цю операцію"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-400">Операцій за вказаними фільтрами не знайдено</div>
              )}
            </div>
          </div>
        </div>

        {/* Картка Аналітики */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm space-y-4 text-center">
          <h3 className="text-xl font-bold text-gray-800">Аналітика</h3>
          <div className="w-full h-40 bg-neutral-50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-gray-200 text-gray-400 text-xs gap-2">
            <span className="text-2xl">📊</span>
            <span>Діаграма витрат</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-t pt-2 font-bold">
              <span className="text-gray-800">Загалом витрат:</span>
              <span className="text-rose-600">-{formatAmount(' UAH')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) ДЛЯ ВИКЛИКУ МОДАЛКИ */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-primary text-black rounded-full shadow-2xl flex items-center justify-center text-3xl font-bold hover:scale-105 transition z-40"
      >
        +
      </button>
      
      {/* МОДАЛЬНЕ ВІКНО ШВИДКОГО ДОДАВАННЯ ТРАНЗАКЦІЇ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)} 
          />

          <div className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 md:p-8 border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-5 right-5 text-gray-400 hover:text-black transition-colors text-xl font-bold p-2"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-black text-neutral-900 mb-6 pr-8">Нова операція</h3>
            
            <form className="space-y-4" onSubmit={handleTransactionSubmit}>
              {/* СУМА */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Сума</label>
                <input 
                  required 
                  type="number" 
                  value={newTx.amount}
                  onChange={(e) => setNewTx({...newTx, amount: e.target.value})}
                  placeholder="0.00" 
                  className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-stroke outline-none font-black text-2xl transition-all" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* ТИП */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Тип</label>
                  <select 
                    value={newTx.type}
                    onChange={(e) => setNewTx({...newTx, type: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-primary outline-none font-bold text-sm appearance-none cursor-pointer transition-all"
                  >
                    <option value="expense">Розхід (списання)</option>
                    <option value="income">Дохід (надходження)</option>
                  </select>
                </div>
                {/* ДЖЕРЕЛО */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Джерело</label>
                  <select 
                    value={newTx.accountId}
                    onChange={(e) => setNewTx({...newTx, accountId: e.target.value})}
                    className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-primary outline-none font-bold text-sm appearance-none cursor-pointer transition-all"
                  >
                    {accounts.map(a => <option key={a._id || a.id} value={a._id || a.id}>{a.accountName}</option>)}
                  </select>
                </div>
              </div>

              {/* ДАТА ТА ЧАС */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Коли це було?</label>
                <input 
                  required
                  type="datetime-local" 
                  value={newTx.date}
                  onChange={(e) => setNewTx({...newTx, date: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-primary outline-none text-sm font-bold transition-all" 
                />
              </div>

              {/* КАТЕГОРІЯ З ДИНАМІЧНИМИ ПІДКАЗКАМИ */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Категорія</label>
                <input 
                  required 
                  type="text" 
                  list="categories-list"
                  value={newTx.categoryName}
                  onChange={(e) => setNewTx({...newTx, categoryName: e.target.value})}
                  placeholder="Почни вводити або обери..." 
                  className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-primary outline-none text-sm font-bold transition-all" 
                />
                
                <datalist id="categories-list">
                  {usedCategories.map((cat, index) => (
                    <option key={index} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* ОПИС */}
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Опис (необов'язково)</label>
                <input 
                  type="text" 
                  value={newTx.description}
                  onChange={(e) => setNewTx({...newTx, description: e.target.value})}
                  placeholder="Наприклад: Пообідав в центрі" 
                  className="w-full p-4 rounded-2xl bg-neutral-50 border-2 border-transparent focus:bg-white focus:border-brand-primary outline-none text-sm font-medium transition-all" 
                />
              </div>

              {/* КНОПКА ЗБЕРЕЖЕННЯ */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-brand-primary text-black font-black py-5 rounded-2xl text-lg shadow-xl hover:brightness-105 active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Проведення...' : 'Підтвердити операцію'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainPage;