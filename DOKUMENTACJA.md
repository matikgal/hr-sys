# HR Manager — Dokumentacja Techniczna

System zarządzania zasobami ludzkimi klasy SaaS zbudowany jako projekt studencki demonstrujący architekturę kontenerową i mikroserwisową.

---

## Spis treści

1. [Stack technologiczny](#stack-technologiczny)
2. [Architektura systemu](#architektura-systemu)
3. [Struktura projektu](#struktura-projektu)
4. [Moduły aplikacji](#moduły-aplikacji)
5. [Baza danych — kolekcje Firestore](#baza-danych--kolekcje-firestore)
6. [Bezpieczeństwo — reguły dostępu](#bezpieczeństwo--reguły-dostępu)
7. [Cloud Functions](#cloud-functions)
8. [Infrastruktura i konteneryzacja](#infrastruktura-i-konteneryzacja)
9. [Observability — OpenTelemetry + Loki](#observability--opentelemetry--loki)
10. [CI/CD](#cicd)
11. [Uruchomienie lokalne](#uruchomienie-lokalne)
12. [Zmienne środowiskowe](#zmienne-środowiskowe)

---

## Stack technologiczny

### Frontend
| Technologia | Wersja | Zastosowanie |
|---|---|---|
| Next.js | 16.2.3 | Framework React (App Router, SSR/SSG) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Typowanie statyczne |
| Tailwind CSS | 4.x | Utility-first styling |
| shadcn/ui | 4.x | Komponenty UI (Radix UI + Tailwind) |
| TanStack Query | 5.x | Server state management, cache, mutations |
| React Hook Form | 7.x | Formularze z walidacją |
| Zod | 4.x | Schema validation |
| Recharts | 3.x | Wykresy (bar, radar, line) |
| Framer Motion | 12.x | Animacje |
| date-fns | 4.x | Manipulacja datami |
| Lucide React | 1.x | Ikony SVG |
| Sonner | 2.x | Toast notifications |
| cmdk | 1.x | Command palette (Cmd+K) |

### Backend / BaaS
| Technologia | Zastosowanie |
|---|---|
| Firebase Auth | Uwierzytelnianie (email/password) |
| Firebase Firestore | Baza danych NoSQL (real-time) |
| Firebase Storage | Przechowywanie plików (avatary, dokumenty) |
| Firebase Cloud Functions | Serverless backend (agregacja statystyk) |
| Firebase Security Rules | RBAC na poziomie bazy danych |

### Infrastruktura
| Technologia | Zastosowanie |
|---|---|
| Docker / Docker Compose | Konteneryzacja aplikacji |
| Nginx | Reverse proxy w produkcji |
| GitHub Actions | CI/CD (lint + typecheck + build) |
| Firebase Emulator Suite | Lokalny development bez połączenia z prod |

### Observability
| Technologia | Zastosowanie |
|---|---|
| OpenTelemetry SDK | Distributed tracing (instrumentacja Next.js) |
| OTLP HTTP Exporter | Eksport trace'ów do Jaeger/Grafana |
| Grafana Loki | Agregacja logów z kontenerów |
| Promtail | Agent zbierający logi do Loki |

---

## Architektura systemu

```
┌─────────────────────────────────────────────────────┐
│                   Przeglądarka                       │
│              Next.js 16 (App Router)                │
│         React 19 + TanStack Query + shadcn/ui       │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│                  Nginx (reverse proxy)               │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Next.js Server (Node.js)                │
│          OpenTelemetry instrumentation               │
└──────┬───────────────┬────────────────┬─────────────┘
       │               │                │
  Firebase Auth   Firestore        Firebase Storage
  (uwierzytelnie- (baza danych)    (pliki binarne)
   nie)
       │
  Cloud Functions
  (onWrite triggers + cron)
       │
  system_stats/metrics
  (pre-agregowane dla dashboardu)
```

### Przepływ danych

1. **Auth**: Firebase Auth → `auth-context.tsx` → rola z email (`admin@hr.local` → admin)
2. **Dane**: `services/db/*` → TanStack Query hooks → komponenty React
3. **Mutacje**: komponent → hook (`useMutation`) → serwis Firestore → `invalidateQueries` → re-fetch
4. **Statystyki**: Cloud Functions słuchają `onDocumentWritten` → przeliczają → zapisują `system_stats/metrics` → dashboard czyta

---

## Struktura projektu

```
hr-sys/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Chronione trasy dashboardu
│   │   │   ├── layout.tsx        # Wrapper z MainLayout
│   │   │   ├── dashboard/        # Pulpit główny
│   │   │   ├── employees/        # Lista + profil pracownika
│   │   │   │   └── [id]/         # Dynamiczna strona profilu
│   │   │   ├── attendance/       # Czas pracy
│   │   │   ├── leaves/           # Wnioski urlopowe
│   │   │   ├── recruitment/      # ATS - Kanban rekrutacyjny
│   │   │   ├── performance/      # Oceny 360
│   │   │   ├── learning/         # Szkolenia i compliance
│   │   │   ├── benefits/         # Benefity pracownicze
│   │   │   ├── documents/        # Zarządzanie dokumentami
│   │   │   ├── profile/          # Profil zalogowanego użytkownika
│   │   │   └── settings/         # Ustawienia systemu
│   │   ├── login/                # Strona logowania
│   │   ├── admin/seed/           # Panel seedowania danych testowych
│   │   └── layout.tsx            # Root layout (Toaster, QueryProvider, AuthProvider)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui komponenty
│   │   │   ├── error-boundary.tsx
│   │   │   ├── command.tsx       # Cmd+K palette
│   │   │   └── sonner.tsx        # Toast provider
│   │   ├── features/
│   │   │   └── global-search.tsx # Cmd+K dialog z nawigacją i wyszukiwarką
│   │   └── layout/
│   │       ├── main-layout.tsx   # Shell: sidebar + header + main
│   │       ├── sidebar.tsx       # Nawigacja boczna (collapsible)
│   │       └── header.tsx        # Breadcrumb + search + notyfikacje + user menu
│   ├── hooks/                    # TanStack Query hooks (use-*.ts)
│   ├── services/db/              # Warstwa dostępu do Firestore
│   ├── context/
│   │   └── auth-context.tsx      # Firebase Auth + rola użytkownika
│   ├── lib/
│   │   ├── firebase.ts           # Inicjalizacja SDK
│   │   ├── query-keys.ts         # Centralne klucze cache
│   │   ├── query-provider.tsx    # TanStack Query Provider
│   │   ├── export-csv.ts         # Eksport danych do CSV (client-side Blob)
│   │   └── use-theme.ts          # Dark/light mode
│   └── types/index.ts            # Wszystkie TypeScript interfejsy
├── functions/                    # Firebase Cloud Functions
│   ├── src/index.ts              # onWrite triggers + cron scheduler
│   ├── package.json
│   └── tsconfig.json
├── firestore.rules               # Reguły bezpieczeństwa Firestore
├── storage.rules                 # Reguły bezpieczeństwa Storage
├── firebase.json                 # Konfiguracja Firebase + emulatory
├── .firebaserc                   # Powiązanie z projektem Firebase
├── docker-compose.yml            # Orkiestracja kontenerów
├── Dockerfile                    # Obraz produkcyjny Next.js
├── nginx/                        # Konfiguracja reverse proxy
├── loki/                         # Konfiguracja Grafana Loki
├── promtail/                     # Konfiguracja agenta logów
└── .github/workflows/ci.yml      # GitHub Actions CI
```

---

## Moduły aplikacji

### 1. Dashboard (`/dashboard`)

**Cel:** Zagregowany widok kluczowych metryk organizacji w czasie rzeczywistym.

**Funkcjonalności:**
- Karty KPI: łączna liczba pracowników, aktywni rekrutacje, nieobecni dziś
- Lista ostatnio dodanych pracowników (8 rekordów)
- Panel oczekujących wniosków urlopowych z akcją zatwierdzenia/odrzucenia
- Przycisk ręcznego odświeżenia danych
- Auto-refresh co 5 minut (TanStack Query `refetchInterval`)

**Dane:** `system_stats/metrics` (pre-agregowane przez Cloud Functions), `employees`, `leaves`

**Kluczowe pliki:**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/hooks/use-dashboard.ts`
- `src/services/db/system.ts`

---

### 2. Pracownicy (`/employees`, `/employees/[id]`)

**Cel:** Centralne repozytorium danych pracowników z pełnym zarządzaniem profilami.

**Funkcjonalności:**
- Tabela z paginacją cursor-based (Firestore `startAfter`, 15 rekordów/stronę)
- Wyszukiwanie po imieniu i nazwisku (client-side filter)
- Filtrowanie po statusie i dziale
- Statystyki: łącznie, aktywni, na urlopie, nowi w miesiącu
- Dodawanie nowego pracownika (Dialog z formularzem)
- Sheet z podglądem profilu bez opuszczania listy
- Eksport do CSV (Blob download, separator `,`, BOM dla Excel)

**Profil pracownika (`/employees/[id]`):**
- Edycja inline wszystkich pól (firstName, lastName, email, dział, stanowisko, status, data zatrudnienia)
- Upload avatara z paskiem postępu (Firebase Storage, max 5MB, tylko obrazy)
- Zakładki: Informacje, Historia zatrudnienia, Szkolenia, Benefity

**Role RBAC:**
- `employee`: własny profil tylko do odczytu
- `manager`: odczyt wszystkich, edycja bez pól chronionych
- `hr`/`admin`: pełen CRUD

**Kluczowe pliki:**
- `src/app/(dashboard)/employees/page.tsx`
- `src/app/(dashboard)/employees/[id]/page.tsx`
- `src/hooks/use-employees.ts`
- `src/services/db/employees.ts`

---

### 3. Czas pracy (`/attendance`)

**Cel:** Rejestrowanie check-in/out, obliczanie przepracowanych godzin.

**Funkcjonalności:**
- Przycisk "Rozpocznij pracę" / "Zakończ pracę" (toggle)
- Widok kalendarza miesięcznego z oznaczeniem obecności
- Tabela historii z filtrowaniem
- Statusy: present, late, absent, excused
- Widok managera: wszyscy pracownicy w dziale
- Podgląd szczegółów dnia (lista zdarzeń in/out z timestampami)

**Logika biznesowa:**
- Sesja auto-zamykana po 12h bez zdarzenia 'out' (flagowanie do przeglądu HR)
- Obliczanie `totalHours` z tablicy zdarzeń

**Kolekcja Firestore:** `attendance/{recordId}` — `{ employeeId, date, events[], totalHours, status }`

---

### 4. Urlopy (`/leaves`)

**Cel:** Zarządzanie wnioskami urlopowymi z auto-zatwierdzaniem.

**Funkcjonalności:**
- Składanie wniosków (Sheet z formularzem: typ, daty)
- Kalendarze z zaznaczonymi nieobecnościami zespołu
- Pasek postępu wykorzystania urlopu (np. 12/26 dni)
- Widok managera/HR: lista wszystkich wniosków z przyciskami zatwierdź/odrzuć
- Eksport do CSV (tylko admin/hr/manager)
- Filtrowanie po nazwisku i statusie

**Auto-approval logic:**
```
jeśli daysCount < 3
   && balance.vacationUsed + daysCount <= balance.vacationTotal
   && (pracownicy_działu_na_urlopie / wielkość_działu) < 0.20
→ status = 'auto_approved'
```

**Kolekcje Firestore:**
- `leaves/{id}` — wniosek urlopowy
- `leave_balances/{employeeId}` — saldo dni (oddzielna kolekcja dla RBAC)

---

### 5. Rekrutacja ATS (`/recruitment`)

**Cel:** Śledzenie kandydatów przez lejek rekrutacyjny.

**Funkcjonalności:**
- Kanban Board z drag & drop (6 kolumn: applied → screening → interview → offer → hired → rejected)
- Dodawanie ogłoszeń o pracę
- Karta kandydata: imię, email, pasek score (0–100%)
- Dropdown menu na karcie: szybka zmiana etapu
- Sheet szczegółów kandydata:
  - Edycja etapu (przyciski)
  - Notatki rekrutera (textarea + auto-save)
  - Wynik i postęp
  - Przycisk "Zatrudnij" (tylko stage === 'offer')
- Zakładka "Ogłoszenia" z listą aktywnych ofert i liczbą kandydatów

**Onboarding flow po zatrudnieniu:**
1. Firestore transaction: kandidat → `stage: 'hired'`, tworzenie rekordu `employees`
2. Tworzenie `leave_balances` (26 dni urlopu)
3. Auto-przypisanie szkoleń onboardingowych
4. Redirect do `/employees/[newId]` + toast sukcesu

**Kolekcje Firestore:** `jobs/{id}`, `candidates/{id}`

---

### 6. Oceny 360 (`/performance`)

**Cel:** Cykliczne oceny pracowników przez przełożonych.

**Funkcjonalności:**
- Tworzenie oceny dla pracownika z wyborem okresu (np. 2026-Q1)
- Formularz z suwakami/ocenami numerycznymi per kompetencja
- Pole komentarzy tekstowych
- Statusy: draft → submitted
- Radar Chart (Recharts) wizualizujący profil kompetencji
- Widok historii ocen

**Kolekcja Firestore:** `reviews/{id}` — `{ employeeId, reviewerId, period, ratings{}, comments, status }`

---

### 7. Szkolenia (`/learning`)

**Cel:** Śledzenie compliance i certyfikatów pracowników.

**Funkcjonalności:**
- Katalog szkoleń z oznaczeniem mandatory/optional
- Status szkolenia per pracownik: completed / expired / pending
- Daty ukończenia i wygaśnięcia certyfikatu
- Auto-przypisywanie szkoleń onboardingowych przy zatrudnieniu kandydata
- Alerty o wygasających certyfikatach (14 dni przed `expiryDate`)

**Kolekcje Firestore:**
- `trainings/{id}` — katalog: `{ title, mandatory, validityMonths }`
- `employee_trainings/{id}` — przypisanie: `{ employeeId, trainingId, completedDate, expiryDate, status }`

---

### 8. Benefity (`/benefits`)

**Cel:** Samoobsługa pracownika przy zapisie na benefity.

**Funkcjonalności:**
- Katalog benefitów z ceną miesięczną i dostawcą
- Pracownik może się zapisać/wypisać (toggle)
- Widok aktualnie wybranych benefitów
- Walidacja budżetu miesięcznego

**Kolekcje Firestore:**
- `benefits/{id}` — katalog: `{ name, provider, monthlyCost }`
- `employee_benefits/{employeeId}` — `{ benefitIds[] }`

---

### 9. Dokumenty (`/documents`)

**Cel:** Repozytorium dokumentów HR (umowy, zaświadczenia, polityki).

**Funkcjonalności:**
- Upload plików do Firebase Storage (PDF, Word, Excel, obrazy, max 50MB)
- Pasek postępu uploadu
- Podgląd listy dokumentów z filtrowaniem po nazwie
- Statusy: available, pending, signed
- Pobieranie (download URL z Storage)
- Usuwanie (własne dokumenty lub HR)

**Storage path:** `documents/{uid}/{filename}`

---

### 10. Profil (`/profile`)

**Cel:** Zarządzanie danymi konta zalogowanego użytkownika.

**Funkcjonalności:**
- Edycja displayName, email
- Zmiana hasła
- Preferencje: motyw (light/dark/system), język (pl/en)
- Ustawienia powiadomień

---

### 11. Ustawienia (`/settings`)

**Cel:** Konfiguracja systemu (admin).

**Funkcjonalności:**
- Zarządzanie działami (CRUD)
- Ustawienia firmy (nazwa, logo)
- Konfiguracja powiadomień systemowych

---

### 12. Admin Seed (`/admin/seed`)

**Cel:** Narzędzie developerskie do zasilenia Firestore danymi testowymi.

**Seedowane dane:**
- 15 pracowników z różnymi działami, stanowiskami, statusami
- Działy organizacyjne
- Kandydaci na różnych etapach rekrutacji
- Wnioski urlopowe (różne statusy)
- Szkolenia i przypisania
- Benefity
- Dokumenty

---

## Baza danych — kolekcje Firestore

| Kolekcja | Klucz | Opis |
|---|---|---|
| `employees` | auto-id | Rekordy pracowników |
| `departments` | auto-id | Struktura organizacyjna |
| `attendance` | auto-id | Zdarzenia check-in/out per dzień |
| `leaves` | auto-id | Wnioski urlopowe |
| `leave_balances` | employeeId | Saldo dni urlopowych (1:1 z employee) |
| `jobs` | auto-id | Ogłoszenia rekrutacyjne |
| `candidates` | auto-id | Kandydaci w lejku ATS |
| `reviews` | auto-id | Oceny 360 |
| `trainings` | auto-id | Katalog szkoleń |
| `employee_trainings` | auto-id | Przypisania szkoleń do pracowników |
| `benefits` | auto-id | Katalog benefitów |
| `employee_benefits` | employeeId | Zapisy pracownika na benefity |
| `documents` | auto-id | Metadane dokumentów (URL do Storage) |
| `user_settings` | uid | Preferencje użytkownika |
| `system_stats` | `metrics` | Pre-agregowane KPI (pisane przez Functions) |

### Schemat kluczowych dokumentów

```typescript
// employees
{
  id: string;
  authId?: string;           // Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  departmentId: string;
  positionId: string;
  status: 'active' | 'inactive' | 'on-leave';
  startDate: string;         // YYYY-MM-DD
  avatarUrl?: string;        // Firebase Storage URL
  metadata?: {
    skills?: string[];
    languages?: string[];
    source?: string;         // 'ATS' jeśli z rekrutacji
    hiredFromJobId?: string;
    candidateId?: string;
  };
}

// leaves
{
  id: string;
  employeeId: string;
  employeeName?: string;
  type: 'vacation' | 'sick' | 'paternity' | 'unpaid';
  startDate: string;
  endDate: string;
  daysCount: number;
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  approverId?: string;
  createdAt: string;
}

// candidates
{
  id: string;
  jobId: string;
  firstName: string;
  lastName: string;
  email: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  score: number;             // 0-100
  notes?: string;
  phone?: string;
  appliedAt?: string;
}

// system_stats/metrics
{
  totalEmployees: number;
  activeEmployees: number;
  activeRecruitments: number;
  absentToday: number;
  updatedAt: Timestamp;
}
```

---

## Bezpieczeństwo — reguły dostępu

### Role użytkowników

| Rola | Uprawnienia |
|---|---|
| `admin` | Pełen dostęp do wszystkiego |
| `hr` | CRUD na pracownikach, urlopach, rekrutacji, dokumentach |
| `manager` | Odczyt wszystkich, zatwierdzanie urlopów, tworzenie ocen |
| `employee` | Tylko własne dane (własny profil, własne urlopy, własne szkolenia) |

Rola jest przechowywana w `employees/{uid}.metadata.role` i weryfikowana przez helper funkcje w `firestore.rules`.

### Firestore Security Rules (`firestore.rules`)

Kluczowe zasady:
- `employees`: pracownik czyta tylko własny rekord, manager czyta wszystkich, HR pisze
- `leaves`: pracownik tworzy własne wnioski, manager zatwierdza/odrzuca (tylko pola `status`, `approverId`)
- `system_stats`: tylko odczyt dla managerów+, **zapis zablokowany dla klientów** (tylko Cloud Functions)
- `leave_balances`: oddzielna kolekcja — pracownik czyta własne, HR pisze

### Firebase Storage Rules (`storage.rules`)

- `avatars/{employeeId}/*`: każdy zalogowany może wgrać i odczytać, max 5MB, tylko `image/*`
- `documents/{uid}/*`: właściciel lub HR odczytuje, właściciel wgrywa (max 50MB, PDF/Office/images), właściciel lub HR usuwa

---

## Cloud Functions

Lokalizacja: `functions/src/index.ts`

### Triggery Firestore (`onDocumentWritten`)

| Funkcja | Trigger | Akcja |
|---|---|---|
| `onEmployeeWrite` | `employees/{id}` | Przelicza `system_stats/metrics` |
| `onCandidateWrite` | `candidates/{id}` | Przelicza `system_stats/metrics` |
| `onLeaveWrite` | `leaves/{id}` | Przelicza `system_stats/metrics` |

### Scheduler

| Funkcja | Harmonogram | Akcja |
|---|---|---|
| `dailyStatsRecalc` | `0 0 * * *` (Europe/Warsaw) | Przelicza wszystkie metryki o północy |

### Logika `recomputeStats()`

```
totalEmployees  = COUNT(employees)
activeEmployees = COUNT(employees WHERE status == 'active')
activeRecruitments = COUNT(candidates WHERE stage NOT IN ['hired', 'rejected'])
absentToday = COUNT(leaves WHERE status IN ['approved', 'auto_approved']
                             AND startDate <= TODAY
                             AND endDate >= TODAY)
```

Wynik zapisywany do `system_stats/metrics` przez `set(..., { merge: true })`.

---

## Infrastruktura i konteneryzacja

### Docker Compose (`docker-compose.yml`)

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Next.js   │◄───│    Nginx    │    │    Loki     │
│  (port 3000)│    │ (port 80)   │    │ (port 3100) │
└─────────────┘    └─────────────┘    └──────▲──────┘
                                             │
                                      ┌──────┴──────┐
                                      │  Promtail   │
                                      │ (log agent) │
                                      └─────────────┘
```

**Serwisy:**
- `nextjs` — aplikacja Next.js w trybie produkcyjnym (`next start`)
- `nginx` — reverse proxy, terminacja SSL, routing
- `loki` — agregacja i przechowywanie logów
- `promtail` — zbieranie logów z kontenerów Docker i wysyłka do Loki

### Dockerfile

Multi-stage build:
1. `deps` — instalacja `node_modules`
2. `builder` — `next build`
3. `runner` — minimalny obraz produkcyjny z `.next/standalone`

### Uruchomienie z Dockerem

```bash
npm run docker:up     # docker-compose up -d
npm run docker:down   # docker-compose down
npm run docker:build  # docker-compose build
```

---

## Observability — OpenTelemetry + Loki

### Tracing (`src/instrumentation.ts`)

Next.js `instrumentation hook` inicjalizuje OpenTelemetry SDK przy starcie serwera:

```
Next.js Server
    │
    ├─ NodeSDK (OpenTelemetry)
    │      ├─ resource: service.name = 'hr-system'
    │      ├─ traceExporter: OTLP HTTP → http://jaeger:4318/v1/traces
    │      └─ instrumentations: auto-instrumentations-node
    │              (HTTP, Express, Fetch, DNS, FS — FS disabled)
```

Zmienna środowiskowa `OTEL_EXPORTER_OTLP_ENDPOINT` nadpisuje domyślny endpoint.

### Logi (Loki + Promtail)

Promtail montuje `/var/lib/docker/containers` i wysyła logi wszystkich kontenerów do Loki. Logi dostępne przez Grafana UI lub API Loki.

---

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

**Wyzwalacze:** push do `main`/`master`/`develop`, PR do `main`/`master`

**Pipeline:**
```
checkout
    │
setup Node.js 20 (z cache npm)
    │
npm ci
    │
npm run lint          (ESLint)
    │
npx tsc --noEmit      (TypeScript typecheck)
    │
npm run build         (Next.js production build)
```

**Secrets wymagane w GitHub:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

---

## Uruchomienie lokalne

### Wymagania

- Node.js 20+
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)
- Docker Desktop (opcjonalnie)

### Development

```bash
cd hr-sys

# Instalacja zależności
npm install

# Uruchomienie dev server (hot reload)
npm run dev
# → http://localhost:3000

# Typecheck
npx tsc --noEmit

# Linting
npm run lint
```

### Z Firebase Emulator (bez połączenia z prod)

```bash
# Uruchom emulatory (Firestore, Auth, Storage, Functions, UI)
npm run emulators
# → Emulator UI: http://localhost:4000
# → Firestore: localhost:8080
# → Auth: localhost:9099
# → Storage: localhost:9199

# Eksport stanu emulatora
npm run emulators:export

# Uruchomienie z zaimportowanymi danymi
npm run emulators:import
```

### Z Dockerem (produkcja lokalna)

```bash
npm run docker:build
npm run docker:up
# → http://localhost (przez Nginx)

npm run docker:down
```

### Czyszczenie

```bash
npm run clean   # usuwa .next/ i node_modules/
```

---

## Zmienne środowiskowe

Plik `.env.local` w katalogu `hr-sys/`:

```env
# Firebase — projekt: hrsys-50919
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hrsys-50919
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# OpenTelemetry (opcjonalne — domyślnie http://jaeger:4318/v1/traces)
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

> Wszystkie zmienne z prefiksem `NEXT_PUBLIC_` są dostępne po stronie klienta. Nie umieszczaj w nich sekretów.

---

## Konta testowe (seed)

Po uruchomieniu `/admin/seed`:

| Email | Hasło | Rola |
|---|---|---|
| `admin@hr.local` | `Admin123!` | admin |
| `hr@hr.local` | `Hr1234!` | hr |
| `manager@hr.local` | `Manager1!` | manager |
| `employee@hr.local` | `Employee1!` | employee |
