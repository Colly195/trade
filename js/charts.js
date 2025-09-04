/* global Chart */ // Declare Chart as global for Chart.js

// Initial chart data
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
    ]
};

// Initialize Chart.js
const ctx = document.getElementById('mainChart').getContext('2d');
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

function calculateEMA(data, period = 14) {
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

// Update chart based on asset selection
function updateChart() {
    const asset = document.getElementById('assetChart').value;
    const data = chartData[asset].slice(); // Copy data for selected asset

    const datasets = [{
        label: 'Candlestick',
        type: 'candlestick',
        data: data.map(d => ({
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
            data: calculateSMA(data),
            borderColor: '#2962FF',
            fill: false,
            pointRadius: 0
        });
    }

    if (document.getElementById('ema').checked) {
        datasets.push({
            label: 'EMA',
            type: 'line',
            data: calculateEMA(data),
            borderColor: '#FF6D00',
            fill: false,
            pointRadius: 0
        });
    }

    if (document.getElementById('rsi').checked) {
        datasets.push({
            label: 'RSI',
            type: 'line',
            data: calculateRSI(data),
            borderColor: '#E91E63',
            fill: false,
            pointRadius: 0,
            yAxisID: 'rsi'
        });
    }

    chart.data.datasets = datasets;
    chart.options.scales = {
        x: { type: 'time', time: { unit: 'day' }, title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Price' }, beginAtZero: false },
        rsi: document.getElementById('rsi').checked ? { display: true, position: 'right', min: 0, max: 100, title: { display: true, text: 'RSI' } } : { display: false }
    };
    chart.update();
}

// Event listeners
document.getElementById('assetChart').addEventListener('change', updateChart);
document.getElementById('sma').addEventListener('change', updateChart);
document.getElementById('ema').addEventListener('change', updateChart);
document.getElementById('rsi').addEventListener('change', updateChart);

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
            chart.data.datasets[0].data.push({
                x: new Date(newCandle.time).getTime(),
                o: newCandle.open,
                h: newCandle.high,
                l: newCandle.low,
                c: newCandle.close
            });
            chart.update();

            // Update historical table
            const tbody = document.getElementById('historicalTable');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${newCandle.time}</td>
                <td>${newCandle.open.toFixed(4)}</td>
                <td>${newCandle.high.toFixed(4)}</td>
                <td>${newCandle.low.toFixed(4)}</td>
                <td>${newCandle.close.toFixed(4)}</td>
            `;
            tbody.insertBefore(row, tbody.firstChild);
            if (tbody.children.length > 10) tbody.removeChild(tbody.lastChild);

            updateChart();
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