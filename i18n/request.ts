import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import ar from "../messages/ar.json";
import en from "../messages/en.json";
import { routing } from "./routing";

const messagesByLocale = {
  ar,
  en,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: messagesByLocale[locale],
  };
});
