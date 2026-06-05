import React, {useState} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const AuthPage = () => {

const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [loading, setLoading] = useState(false);
const navigate = useNavigate(); // перекидання юзера на головну після входу
  
const handleAuth = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    // Вхід за signInWithEmailAndPassword
    await signInWithEmailAndPassword(auth, email, password);
    navigate('/'); // в разі успіху перехід на головну сторінку
  } catch (signInError) {
    if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (signUpError) {
        // в разі короткого паролю видача помилки
        setError('Помилка реєстрації: ' + signUpError.message);
      }
    } else {
      setError('Помилка входу: ' + signInError.message);
    }
  } finally {
    setLoading(false);
  }
};


return (
    <div className="min-h-screen bg-neutral-100 flex flex-col p-8">
      {/* Кнопка "На головну" */}
      <Link to="/" className="text-black font-medium flex items-center gap-2 hover:opacity-70 transition mb-20">
        <span className="text-xl">←</span> На головну
      </Link>

      {/* Картка форми */}
      <div className="grow flex items-center justify-center">
        <div className="bg-white p-12 rounded-3xl shadow-lg border border-neutral-200 w-full max-w-md">
          
          <h1 className="text-2xl font-bold text-brand-primary text-center mb-10">
            Форма<br/>авторизації клієнта
          </h1>
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-black mb-2 font-medium">Електронна пошта</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                placeholder="Електронна пошта"
                className="w-full p-4 rounded-xl border border-neutral-300 bg-neutral-100 focus:ring-2 focus:ring-brand-primary outline-none placeholder-gray-400 text-black"
              />
            </div>
            <div>
              <label className="block text-black mb-2 font-medium">Пароль</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                placeholder="Введіть пароль"
                className="w-full p-4 rounded-xl border border-neutral-300 bg-neutral-100 focus:ring-2 focus:ring-brand-primary outline-none placeholder-gray-400 text-black"
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-8 bg-brand-primary text-black font-bold py-4 rounded-xl text-lg hover:brightness-105 transition duration-300"
            >
              Зареєструватися /<br />увійти
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;