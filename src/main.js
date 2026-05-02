/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
    // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;
    const discountValue = 1 - (discount / 100);
    const revenue = sale_price * quantity * discountValue;
    return revenue;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;
    let bonus = 0;
    if (index === 0) {
        bonus = profit * 0.15;
    } else if (index === 1 || index === 2) {
        bonus = profit * 0.10;
    } else if (index < total - 1) {
        bonus = profit * 0.05;
    } else {
        bonus = 0;
    }
    return bonus;
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
    // @TODO: Проверка входных данных
    if (!data
        || !options
    ) {
        throw new Error('Некорректные входные данные');
    }

    // @TODO: Проверка наличия опций
    const { calculateRevenue, calculateBonus } = options; // Сюда передадим функции для расчётов
    if (!calculateRevenue || !calculateBonus || typeof calculateRevenue !== 'function' || typeof calculateBonus !== 'function') {
        throw new Error('Некорректные опции');
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellersStats = data.sellers.map(seler => {
        return {
            id: seler.id,
            first_name: seler.first_name,
            last_name: seler.last_name,
            start_date: seler.start_date,
            position: seler.position,
            revenue: 0,
            profit: 0,
            sales_count: 0,
            products_sold: {},
        };
    });

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = sellersStats.reduce((result, seller) => {
        result[seller.id] = seller;
        return result;
    }, {});
    const productIndex = data.products.reduce((result, product) => {
        result[product.sku] = product;
        return result;
    }, {});

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach(record => { // Чек 
        const seller = sellerIndex[record.seller_id]; // Продавец
        // Увеличить количество продаж 
        seller.sales_count++;
        // Увеличить общую сумму выручки всех продаж
        seller.revenue += record.total_amount;
        // Расчёт прибыли для каждого товара
        record.items.forEach(item => {
            const product = productIndex[item.sku]; // Товар
            // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
            const cost = product.purchase_price * item.quantity;
            // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
            const revenue = calculateSimpleRevenue(item, product);
            // Посчитать прибыль: выручка минус себестоимость
            const profit = revenue - cost;
            // Увеличить общую накопленную прибыль (profit) у продавца  
            seller.profit += profit;
            // Учёт количества проданных товаров
            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            // По артикулу товара увеличить его проданное количество у продавца
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    sellersStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sellersStats.forEach((seller, index) => {
        seller.bonus = calculateBonusByProfit(index, sellersStats.length, seller);
        seller.top_products = Object.entries(seller.products_sold).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([sku, quantity]) => ({ sku, quantity }));
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    const result = sellersStats.map(seller => {
        return {
            id: seller.id,
            name: `${seller.first_name} ${seller.last_name}`,
            revenue: + seller.revenue.toFixed(2),
            profit: + seller.profit.toFixed(2),
            sales_count: seller.sales_count,
            top_products: seller.top_products,
            bonus: + seller.bonus.toFixed(2),
        };
    });
    return result;
}
