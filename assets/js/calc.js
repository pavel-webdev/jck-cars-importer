document.addEventListener('DOMContentLoaded', () => {
  const chooseJapan = document.getElementById('chooseJapan');
  const chooseChina = document.getElementById('chooseChina');
  const calcArea = document.getElementById('calcArea');
  const calcTitle = document.getElementById('calcTitle');
  const calcH = document.getElementById('calcH');
  const form = document.getElementById('calcForm');
  const btnCalc = document.getElementById('btnCalculate');
  const btnReset = document.getElementById('btnReset');
  const resultBlock = document.getElementById('resultBlock');
  const resultTable = document.getElementById('resultTable');
  const totalText = document.getElementById('totalText');
  const inputPrice = document.getElementById('inputPrice');
  const inputYear = document.getElementById('inputYear');
  const inputEngine = document.getElementById('inputEngine');
  const inputHorsepower = document.getElementById('inputHorsepower');

  let activeCalc = null;

  const JAPAN_PORT = 60000;
  const JAPAN_FREIGHT = 70000;
  const CHINA_DELIV = 14000;
  const FIX_CUSTOMS_DOC = 5000;
  const FIX_BROKER_SVCH = 65000;
  const FIX_NOTARY = 500;
  const FIX_YEN_CONV = 20000;
  const FIX_COMMISSION_JP = 60000;
  const FIX_BROKER_CH = 85000;
  const FIX_YUAN_CONV = 20000;
  const FIX_COMMISSION_CH = 75000;

// Таблица утилизационного сбора для объема 1-2 л и 2-3 л
const UTILIZATION_FEES = {
    // Объем 1-2 л
    "1-2л_160-190": { under3_2025: 750000, over3_2025: 1244000, under3_2026: 900000, over3_2026: 1492000 },
    "1-2л_до_220": { under3_2025: 794000, over3_2025: 1320000, under3_2026: 952800, over3_2026: 1584000 },
    "1-2л_до_250": { under3_2025: 842000, over3_2025: 1398000, under3_2026: 1010400, over3_2026: 1677600 },
    "1-2л_до_280": { under3_2025: 952000, over3_2025: 1532000, under3_2026: 1142000, over3_2026: 1828000 },
    "1-2л_до_310": { under3_2025: 1076000, over3_2025: 1676000, under3_2026: 1291200, over3_2026: 2011200 },
    "1-2л_до_340": { under3_2025: 1216000, over3_2025: 1836000, under3_2026: 1459200, over3_2026: 2203200 },
    
    // Объем 2-3 л
    "2-3л_160-190": { under3_2025: 1922200, over3_2025: 2880000, under3_2026: 2306800, over3_2026: 3456000 },
    "2-3л_до_220": { under3_2025: 1970000, over3_2025: 2940000, under3_2026: 2364000, over3_2026: 3501600 },
    "2-3л_до_250": { under3_2025: 2002000, over3_2025: 2960000, under3_2026: 2402400, over3_2026: 3552000 },
    "2-3л_до_280": { under3_2025: 2120000, over3_2025: 3050000, under3_2026: 2520000, over3_2026: 3660000 },
    "2-3л_до_310": { under3_2025: 2184000, over3_2025: 3120000, under3_2026: 2620800, over3_2026: 3744000 },
    "2-3л_до_340": { under3_2025: 2272000, over3_2025: 3228000, under3_2026: 2726400, over3_2026: 3873200 },
    "2-3л_до_370": { under3_2025: 2362000, over3_2025: 3318000, under3_2026: 2834400, over3_2026: 3981600 },
    "2-3л_до_400": { under3_2025: 2452000, over3_2025: 3412000, under3_2026: 2945600, over3_2026: 4094000 },
    "2-3л_свыше_500": { under3_2025: 2874000, over3_2025: 3810000, under3_2026: 3448800, over3_2026: 4572000 }
};

  // Функция для определения утилизационного сбора
function getUtilizationFee(horsepower, ageYears, engineCC) {
    const hp = Number(horsepower) || 0;
    const age = Number(ageYears) || 0;
    const cc = Number(engineCC) || 0;
    
    // Для личного использования (до 160 л.с.) - фиксированные ставки для любого объема
    if (hp <= 160) {
        return {
            fee2025: age <= 3 ? 3400 : 5200,
            fee2026: age <= 3 ? 3400 : 5200,
            description: "До 160 л.с. для личного использования"
        };
    }
    
    // Определяем объемную группу
    const volumeGroup = cc <= 2000 ? "1-2л" : "2-3л";
    
    // Определяем диапазон мощности
    let powerRange = "";
    if (hp > 160 && hp <= 190) powerRange = "160-190";
    else if (hp > 190 && hp <= 220) powerRange = "до_220";
    else if (hp > 220 && hp <= 250) powerRange = "до_250";
    else if (hp > 250 && hp <= 280) powerRange = "до_280";
    else if (hp > 280 && hp <= 310) powerRange = "до_310";
    else if (hp > 310 && hp <= 340) powerRange = "до_340";
    else if (volumeGroup === "2-3л" && hp > 340 && hp <= 370) powerRange = "до_370";
    else if (volumeGroup === "2-3л" && hp > 370 && hp <= 400) powerRange = "до_400";
    else if (volumeGroup === "2-3л" && hp > 400) powerRange = "свыше_500";
    else {
        // Если мощность больше доступных диапазонов - используем максимальную ставку для объема
        powerRange = volumeGroup === "1-2л" ? "до_340" : "свыше_500";
    }
    
    const feeKey = `${volumeGroup}_${powerRange}`;
    const fees = UTILIZATION_FEES[feeKey];
    
    if (!fees) {
        // Fallback - используем ставки для личного использования
        return {
            fee2025: age <= 3 ? 3400 : 5200,
            fee2026: age <= 3 ? 3400 : 5200,
            description: "До 160 л.с. для личного использования"
        };
    }
    
    return {
        fee2025: age <= 3 ? fees.under3_2025 : fees.over3_2025,
        fee2026: age <= 3 ? fees.under3_2026 : fees.over3_2026,
        description: `Мощность ${hp} л.с. (${powerRange.replace(/_/g, ' ')}) • Объем ${volumeGroup.replace('л', ' л')}`
    };
}

  function fmt(value, currency, digits = 2) {
    if (isNaN(value) || value === null) value = 0;
    value = Number(value);

    if (currency === 'RUB')
      return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: digits }).format(value);
    if (currency === 'JPY')
      return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(value);
    if (currency === 'CNY')
      return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 2 }).format(value);

    return Number(value).toFixed(digits);
  }

  function convertToRUB(amount, fromCode) {
    try {
      if (typeof fx === 'undefined' || !fx.rates) return null;
      return Number(fx(amount).from(fromCode).to('RUB').toFixed(2));
    } catch (e) {
      return null;
    }
  }

  function convertToEUR(amount, fromCode) {
    try {
      if (typeof fx === 'undefined' || !fx.rates) return null;
      return Number(fx(amount).from(fromCode).to('EUR').toFixed(2));
    } catch (e) {
      return null;
    }
  }

  function engineToCC(engineValue) {
    return Number(engineValue) || 0;
  }

  function resetCards() {
    chooseJapan.classList.remove('active');
    chooseChina.classList.remove('active');
  }

  function showCalc(kind) {
    activeCalc = kind;
    calcArea.classList.add('show');
    calcArea.setAttribute('aria-hidden', 'false');
    resultBlock.style.display = 'none';
    form.reset();
    resetCards();

    if (kind === 'JP') chooseJapan.classList.add('active');
    else chooseChina.classList.add('active');

    if (kind === 'JP') {
      calcTitle.textContent = 'Калькулятор — Япония';
      calcH.textContent = 'Японский калькулятор';
      inputPrice.placeholder = 'Цена на рынке (JPY)';
    } else {
      calcTitle.textContent = 'Калькулятор — Китай';
      calcH.textContent = 'Китайский калькулятор';
      inputPrice.placeholder = 'Цена на рынке (CNY)';
    }

    inputPrice.value = '';
    setTimeout(() => window.scrollTo({ top: calcArea.offsetTop - 20, behavior: 'smooth' }), 80);
  }

  chooseJapan.addEventListener('click', () => showCalc('JP'));
  chooseChina.addEventListener('click', () => showCalc('CN'));

  btnReset.addEventListener('click', () => {
    form.reset();
    resultBlock.style.display = 'none';
    calcArea.classList.remove('show');
    calcArea.setAttribute('aria-hidden', 'true');
    resetCards();
    totalText.innerHTML = 'Итого: —';
  });

  function validateInputs(inputs) {
    if (inputs.price === '' || inputs.year === '' || inputs.engine === '' || inputs.horsepower === '') {
      alert('Пожалуйста заполните: цена, год выпуска, объем двигателя и мощность двигателя.');
      return false;
    }
    const fields = ['price','year','engine','horsepower'];
    for (const f of fields) {
      if (inputs[f] !== '' && !isNaN(Number(inputs[f])) && Number(inputs[f]) < 0) {
        alert('Некорректное значение (отрицательное): ' + f);
        return false;
      }
    }
    return true;
  }

  function getDutyRatePerCm3(engineCC, ageYears, priceEUR = null) {
    const cc = Number(engineCC) || 0;
    const age = Number(ageYears) || 0;
    const price = Number(priceEUR) || 0;
    
    // Для автомобилей до 3 лет
    if (age <= 3) {
        // Рассчитываем пошлину как процент от стоимости
        let percentageRate = 0;
        if (price <= 8500) {
            percentageRate = 0.54; // 54%
        } else if (price > 8500 && price <= 16700) {
            percentageRate = 0.48; // 48%
        } else if (price > 16700 && price <= 42300) {
            percentageRate = 0.48; // 48%
        } else if (price > 42300 && price <= 84500) {
            percentageRate = 0.48; // 48%
        } else if (price > 84500 && price <= 169000) {
            percentageRate = 0.48; // 48%
        } else if (price > 169000) {
            percentageRate = 0.48; // 48%
        }
        
        // Рассчитываем пошлину по проценту
        const dutyByPercentage = price * percentageRate;
        
        // Рассчитываем минимальную пошлину за см³
        let minRatePerCC = 0;
        if (price <= 8500) {
            minRatePerCC = 2.5;
        } else if (price > 8500 && price <= 16700) {
            minRatePerCC = 3.5;
        } else if (price > 16700 && price <= 42300) {
            minRatePerCC = 5.5;
        } else if (price > 42300 && price <= 84500) {
            minRatePerCC = 7.5;
        } else if (price > 84500 && price <= 169000) {
            minRatePerCC = 15;
        } else if (price > 169000) {
            minRatePerCC = 20;
        }
        
        const dutyByCC = minRatePerCC * cc;
        
        // Берем максимальное значение из двух расчетов
        const finalDuty = Math.max(dutyByPercentage, dutyByCC);
        
        // Возвращаем ставку за см³ (округляем до 2 знаков)
        return +(finalDuty / cc).toFixed(2);
    }
    
    // Для автомобилей 3-5 лет
    if (age >= 3 && age <= 5) {
      if (cc <= 1000) return 1.5;
      if (cc > 1000 && cc <= 1500) return 1.7;
      if (cc > 1500 && cc <= 1800) return 2.5;
      if (cc > 1800 && cc <= 2300) return 2.7;
      if (cc > 2300 && cc <= 3000) return 3.0;
      if (cc > 3000) return 3.6;
    }
    
    // Для автомобилей старше 5 лет
    if (age > 5) {
      if (cc <= 1000) return 3.0;
      if (cc > 1000 && cc <= 1500) return 3.2;
      if (cc > 1500 && cc <= 1800) return 3.5;
      if (cc > 1800 && cc <= 2300) return 4.8;
      if (cc > 2300 && cc <= 3000) return 5.0;
      if (cc > 3000) return 5.7;
    }
    
    return 0;
  }

 function getAdditionalJapanFeeJPY(priceJPY) {
    const p = Number(priceJPY) || 0;
    if (p >= 1000000 && p <= 1999999) return 20000;
    if (p >= 2000000 && p <= 2999999) return 30000;
    return 0;
}

 function calcJapan(inputs) {
    const price = Number(inputs.price) || 0;
    const year = Number(inputs.year) || new Date().getFullYear();
    const engineCC = engineToCC(inputs.engine);
    const horsepower = Number(inputs.horsepower) || 0;
    const age = new Date().getFullYear() - year;
    
    // Конвертируем цену в евро для расчета пошлины
    const priceEUR = convertToEUR(price, 'JPY');
    
    // Получаем утилизационный сбор для двух периодов (передаем engineCC)
    const utilizationFees = getUtilizationFee(horsepower, age, engineCC);
    
    // Получаем дополнительную комиссию Японии
    const additionalJapanFee = getAdditionalJapanFeeJPY(price);
    
    const totalJapanBefore = price + JAPAN_PORT + JAPAN_FREIGHT;
    const dutyPerEuro = getDutyRatePerCm3(engineCC, age, priceEUR);
    const dutyEUR = +(dutyPerEuro * engineCC).toFixed(2);
    const dutyRUB = convertToRUB(dutyEUR, 'EUR');
    const totalJapanBeforeRUB = convertToRUB(totalJapanBefore, 'JPY');
    
    let totalWithoutCommissionRUB_2025 = null;
    let totalWithoutCommissionRUB_2026 = null;
    
    if (totalJapanBeforeRUB !== null && dutyRUB !== null) {
      totalWithoutCommissionRUB_2025 = +(totalJapanBeforeRUB + dutyRUB + utilizationFees.fee2025 + FIX_CUSTOMS_DOC + FIX_BROKER_SVCH + FIX_NOTARY + FIX_YEN_CONV + additionalJapanFee).toFixed(2);
      totalWithoutCommissionRUB_2026 = +(totalJapanBeforeRUB + dutyRUB + utilizationFees.fee2026 + FIX_CUSTOMS_DOC + FIX_BROKER_SVCH + FIX_NOTARY + FIX_YEN_CONV + additionalJapanFee).toFixed(2);
    }
    
    const commissionRUB = FIX_COMMISSION_JP;
    const finalTotalWithCommissionRUB_2025 = totalWithoutCommissionRUB_2025 !== null && commissionRUB !== null ? +(totalWithoutCommissionRUB_2025 + commissionRUB).toFixed(2) : null;
    const finalTotalWithCommissionRUB_2026 = totalWithoutCommissionRUB_2026 !== null && commissionRUB !== null ? +(totalWithoutCommissionRUB_2026 + commissionRUB).toFixed(2) : null;

    const breakdown = {
      'Цена машины на аукционе (JPY)': price,
      'Объем ДВС (куб.см)': engineCC,
      'Мощность двигателя (л.с.)': horsepower,
      'Доставка — порт (JPY)': JAPAN_PORT,
      'Фрахт (JPY)': JAPAN_FREIGHT,
      'ИТОГО (Япония + фрахт) (JPY)': totalJapanBefore,
      ['Пошлина (EUR) — ставка ' + dutyPerEuro + '€/куб.см']: dutyEUR,
      'Ут. сбор 2025 (RUB)': utilizationFees.fee2025,
      'Ут. сбор 2026 (RUB)': utilizationFees.fee2026,
      'Таможенное оформление (RUB)': FIX_CUSTOMS_DOC,
      'Услуги брокера + СВХ (RUB)': FIX_BROKER_SVCH,
      'Завер. у нотариуса (RUB)': FIX_NOTARY,
      'Комиссия за перевод валюты (RUB)': FIX_YEN_CONV,
      'Доп. комиссия Японии (RUB)': additionalJapanFee,
      'Цена без комиссии 2025 (RUB)': totalWithoutCommissionRUB_2025,
      'Цена без комиссии 2026 (RUB)': totalWithoutCommissionRUB_2026,
      'Комиссия компании (RUB)': FIX_COMMISSION_JP,
      'Цена с комиссией 2025 (RUB)': finalTotalWithCommissionRUB_2025,
      'Цена с комиссией 2026 (RUB)': finalTotalWithCommissionRUB_2026
    };

    return {
      breakdown,
      meta: {
        totalJapanBefore,
        totalJapanBeforeRUB,
        dutyEUR,
        dutyRUB,
        totalWithoutCommissionRUB_2025,
        totalWithoutCommissionRUB_2026,
        commissionRUB,
        finalTotalWithCommissionRUB_2025,
        finalTotalWithCommissionRUB_2026,
        utilizationFees,
        additionalJapanFee
      }
    };
}

function calcChina(inputs) {
    const price = Number(inputs.price) || 0;
    const year = Number(inputs.year) || new Date().getFullYear();
    const engineCC = engineToCC(inputs.engine);
    const horsepower = Number(inputs.horsepower) || 0;
    const age = new Date().getFullYear() - year;
    
    // Конвертируем цену в евро для расчета пошлины
    const priceEUR = convertToEUR(price, 'CNY');
    
    // Получаем утилизационный сбор для двух периодов (передаем engineCC)
    const utilizationFees = getUtilizationFee(horsepower, age, engineCC);
    
    const totalChinaBefore = price + CHINA_DELIV;
    const dutyPerEuro = getDutyRatePerCm3(engineCC, age, priceEUR);
    const dutyEUR = +(dutyPerEuro * engineCC).toFixed(2);
    const dutyRUB = convertToRUB(dutyEUR, 'EUR');
    const totalChinaBeforeRUB = convertToRUB(totalChinaBefore, 'CNY');

    
    let totalWithoutCommissionRUB_2025 = null;
    let totalWithoutCommissionRUB_2026 = null;
    
    if (totalChinaBeforeRUB !== null && dutyRUB !== null) {
      totalWithoutCommissionRUB_2025 = +(totalChinaBeforeRUB + dutyRUB + utilizationFees.fee2025 + FIX_CUSTOMS_DOC + FIX_BROKER_CH + FIX_NOTARY + FIX_YUAN_CONV).toFixed(2);
      totalWithoutCommissionRUB_2026 = +(totalChinaBeforeRUB + dutyRUB + utilizationFees.fee2026 + FIX_CUSTOMS_DOC + FIX_BROKER_CH + FIX_NOTARY + FIX_YUAN_CONV).toFixed(2);
    }
    
    const commissionRUB = FIX_COMMISSION_CH;
    const finalTotalWithCommissionRUB_2025 = totalWithoutCommissionRUB_2025 !== null && commissionRUB !== null ? +(totalWithoutCommissionRUB_2025 + commissionRUB).toFixed(2) : null;
    const finalTotalWithCommissionRUB_2026 = totalWithoutCommissionRUB_2026 !== null && commissionRUB !== null ? +(totalWithoutCommissionRUB_2026 + commissionRUB).toFixed(2) : null;

    const breakdown = {
      'Цена машины на аукционе (CNY)': price,
      'Объем ДВС (куб.см)': engineCC,
      'Мощность двигателя (л.с.)': horsepower,
      'Доставка и расходы по Китаю (CNY)': CHINA_DELIV,
      'ИТОГО (Китай + доставка) (CNY)': totalChinaBefore,
      ['Пошлина (EUR) — ставка ' + dutyPerEuro + '€/куб.см']: dutyEUR,
      'Ут. сбор 2025 (RUB)': utilizationFees.fee2025,
      'Ут. сбор 2026 (RUB)': utilizationFees.fee2026,
      'Таможенное оформление (RUB)': FIX_CUSTOMS_DOC,
      'Услуги брокера + СВХ (RUB)': FIX_BROKER_CH,
      'Завер. у нотариуса (RUB)': FIX_NOTARY,
      'Комиссия за перевод валюты (RUB)': FIX_YUAN_CONV, // Теперь в рублях
      'Цена без комиссии 2025 (RUB)': totalWithoutCommissionRUB_2025,
      'Цена без комиссии 2026 (RUB)': totalWithoutCommissionRUB_2026,
      'Комиссия компании (RUB)': FIX_COMMISSION_CH,
      'Цена с комиссией 2025 (RUB)': finalTotalWithCommissionRUB_2025,
      'Цена с комиссией 2026 (RUB)': finalTotalWithCommissionRUB_2026
    };


    return {
      breakdown,
      meta: {
        totalChinaBefore,
        totalChinaBeforeRUB,
        dutyEUR,
        dutyRUB,
        totalWithoutCommissionRUB_2025,
        totalWithoutCommissionRUB_2026,
        commissionRUB,
        finalTotalWithCommissionRUB_2025,
        finalTotalWithCommissionRUB_2026,
        utilizationFees
      }
    };
}

async function renderResult(calcResult, localCode) {
    resultTable.innerHTML = '';
    const rows = [];

    for (const k of Object.keys(calcResult.breakdown)) {
        let v = calcResult.breakdown[k];
        let show = '';

        if (k.includes('куб.см') && !k.toLowerCase().includes('пошлина')) {
            show = v + ' см³';
        }
        else if (k.includes('л.с.')) {
            show = v + ' л.с.';
        }
        else if (typeof v === 'number') {
            if (k.includes('(JPY)')) {
                const rub = convertToRUB(v, 'JPY');
                const rubTxt = rub !== null ? fmt(rub, 'RUB') : '-';
                show = `${fmt(v,'JPY')} <br><span class="rub-twin">или ${rubTxt}</span>`;
            }
            else if (k.includes('Доп. комиссия Японии')) {
                // Дополнительная комиссия Японии в рублях
                show = fmt(v, 'RUB');
            }
            else if (k.includes('(CNY)')) {
                const rub = convertToRUB(v, 'CNY');
                const rubTxt = rub !== null ? fmt(rub, 'RUB') : '-';
                show = `${fmt(v,'CNY')} <br><span class="rub-twin">или ${rubTxt}</span>`;
            }
            else if (k.includes('(EUR)') || k.toLowerCase().includes('пошлина')) {
                const rub = convertToRUB(v, 'EUR');
                const rubTxt = rub !== null ? fmt(rub, 'RUB') : '-';
                show = `${v} EUR <br><span class="rub-twin">или ${rubTxt}</span>`;
            }
            else if (k.includes('комиссия за перевод валюты')) {
                // Комиссия за перевод валюты теперь всегда в рублях
                show = fmt(v, 'RUB');
            }
            else {
                show = fmt(v, 'RUB');
            }
        } else {
            show = String(v || '-');
        }

        rows.push(`<tr><td>${k}</td><td>${show}</td></tr>`);
    }

    resultTable.innerHTML = rows.join('');
    
    // Обновляем отображение итоговых цен
    const totalRub2025 = calcResult.meta.finalTotalWithCommissionRUB_2025 ?? calcResult.meta.totalWithoutCommissionRUB_2025;
    const totalRub2026 = calcResult.meta.finalTotalWithCommissionRUB_2026 ?? calcResult.meta.totalWithoutCommissionRUB_2026;
    
    // Находим элемент для итогов
    const totalText = document.getElementById('totalText');
    if (totalText) {
        totalText.innerHTML = `
            <div style="margin-bottom: 10px;">
                <strong class="calc-total">Итог (2025): ${totalRub2025 !== null ? fmt(totalRub2025, 'RUB') : 'курс недоступен'}</strong>
            </div>
            <div>
                <strong class="calc-total">Итог (2026): ${totalRub2026 !== null ? fmt(totalRub2026, 'RUB') : 'курс недоступен'}</strong>
            </div>
        `;
    }
    
    resultBlock.style.display = 'block';
    resultBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

  // ОБРАБОТЧИК КНОПКИ РАСЧЕТА - ДОЛЖЕН БЫТЬ ПОСЛЕ ВСЕХ ФУНКЦИЙ
  btnCalc.addEventListener('click', async () => {
    if (!activeCalc) {
      alert('Выберите калькулятор (Япония или Китай)');
      return;
    }

    const inputs = {
      price: inputPrice.value.trim(),
      year: inputYear.value.trim(),
      engine: inputEngine.value.trim(),
      horsepower: inputHorsepower.value.trim()
    };

    if (!validateInputs(inputs)) return;

    btnCalc.disabled = true;
    btnCalc.textContent = 'Расчет...';
    btnCalc.classList.add('loading');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const res = activeCalc === 'JP' ? calcJapan(inputs) : calcChina(inputs);
      renderResult(res, activeCalc);
    } catch (error) {
      alert('Произошла ошибка при расчете. Попробуйте еще раз.');
    } finally {
      btnCalc.disabled = false;
      btnCalc.textContent = 'Рассчитать';
      btnCalc.classList.remove('loading');
    }
  });
});