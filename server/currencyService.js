import CurrencyRate from './models/Currency.js';

export const updateCurrencyRates = async () => {
  try {
    // отримання курсу валют на поточну дату в форматі JSON
    const response = await fetch('https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json');
    
    if (!response.ok) {
      throw new Error(`Помилка запиту до НБУ: ${response.statusText}`);
    }

    const data = await response.json();

    // Нас цікавлять переважно USD та EUR, але ми можемо зберегти всі або вибрати основні
    const targetCurrencies = ['USD', 'EUR', 'PLN'];

    const filteredData = data.filter(item => targetCurrencies.includes(item.cc));

    // Оновлюємо або створюємо курси в нашій базі даних MongoDB
    for (const currency of filteredData) {
      await CurrencyRate.findOneAndUpdate(
        { code: currency.cc }, // пошук за кодом (напр. 'USD')
        { 
          rate: currency.rate,  // актуальний курс (напр. 40.25)
          updatedAt: new Date() 
        },
        { upsert: true, new: true } // якщо немає — створити (upsert)
      );
    }

    console.log('=== Курси валют від НБУ синхронізовано з БД ===');
    return { success: true };
  } catch (error) {
    console.error('Помилка при оновленні курсів від НБУ:', error.message);
    return { success: false, error: error.message };
  }
};