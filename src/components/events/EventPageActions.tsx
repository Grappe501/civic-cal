import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Copy, ExternalLink, QrCode, Share2, Ticket, HandHeart, PlusCircle } from "lucide-react";
import type { CivicEvent } from "../../lib/types";
import { downloadIcs, shareEventUrl } from "../../lib/format";
import { getEventStudentServiceOpportunity } from "../../lib/student-service/studentServiceEngine";

interface Props {
  event: CivicEvent;
  onShare: () => void;
  ticketUrl?: string | null;
}

export function EventPageActions({ event, onShare, ticketUrl }: Props) {
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? shareEventUrl(event) : "";
  const studentOpp = getEventStudentServiceOpportunity(event);
  const official = event.websiteUrl ?? ticketUrl;

  async function copyLink() {
    if (!url) return;
    await navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const qrSrc = url ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}` : "";

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadIcs(event)} className="btn-secondary text-sm">
          <CalendarPlus className="h-4 w-4" /> Add to calendar
        </button>
        <button type="button" onClick={onShare} className="btn-primary text-sm">
          <Share2 className="h-4 w-4" /> Share
        </button>
        <button type="button" onClick={copyLink} className="btn-secondary text-sm">
          <Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy link"}
        </button>
        <button type="button" onClick={() => setQrOpen(true)} className="btn-secondary text-sm">
          <QrCode className="h-4 w-4" /> QR code
        </button>
        {official && (
          <a href={official} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            <ExternalLink className="h-4 w-4" /> Official site
          </a>
        )}
        {ticketUrl && ticketUrl !== official && (
          <a href={ticketUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            <Ticket className="h-4 w-4" /> Tickets
          </a>
        )}
        {studentOpp?.signupUrl && (
          <a href={studentOpp.signupUrl} target="_blank" rel="noreferrer" className="btn-secondary text-sm">
            <HandHeart className="h-4 w-4" /> Volunteer / service
          </a>
        )}
        <Link to={`/submit?date=${event.startAt.slice(0, 10)}`} className="btn-secondary text-sm">
          <PlusCircle className="h-4 w-4" /> Submit update
        </Link>
        <Link to="/submit" className="btn-ghost text-sm">
          Add event like this
        </Link>
      </div>

      {qrOpen && url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-label="Event QR code">
          <button type="button" className="absolute inset-0 bg-ark-night/50" onClick={() => setQrOpen(false)} aria-label="Close" />
          <div className="relative card-readable max-w-sm text-center">
            <h3 className="font-semibold text-lg">Share this event</h3>
            <p className="text-caption mt-1 break-all">{url}</p>
            <img src={qrSrc} alt="QR code for event page" className="mx-auto mt-4 rounded-lg border border-[var(--border)]" width={200} height={200} />
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => setQrOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
