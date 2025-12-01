document.addEventListener("DOMContentLoaded", async () => {
  const widget = document.getElementById("currencyWidget");
  if (!widget) return;

  async function updateCurrencyWidget() {
    widget.innerHTML = '<span class="currency-loading">Загрузка курсов...</span>';
    widget.classList.add('loading');

    try {
      if (typeof fx === "undefined") throw new Error("money.js не загружен");
      const response = await fetch("https://www.cbr-xml-daily.ru/latest.js");
      if (!response.ok) throw new Error("Ошибка при загрузке данных");

      const data = await response.json();
      fx.rates = data.rates;
      fx.base = data.base;

      const cnyToRub = (1 / fx.rates.CNY).toFixed(2);
      const jpyToRub = (1 / fx.rates.JPY).toFixed(2);
      const krwToRub = (1 / fx.rates.KRW).toFixed(4);

      widget.innerHTML = `<strong>CNY:</strong> ${cnyToRub} ₽ &nbsp; | &nbsp;<strong>JPY:</strong> ${jpyToRub} ₽ &nbsp; | &nbsp;<strong>KRW:</strong> ${krwToRub} ₽`;
      
    } catch (error) {
      widget.innerHTML = '<span class="currency-loading">Курсы недоступны</span>';
    } finally {
      widget.classList.remove('loading');
    }
  }

  await updateCurrencyWidget();
  setInterval(updateCurrencyWidget, 10 * 60 * 1000);
});