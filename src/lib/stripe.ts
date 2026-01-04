import { loadStripe } from '@stripe/stripe-js';

// Stripe publishable key - safe to expose in client code
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51SldnjPVLLI2NeFC2PEJwRskGuXHNwmLTSzXuJa7FBztcUpNM97XiWlKhbM7gUGkFCQgFrTzIjoRIWEfKBrtKAhv005mLUQIng';

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
