/* global Chart */ // Declare Chart as global for Chart.js

// Sample chart data
const chartData = {
    'EURUSD': [
        { time: '2025-08-28', open: 1.0860, high: 1.0865, low: 1.0840, close: 1.0855 },
        { time: '2025-08-29', open: 1.0855, high: 1.0875, low: 1.0850, close: 1.0870 },
        { time: '2025-08-30', open: 1.0870, high: 1.0895, low: 1.0865, close: 1.0872 },
    ],
    'GBPJPY': [
        { time: '2025-08-28', open: 180.30, high: 180.60, low: 180.10, close: 180.45 },
        { time: '2025-08-29', open: 180.45, high: 180.70, low: 180.20, close: 180.50 },
        { time: '2025-08-30', open: 180.50, high: 180.80, low: 180.30, close: 180.45 },
    ],
    'USDJPY': [
        { time: '2025-08-28', open: 148.80, high: 149.00, low: 148.60, close: 148.91 },
        { time: '2025-08-29', open: 148.91, high: 149.10, low: 148.70, close: 148.95 },
        { time: '2025-08-30', open: 148.95, high: 149.20, low: 148.80, close: 148.91 },
    ]
};

// Initialize Chart.js
const ctx = document.getElementById('analysisChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'candlestick',
    data: {
        datasets: [{
            label: 'Candlestick',
            data: chartData['EURUSD'].map(d => ({
                x: new Date(d.time).getTime(),
                o: d.open,
                h: d.high,
                l: d.low,
                c: d.close
            })),
            borderColor: '#000000',
            color: { up: '#26a69a', down: '#ef5350' }
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            x: { type: 'time', time: { unit: 'day' }, title: { display: true, text: 'Date' } },
            y: { title: { display: true, text: 'Price' }, beginAtZero: false },
            rsi: { display: false, position: 'right', min: 0, max: 100, title: { display: true, text: 'RSI' } }
        }
    }
});

// Indicator calculations
function calculateSMA(data, period = 14) {
    const sma = [];
    for (let i = period - 1; i < data.length; i++) {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
        sma.push({ x: new Date(data[i].time).getTime(), y: sum / period });
    }
    return sma;
}

function calculateRSI(data, period = 14) {
    const rsi = [];
    let avgGain = 0, avgLoss = 0;
    for (let i = 1; i < data.length; i++) {
        const change = data[i].close - data[i - 1].close;
        const gain = change > 0 ? change : 0;
        const loss = change < 0 ? -change : 0;
        if (i <= period) {
            avgGain += gain / period;
            avgLoss += loss / period;
        } else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            const rs = avgGain / (avgLoss || 1);
            const rsiValue = 100 - (100 / (1 + rs));
            rsi.push({ x: new Date(data[i].time).getTime(), y: rsiValue });
        }
    }
    return rsi;
}

function calculateMACD(data, shortPeriod = 12, longPeriod = 26, signalPeriod = 9) {
    const emaShort = calculateEMA(data, shortPeriod);
    const emaLong = calculateEMA(data, longPeriod);
    const macd = emaShort.map((short, i) => ({
        x: short.x,
        y: short.y - (emaLong[i]?.y || 0)
    }));
    const signal = calculateEMA(macd.map(d => ({ time: new Date(d.x).toISOString().split('T')[0], close: d.y })), signalPeriod);
    return { macd, signal };
}

function calculateEMA(data, period) {
    const ema = [];
    const multiplier = 2 / (period + 1);
    let prevEma = data[0].close;
    ema.push({ x: new Date(data[0].time).getTime(), y: prevEma });
    for (let i = 1; i < data.length; i++) {
        const currentEma = (data[i].close - prevEma) * multiplier + prevEma;
        ema.push({ x: new Date(data[i].time).getTime(), y: currentEma });
        prevEma = currentEma;
    }
    return ema;
}

// Update chart based on filters
function updateChart() {
    const asset = document.getElementById('assetFilter').value;
    const dateRange = document.getElementById('dateRangeFilter').value;
    const data = chartData[asset].slice(); // Copy data for selected asset

    // Filter by date range (simulated)
    const now = new Date('2025-08-30').getTime();
    const ranges = { '24h': 24 * 60 * 60 * 1000, '7d': 7 * 24 * 60 * 60 * 1000, '30d': 30 * 24 * 60 * 60 * 1000 };
    const filteredData = data.filter(d => now - new Date(d.time).getTime() <= ranges[dateRange]);

    const datasets = [{
        label: 'Candlestick',
        type: 'candlestick',
        data: filteredData.map(d => ({
            x: new Date(d.time).getTime(),
            o: d.open,
            h: d.high,
            l: d.low,
            c: d.close
        })),
        borderColor: '#000000',
        color: { up: '#26a69a', down: '#ef5350' }
    }];

    if (document.getElementById('sma').checked) {
        datasets.push({
            label: 'SMA',
            type: 'line',
            data: calculateSMA(filteredData),
            borderColor: '#2962FF',
            fill: false,
            pointRadius: 0
        });
    }

    if (document.getElementById('rsi').checked) {
        datasets.push({
            label: 'RSI',
            type: 'line',
            data: calculateRSI(filteredData),
            borderColor: '#E91E63',
            fill: false,
            pointRadius: 0,
            yAxisID: 'rsi'
        });
    }

    if (document.getElementById('macd').checked) {
        const { macd, signal } = calculateMACD(filteredData);
        datasets.push(
            {
                label: 'MACD',
                type: 'line',
                data: macd,
                borderColor: '#FF6D00',
                fill: false,
                pointRadius: 0
            },
            {
                label: 'Signal',
                type: 'line',
                data: signal,
                borderColor: '#00BCD4',
                fill: false,
                pointRadius: 0
            }
        );
    }

    chart.data.datasets = datasets;
    chart.options.scales = {
        x: { type: 'time', time: { unit: dateRange === '24h' ? 'hour' : 'day' }, title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Price' }, beginAtZero: false },
        rsi: document.getElementById('rsi').checked ? { display: true, position: 'right', min: 0, max: 100, title: { display: true, text: 'RSI' } } : { display: false }
    };
    chart.update();
}

// Event listeners
document.getElementById('assetFilter').addEventListener('change', updateChart);
document.getElementById('dateRangeFilter').addEventListener('change', updateChart);
document.getElementById('sma').addEventListener('change', updateChart);
document.getElementById('rsi').addEventListener('change', updateChart);
document.getElementById('macd').addEventListener('change', updateChart);

// Export to CSV
document.getElementById('exportCsv').addEventListener('click', () => {
    const asset = document.getElementById('assetFilter').value;
    const data = chartData[asset];
    const csv = ['Date,Open,High,Low,Close', ...data.map(d => `${d.time},${d.open},${d.high},${d.low},${d.close}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${asset}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
});

// Commented WebSocket code for future implementation

let ws;
function connectWebSocket(symbol) {
    if (ws) ws.close();
    ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_1m`);
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        const kline = data.k;
        if (kline.x) { // Closed kline
            const newCandle = {
                time: new Date(kline.t).toISOString().split('T')[0],
                open: parseFloat(kline.o),
                high: parseFloat(kline.h),
                low: parseFloat(kline.l),
                close: parseFloat(kline.c)
            };
            chartData[symbol].push(newCandle);
            updateChart();

            // Update metrics table
            const tbody = document.getElementById('metricsTable');
            const row = tbody.querySelector(`tr:nth-child(${[...tbody.children].findIndex(r => r.children[0].textContent === symbol.replace('JPY', '/JPY')) + 1})`);
            if (row) {
                row.children[1].textContent = newCandle.close.toFixed(2);
                const change = ((newCandle.close - chartData[symbol][chartData[symbol].length - 2].close) / chartData[symbol][chartData[symbol].length - 2].close * 100).toFixed(2);
                row.children[3].textContent = `${change}%`;
                row.children[3].className = change >= 0 ? 'positive' : 'negative';
            }
        }
    };
    ws.onerror = (error) => console.error('WebSocket error:', error);
    ws.onclose = () => console.log('WebSocket closed');
}

// Initial WebSocket connection
connectWebSocket('EURUSD');


// Update dateTime in footer
function updateDateTime() {
    const now = new Date();
    document.getElementById('dateTime').textContent = now.toLocaleString();
}
setInterval(updateDateTime, 1000);
updateDateTime();

// Initial chart render
updateChart();