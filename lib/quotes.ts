const QUOTES = [
  "De enige slechte training is degene die niet is gebeurd.",
  "Consistentie verslaat intensiteit, elke keer weer.",
  "Kleine stappen, elke week, worden grote resultaten.",
  "Je wordt niet sterker op je goede dagen — maar op de dagen dat je toch komt opdagen.",
  "De laatste rep is waar de winst zit.",
  "Vooruitgang is vooruitgang, hoe klein ook.",
  "Discipline is jezelf herinneren wat je wilt.",
  "Rust een dag als je moet, stop nooit.",
  "Elke set brengt je dichter bij wie je wilt worden.",
  "Sterk worden is een keuze die je elke dag opnieuw maakt.",
  "Het gaat niet om perfect, het gaat om vooruit.",
  "Je toekomstige zelf bedankt je voor deze training.",
  "Log het gewicht. Klop het volgende keer.",
  "Vorm eerst, ego nooit.",
  "Een goede training start met gewoon beginnen.",
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function quoteOfTheDay(): string {
  const idx = dayOfYear(new Date()) % QUOTES.length;
  return QUOTES[idx];
}
