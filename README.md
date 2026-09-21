# Arc — Trainingslog

Een installeerbare PWA om workouts (sets, reps, gewicht per oefening) bij te houden. Data blijft lokaal op je toestel (localStorage), er is geen backend.

## Ontwikkelen

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Bouwen

```bash
npm run build
```

## Deployen

Dit project is bedoeld om via GitHub naar [Vercel](https://vercel.com) te deployen: push naar een GitHub-repo en importeer het project op Vercel. Elke push naar `main` deployt automatisch.

## PWA installeren op iPhone

1. Open de gedeployde URL in Safari.
2. Tik op het deel-icoon en kies "Zet op beginscherm".
3. De app opent voortaan als standalone app, zonder Safari-UI.
