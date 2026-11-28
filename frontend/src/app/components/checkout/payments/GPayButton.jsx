import { useEffect, useRef, useState } from "react";
import { Elements, ExpressCheckoutElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useRouter, useSearchParams } from "next/navigation";

async function post(endpoint, session, body) {
     const response = await fetch(`/api/verify/checkout/${endpoint}?session_id=${encodeURIComponent(session)}`, {
          method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
     });
     const data = await response.json();
     if (!response.ok) throw new Error(data.error || "Checkout unavailable.");
     return data;
}

function Wallet({ session, amount }) {
     const stripe = useStripe(), elements = useElements(), router = useRouter();
     const busy = useRef(false);
     const [message, setMessage] = useState("Checking Google Pay availability…");
     const [pending, setPending] = useState(null);
     const key = `gpay:authorized:${session}`;
     useEffect(() => {
          const prior = sessionStorage.getItem(key);
          setPending(prior);
          if (prior) setMessage("Payment authorized. Confirm the order to finish.");
     }, [key]);
     // Stripe emits neither ready nor loaderror if Stripe.js or Elements fails to initialize.
     const [settled, setSettled] = useState(false);
     useEffect(() => {
          if (settled) return;
          const timer = setTimeout(() => setMessage((current) =>
               current === "Checking Google Pay availability…"
                    ? "Google Pay could not load. Disable blockers or choose another payment method." : current), 10000);
          return () => clearTimeout(timer);
     }, [settled]);

     async function finish(id) {
          await post("stripe/payment-status", session, { paymentIntentId: id });
          sessionStorage.removeItem(key);
          router.replace("/dashboard/order");
     }

     async function confirm(event) {
          if (busy.current || !stripe || !elements) return;
          busy.current = true;
          let authorized = false;
          try {
               setMessage("Authorizing…");
               const { error: submitError } = await elements.submit();
               if (submitError) throw submitError;
               const { clientSecret, amount: serverAmount } = await post("create-payment-intent", session, {});
               if (serverAmount !== amount) throw new Error("Price changed. Refresh checkout.");
               // An earlier attempt may already have authorized this checkout.
               const prior = await stripe.retrievePaymentIntent(clientSecret);
               if (prior.error) throw prior.error;
               let intent = prior.paymentIntent;
               if (intent.status !== "requires_capture") {
                    const result = await stripe.confirmPayment({ elements, clientSecret,
                         confirmParams: { return_url: window.location.href }, redirect: "if_required" });
                    if (result.error) throw result.error;
                    intent = result.paymentIntent;
               }
               if (intent?.status !== "requires_capture") throw new Error("Payment not yet authorized.");
               authorized = true;
               setPending(intent.id);
               sessionStorage.setItem(key, intent.id);
               await finish(intent.id);
          } catch (error) {
               if (!authorized) event.paymentFailed?.({ reason: "fail" });
               setMessage(authorized ? "Authorized. Retry order confirmation, not payment." :
                    error.message || "Google Pay unavailable. Try another payment method.");
          } finally { busy.current = false; }
     }

     return <div>
          {!pending && <ExpressCheckoutElement options={{
               paymentMethods: { googlePay: "auto", applePay: "never", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
          }} onReady={({ availablePaymentMethods }) => { setSettled(true); setMessage(availablePaymentMethods?.googlePay ? "" : "Google Pay unavailable here. Choose another payment method."); }}
             onLoadError={() => { setSettled(true); setMessage("Google Pay could not load. Choose another payment method."); }}
             onConfirm={confirm} onCancel={() => setMessage("Payment canceled.")} />}
          {pending && <button type="button" className="text-white underline" onClick={async () => {
               if (busy.current) return;
               busy.current = true;
               try { await finish(pending); } catch (error) { setMessage(error.message); }
               finally { busy.current = false; }
          }}>Retry order confirmation</button>}
          <p role="status" className="text-sm text-white/80">{message}</p>
     </div>;
}

export default function GPayButton({ stripePromise, product }) {
     const session = useSearchParams().get("session_id");
     const amount = Math.round(Number(product.price) * 100);
     if (!session || !Number.isSafeInteger(amount) || amount < 50 || amount > 99999999)
          return <p role="status">Google Pay unavailable for this listing.</p>;
     return <Elements key={`${session}:${amount}`} stripe={stripePromise}
          options={{ mode: "payment", amount, currency: "usd", captureMethod: "manual", allowedPaymentMethodTypes: ["card"] }}>
          <Wallet session={session} amount={amount} />
     </Elements>;
}
