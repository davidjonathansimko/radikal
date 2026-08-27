// Pasul A08 — PICTOGRAME MONOCROME pentru meniul de admin.
//
// De ce exista fisierul acesta?
// La pasul A04 am folosit emoji colorate (📝 🎞️ 🚧 …). Nu se potrivesc deloc
// cu stilul RADIKAL, care este alb-negru, sobru si curat. Emoji-urile arata
// si diferit de la un sistem la altul (Windows, Mac, Android).
//
// Aici sunt pictograme SVG desenate cu linii subtiri, fara nicio culoare:
// mostenesc culoarea textului prin `stroke="currentColor"`. Asa se potrivesc
// automat si pe fundal inchis, si pe fundal deschis.
//
// Stil: linii de 1.5px, capete rotunde — acelasi limbaj vizual ca sagetile
// si inimioara din reels.

import React from 'react';

interface IconProps {
  className?: string;
}

/** Invelis comun: aceleasi proportii si aceeasi grosime de linie peste tot. */
function Svg({ className = 'w-4 h-4', children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/** Blogs — foaie scrisa cu un stilou */
export function IconDocument(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9" />
      <path d="M14 3v5h5" />
      <line x1="9" y1="13" x2="14" y2="13" />
      <line x1="9" y1="17" x2="12" y2="17" />
    </Svg>
  );
}

/** Reels — banda de film */
export function IconFilm(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="7" y1="4" x2="7" y2="20" />
      <line x1="17" y1="4" x2="17" y2="20" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </Svg>
  );
}

/** Site in lucru — unealta */
export function IconWrench(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M14.7 6.3a4 4 0 0 0 5 5l-8.4 8.4a2.1 2.1 0 0 1-3-3l8.4-8.4z" />
      <path d="M18.5 3.5 21 6l-2 2-2.5-2.5z" />
    </Svg>
  );
}

/** Modals — fereastra */
export function IconWindow(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="6.5" cy="6.5" r="0.6" fill="currentColor" />
    </Svg>
  );
}

/** Utilizatori */
export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20" />
      <circle cx="9.5" cy="7.5" r="3.2" />
      <path d="M21 20v-1.5a4 4 0 0 0-3-3.8" />
      <path d="M16.5 4.4a3.2 3.2 0 0 1 0 6.2" />
    </Svg>
  );
}

/** Notificari — clopotel */
export function IconBell(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
      <path d="M10.5 19.5a2 2 0 0 0 3 0" />
    </Svg>
  );
}

/** Creare — plus intr-un cerc */
export function IconPlus(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8.5" x2="12" y2="15.5" />
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
    </Svg>
  );
}

/** Setari — rotita */
export function IconGear(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Svg>
  );
}

/** Analytics — coloane de statistica */
export function IconChart(props: IconProps) {
  return (
    <Svg {...props}>
      <line x1="4" y1="20" x2="20" y2="20" />
      <rect x="6" y="11" width="3" height="6" />
      <rect x="11" y="7" width="3" height="10" />
      <rect x="16" y="13" width="3" height="4" />
    </Svg>
  );
}

/** News — portavoce: noutati, invitatii, anunturi (pasul A16) */
export function IconMegaphone(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10v4a1 1 0 0 0 1 1h2l9 4V5L7 9H5a1 1 0 0 0-1 1z" />
      <path d="M19 9a3 3 0 0 1 0 6" />
      <path d="M8 15v3a1.5 1.5 0 0 0 3 0v-2" />
    </Svg>
  );
}

/** Categorii — etichete (pasul A17) */
export function IconTag(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M3 12.5V4.5A1.5 1.5 0 0 1 4.5 3h8l8.5 8.5a1.5 1.5 0 0 1 0 2.1l-6.4 6.4a1.5 1.5 0 0 1-2.1 0L3 12.5z" />
      <circle cx="7.5" cy="7.5" r="1.2" />
    </Svg>
  );
}

/* =========================================================================
 * Pasul 2308006-B — butoanele din lista de articole.
 *
 * Inainte erau pictograme colorate (albastru / galben / mov / rosu) luate
 * din alta biblioteca — se bateau cap in cap cu restul paginii.
 * Acum sunt desenate cu aceeasi linie subtire ca toate celelalte, monocrom.
 * Culoarea o iau din text (`currentColor`), deci se potrivesc singure si pe
 * fundal alb, si pe fundal negru.
 * ========================================================================= */

/** Vezi articolul — ochi */
export function IconEye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  );
}

/** Modifica — creion */
export function IconPencil(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z" />
      <path d="M14.5 6.5l3 3" />
    </Svg>
  );
}

/** Trimite newsletter — plic care pleaca */
export function IconSend(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 3L10.5 13.5" />
      <path d="M21 3l-6.5 18-4-8-8-4L21 3z" />
    </Svg>
  );
}

/** Sterge — cos de gunoi */
export function IconTrash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7h16" />
      <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
      <path d="M6.5 7l.8 12.1A1.5 1.5 0 0 0 8.8 20.5h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </Svg>
  );
}

/** Se incarca — cerc intrerupt care se roteste */
export function IconSpinner(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Svg>
  );
}
