import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_KEY as string);

export const createCustomer = async (name: string, email: string) => {
    return stripe.customers.create({
        name,
        email,
    });
};
