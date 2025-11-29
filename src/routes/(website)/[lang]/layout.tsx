import { component$, Slot } from "@builder.io/qwik";
import { Nav } from "~/components/nav/nav";
import { routeLoader$ } from "@builder.io/qwik-city";

export const useCurrencyData = routeLoader$(async (requestEvent) => {
  requestEvent.cacheControl({
    maxAge: 60,
    sMaxAge: 3600,
    staleWhileRevalidate: 60 * 60 * 24 * 4, // 4 days
  });

  const currencies = [
    { code: "CNY", symbol: "¥" },
    { code: "EUR", symbol: "€" },
    { code: "GBP", symbol: "£" },
    { code: "MVR", symbol: "ރ" },
    { code: "RUB", symbol: "₽" },
    { code: "USD", symbol: "$" },
  ];

  return {
    data: currencies,
    success: true,
  };
});

export default component$(() => {
  return (
    <Nav>
      <Slot />
    </Nav>
  );
});
