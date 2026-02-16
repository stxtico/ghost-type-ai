import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  // Do NOT set apiVersion here to avoid TS literal mismatch errors.
});
