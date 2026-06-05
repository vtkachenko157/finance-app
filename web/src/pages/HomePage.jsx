import React from 'react';
import Header from '../components/Header';
import Banner from '../assets/Dashboard.png'
import MainPage from './MainPage';

import { useAuth } from '../context/AuthContext';


const HomePage = () => {
  const { currentUser } = useAuth();
  return (
    <div className="min-h-screen bg-neutral-50 antialiased text-black pb-12">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
        {!currentUser ? (
          <img 
            src={Banner} 
            alt="Фінансовий банер" 
            className="w-full h-auto object-contain max-h-[80vh]" 
          />
        ) : (
        <MainPage/>
      )}

      </main>
    </div>
  );
};

export default HomePage;