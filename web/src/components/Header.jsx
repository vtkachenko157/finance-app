import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  // Витягування даних про поточного користувача (currentUser) та функцію виходу (logout) з контексту авторизації.
  const { currentUser, logout } = useAuth();
  const location = useLocation(); // визначення на якій сторінці знаходиться користувач

  // Взаття першої літери е-пошти після реєстрації для піктограми аватарки
  const userLetter = currentUser && currentUser.email ? currentUser.email[0].toUpperCase() : '';
  // Взяття з е-пошти тільки букви
  const getUserName = () => {
    if (!currentUser || !currentUser.email) return '';
    const namePart = currentUser.email.split('@')[0];
    const onlyLetters = namePart.replace(/[0-9._-]/g, '');
    if (!onlyLetters) return 'користувачу';
    return onlyLetters.charAt(0).toUpperCase() + onlyLetters.slice(1);
  };
  // Підсвічування посилання, якщо воно відповідає поточній сторінці
  const getLinkClass = (path) => {
    const baseClass = "text-brand-navText text-lg font-bold transition text-center px-3 py-1.5 rounded-xl";
    if (location.pathname === path) {
      return `${baseClass} opacity-100 underline decoration-brand-primary decoration-2 underline-offset-4`;
    }
    return `${baseClass} opacity-60 hover:opacity-100`;
  };

  return (
    <header className="py-6 px-8">
      <div className="w-full max-w-7xl mx-auto bg-white rounded-3xl md:rounded-full p-3 shadow-lg border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
        
        {/* ЧАСТИНА "Привітання" */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="bg-brand-primary/90 px-4 md:px-5 py-2.5 md:py-3 rounded-2xl md:rounded-full border border-brand-stroke/95 text-center md:text-left mx-auto md:mx-0">
            <h1 className="text-xl font-bold text-black leading-snug">
              {currentUser ? (
                <>Привіт, <span className="text-neutral-900 font-black">{getUserName()}</span>!<br/>Користуйся додатком</>
              ) : (
                <>Привіт, почни керувати<br/>своїми фінансами!</>
              )}
            </h1>
          </div>
          {currentUser && <div className="h-10 w-px bg-gray-200 ml-5 hidden md:block"></div>} 
        </div>

        {/* НАВІГАЦІЙНЕ МЕНЮ */}
        {currentUser ? (
          <nav className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6 my-3 md:my-0">
            <Link to="/" className={getLinkClass('/')}>
              Керування та перегляд фінансів
            </Link>
            <Link to="/accounts" className={getLinkClass('/accounts')}>
              Банківські рахунки
            </Link>
            <Link to="/settings" className={getLinkClass('/settings')}>
              Налаштування
            </Link>
          </nav>
        ) : (
          <div className="hidden md:block grow"></div>
        )}

        {/* ЧАСТИНА Аватарки та кнопка Вхід/Вихід */}
        <div className="flex items-center justify-center gap-4 md:gap-6 md:mr-8 w-full md:w-auto border-t border-gray-100 md:border-none pt-3 md:pt-0">
          <div className="w-12 h-12 rounded-full bg-stone-200 border border-brand-stroke/20 overflow-hidden flex items-center justify-center text-lg font-bold text-gray-700 shrink-0 select-none">
            {userLetter || '👤'} 
          </div>
          {/* Рендеринг кнопки Вхід або Вихід */}
          {!currentUser ? (
            <Link to="/auth" className="bg-brand-primary text-black font-bold text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 rounded-full shadow-md hover:brightness-105 transition duration-300 text-center w-full md:w-auto">
              Вхід
            </Link>
          ) : (
            <button onClick={logout} className="bg-brand-primary text-black font-bold text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 rounded-full shadow-md hover:brightness-105 transition duration-300 text-center w-full md:w-auto">
              Вийти
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;