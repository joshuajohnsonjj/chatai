import Stripe from 'stripe';

export class StripeService {
    private readonly client: Stripe;

    constructor(key: string) {
        this.client = new Stripe(key);
    }

    public async createCustomer(name: string, email: string) {
        return this.client.customers.create({
            name,
            email,
        });
    }
}
