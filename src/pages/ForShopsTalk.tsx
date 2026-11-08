import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MessagesSquare, Mic } from "lucide-react";
import SEO from "@/components/SEO";
import SectionReveal from "@/components/SectionReveal";
import { Button } from "@/components/ui/button";
import ShopTalkChat from "@/components/shop-talk/ShopTalkChat";
import BookingRequestForm from "@/components/shop-talk/BookingRequestForm";
import {
  fetchShopTalkConfig,
  type ShopTalkPublicConfig,
} from "@/lib/shopTalk";
import { getShopVoiceProvider } from "@/lib/voice/shopVoice";
import {
  APPOINTMENT_WINDOWS,
  BOOKING_PENDING_NOTICE,
  DISCLOSURE_GREETING,
} from "../../supabase/functions/_shared/shop-talk-config";

type Rung = "chat" | "book";

const honestyPoints = [
  "The assistant is an AI, and it tells you so in its first sentence.",
  "It can explain the pilot in plain terms and help you book a call.",
  "It cannot change the pilot terms, sign your shop up, or make promises. Those things happen with a person.",
  "It never sees or shares a driver's name, phone number, or VIN.",
  "A person confirms every appointment. A request is not a confirmed time until you hear from us.",
];

/**
 * /for-shops/talk — the inbound page linked from cold-tier outreach
 * (Option B inbound layer, build spec 2026-11-02). Three rungs, the
 * owner's choice: talk (voice; routed to chat in Phase 1), chat, or the
 * booking form with no assistant involved.
 */
export default function ForShopsTalk() {
  const [rung, setRung] = useState<Rung>("chat");
  const [voiceNote, setVoiceNote] = useState(false);
  const [serverConfig, setServerConfig] = useState<ShopTalkPublicConfig | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    setConversationId(crypto.randomUUID());
    let cancelled = false;
    fetchShopTalkConfig()
      .then((cfg) => {
        if (!cancelled) setServerConfig(cfg);
      })
      .catch(() => {
        // Bundled public config values remain as the fallback.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const greeting = serverConfig?.greeting || DISCLOSURE_GREETING;
  const windows =
    serverConfig?.windows && serverConfig.windows.length > 0
      ? serverConfig.windows
      : APPOINTMENT_WINDOWS;
  const pendingNotice = serverConfig?.bookingPendingNotice || BOOKING_PENDING_NOTICE;

  function handleTalkClick() {
    if (getShopVoiceProvider().isAvailable()) {
      // A live voice provider mounts here in a later phase; the page
      // structure does not change when one is adopted.
      setVoiceNote(false);
      setRung("chat");
      return;
    }
    // Phase 1: the voice rung is present but routes to chat (spec).
    setVoiceNote(true);
    setRung("chat");
  }

  return (
    <main className="pb-[60px] md:pb-0">
      <SEO
        title="Questions About the Shop Pilot? Talk, Type, or Book a Call"
        description="Three ways to learn about Wrenchli's referral pilot for independent shops, free for your first five completed referred repairs: talk, type to an assistant, or book a call with a person."
        path="/for-shops/talk"
      />

      {/* Hero */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h1 className="font-heading text-3xl font-extrabold leading-tight md:text-5xl">
              Questions about the shop pilot?
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Get answers three ways. Talk, type, or skip straight to booking
              a short call with a person. The pilot itself is free until
              your shop completes its first five referred repairs; the
              details are on our{" "}
              <Link to="/for-shops" className="underline underline-offset-4">
                shop pilot page
              </Link>
              .
            </p>
          </SectionReveal>

          {/* Rung picker */}
          <SectionReveal delay={80}>
            <div className="mt-8 grid gap-3 sm:grid-cols-3" role="group" aria-label="Choose how to get answers">
              <Button
                type="button"
                size="lg"
                variant="outline"
                className="h-auto flex-col items-start gap-1 px-5 py-4 text-left"
                onClick={handleTalkClick}
              >
                <span className="flex items-center gap-2 font-heading font-bold">
                  <Mic className="h-5 w-5" aria-hidden /> Talk out loud
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  Voice, like a phone call in your browser.
                </span>
              </Button>
              <Button
                type="button"
                size="lg"
                variant={rung === "chat" ? "default" : "outline"}
                className="h-auto flex-col items-start gap-1 px-5 py-4 text-left"
                onClick={() => setRung("chat")}
              >
                <span className="flex items-center gap-2 font-heading font-bold">
                  <MessagesSquare className="h-5 w-5" aria-hidden /> Type your questions
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  The same assistant, in writing.
                </span>
              </Button>
              <Button
                type="button"
                size="lg"
                variant={rung === "book" ? "default" : "outline"}
                className="h-auto flex-col items-start gap-1 px-5 py-4 text-left"
                onClick={() => setRung("book")}
              >
                <span className="flex items-center gap-2 font-heading font-bold">
                  <CalendarClock className="h-5 w-5" aria-hidden /> Book a call
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  No assistant. Just the form.
                </span>
              </Button>
            </div>
          </SectionReveal>
        </div>
      </section>

      {/* Active rung */}
      <section className="section-padding bg-secondary">
        <div className="container-wrenchli max-w-3xl">
          {rung === "chat" && (
            <SectionReveal>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">
                Ask about the pilot
              </h2>
              {voiceNote && (
                <p className="mt-3 rounded-lg bg-background p-4 leading-relaxed" role="note">
                  Voice is not live yet. Typing here works the same way: same
                  assistant, same answers.
                </p>
              )}
              <div className="mt-5">
                <ShopTalkChat
                  greeting={greeting}
                  conversationId={conversationId ?? ""}
                />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Ready to talk to a person instead?{" "}
                <button
                  type="button"
                  className="underline underline-offset-4"
                  onClick={() => setRung("book")}
                >
                  Book a call with the form
                </button>
                .
              </p>
            </SectionReveal>
          )}

          {rung === "book" && (
            <SectionReveal>
              <h2 className="font-heading text-2xl font-bold md:text-3xl">
                Book a call with a person
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Tell us when a call would suit you. A person confirms every
                appointment by email or phone.
              </p>
              <div className="mt-5">
                <BookingRequestForm
                  windows={windows}
                  pendingNotice={pendingNotice}
                  conversationId={conversationId}
                />
              </div>
            </SectionReveal>
          )}
        </div>
      </section>

      {/* Honesty block */}
      <section className="section-padding bg-background">
        <div className="container-wrenchli max-w-3xl">
          <SectionReveal>
            <h2 className="font-heading text-2xl font-bold md:text-4xl">
              What the assistant can and cannot do
            </h2>
            <ul className="mt-6 space-y-3">
              {honestyPoints.map((point) => (
                <li key={point} className="flex gap-3 items-start">
                  <span
                    aria-hidden
                    className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-accent"
                  />
                  <p className="leading-relaxed">{point}</p>
                </li>
              ))}
            </ul>
          </SectionReveal>
        </div>
      </section>
    </main>
  );
}
