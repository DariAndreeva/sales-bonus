/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  //   _product - параметр зарезервирован для будущего использования
  const { discount, sale_price, quantity } = purchase;
  const discountCoeff = 1 - discount / 100; 

  return sale_price * quantity * discountCoeff;
}

// @TODO: Расчет бонуса от позиции в рейтинге
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  if (index === 0) {
    return seller.profit * 0.15;
  } else if (index === 1 || index === 2) {
    return seller.profit * 0.1;
  } else if (index === total - 1) {
    return 0;
  } else {
    return seller.profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data || !Array.isArray(data.sellers) || data.sellers.length === 0) {
    throw new Error("Некорректные входные данные");
  }

  // @TODO: Проверка наличия опций


  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("Отсутствует обязательный объект: options");
  }

  const { calculateSimpleRevenue, calculateBonusByProfit } = options;
  

  if (!calculateBonusByProfit) {
    throw new Error("Отсутствует обязательная функция: calculateBonusByProfit");
  }

  if (!calculateSimpleRevenue) {
    throw new Error("Отсутствует обязательная функция: calculateSimpleRevenue");
  }

  if (typeof calculateBonusByProfit !== "function") {
    throw new Error("calculateBonusByProfit должна быть функцией");
  }

  if (typeof calculateSimpleRevenue !== "function") {
    throw new Error("calculateSimpleRevenue  должна быть функцией");
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    products_sold: {},
  }));

  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(
    sellerStats.map((seller) => [seller.id, seller]),
  );

  const productIndex = Object.fromEntries(
    (data.products || []).map((product) => [product.sku, product]),
  );

  // @TODO: Расчет выручки и прибыли для каждого продавца
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];
    if (!seller) return;

    seller.sales_count += 1;
    

    record.items.forEach((item) => {
      const product = productIndex[item.sku];
      if (!product) return;

      const cost = product.purchase_price * item.quantity;
      const revenue = calculateSimpleRevenue(item, product);
      const profit = revenue - cost;

      seller.revenue += revenue;
      seller.profit += profit;

      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }
      seller.products_sold[item.sku] += item.quantity;
    });
  });

  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  const total = sellerStats.length;
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, total, seller);
    seller.top_products = 0; // пока заглушка
  });

  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map((seller) => {
    // Формируем топ-10 товаров по количеству продаж
    const topProducts = Object.entries(seller.products_sold)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([sku]) => sku);

    return {
      seller_id: seller.id,
      name: seller.name,
      revenue: +seller.revenue.toFixed(2),
      profit: +seller.profit.toFixed(2),
      sales_count: seller.sales_count,
      top_products: topProducts,
      bonus: +seller.bonus.toFixed(2),
    };
  });
}


