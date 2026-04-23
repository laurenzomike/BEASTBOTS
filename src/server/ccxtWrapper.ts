// Mock CCXT implementation complying with memory guidelines
export class MockCCXT {
    async createOrder(symbol: string, type: string, side: string, amount: number) {
        if (Math.random() < 0.1) {
            throw new Error("ccxt.NetworkError: Connection reset by peer");
        }
        if (Math.random() < 0.05) {
             throw new Error("ccxt.ExchangeError: Insufficient funds");
        }
        return {
            id: 'mock-order-' + Date.now(),
            status: 'closed',
            symbol,
            type,
            side,
            amount
        };
    }
}
