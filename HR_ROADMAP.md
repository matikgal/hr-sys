# Enterprise HR SaaS - System Roadmap & Architecture Plan

Ten dokument stanowi szczegółowy, techniczny plan działania dla rozbudowy systemu HR klasy enterprise. Opiera się na nowoczesnych standardach SaaS (wysoka automatyzacja, minimalizacja "human touch", architektura oparta na zdarzeniach).

## 1. Moduł: Dashboard (Pulpit Główny)

**Cel:** Zagregowany, asynchronicznie ładowany widok najważniejszych metryk, anomalii i zadań wymagających akcji.

### Struktura Firestore
*(Dashboard nie posiada własnych kolekcji, agreguje dane z innych. Konieczne jest użycie widoków zmaterializowanych lub liczników w dokumencie metadanych dla wydajności).*
*   Kolekcja `system_stats`:
    *   `metrics` (dokument): `total_employees` (number), `active_recruitments` (number), `absent_today` (number). Aktualizowane przez Cloud Functions na zdarzeniach (onWrite).

### Komponenty interfejsu (shadcn/ui + Tailwind)
*   `Card` (agregaty liczbowe).
*   `Skeleton` (dla każdego widgetu osobno, ładowanie Suspense).
*   `Alert` / `Toast` (dla anomalii, np. "3 osoby spóźnione dzisiaj").
*   `Tabs` (szybkie przełączanie kontekstu: np. Moje Zadania vs Przegląd Zespołu).

### Logika biznesowa i automatyzacja
*   Algorytm wykrywania anomalii: Sprawdzanie brakujących logowań (check-in) do godziny 9:15 i generowanie automatycznego alertu dla managera.
*   Automatyczne powiadomienia (push/email) o wygasających umowach z 30-dniowym wyprzedzeniem.

### Procedury testowe
*   Weryfikacja typów: `npm run type-check` (lub `npx tsc --noEmit`).
*   Testy jednostkowe agregacji: `npm run test -- dashboard.test.ts`.

---

## 2. Moduł: Pracownicy (Katalog i Profile)

**Cel:** Centralne repozytorium danych (Single Source of Truth), historia zatrudnienia, struktura organizacyjna.

### Struktura Firestore
*   Kolekcja `employees`:
    *   `id` (string), `authId` (string, ref do Firebase Auth), `firstName` (string), `lastName` (string), `departmentId` (string), `positionId` (string), `status` ('active' | 'inactive' | 'on-leave'), `metadata` (map: np. skills, languages).
*   Kolekcja `departments`:
    *   `id` (string), `name` (string), `managerId` (string).
*   Kolekcja `job_history` (Podkolekcja w `employees` dla śledzenia zmian):
    *   `id` (string), `position` (string), `startDate` (timestamp), `endDate` (timestamp), `salary` (number).

### Komponenty interfejsu
*   `Table` (z zaawansowanym filtrowaniem po kolumnach i paginacją z Firebase `startAfter`).
*   `Sheet` (wysuwany panel z prawej strony dla szybkiego podglądu profilu bez opuszczania tabeli).
*   `Avatar` i `Badge` (statusy).
*   `Command` (cmd+k do globalnego wyszukiwania pracowników).

### Logika biznesowa i automatyzacja
*   Onboarding automatyczny: Po dodaniu pracownika, system wysyła powitalnego e-maila z linkiem do ustalenia hasła w Firebase Auth oraz generuje zadania w module Szkoleń.
*   Zasada "Role-Based Access Control" (RBAC): Pracownik widzi tylko profil publiczny innych, Manager widzi pensje i historię tylko swojego zespołu.

### Procedury testowe
*   Lintowanie kodu: `npm run lint`.
*   Testy RBAC Firebase Security Rules przy użyciu emulatora Firestore.

---

## 3. Moduł: Czas i Obecność (Attendance)

**Cel:** Bezkontaktowe rejestrowanie czasu pracy, wykrywanie nadgodzin i spóźnień.

### Struktura Firestore
*   Kolekcja `attendance`:
    *   `id` (string), `employeeId` (string), `date` (YYYY-MM-DD), `events` (array of objects: `{ type: 'in' | 'out', timestamp: number, location: geopoint | string }`), `totalHours` (number), `status` ('present' | 'late' | 'absent' | 'excused').

### Komponenty interfejsu
*   `Button` (duże, wyraźne przyciski "Rozpocznij pracę" / "Zakończ pracę").
*   `HoverCard` (szczegóły logowań po najechaniu na dzień).
*   `DataTable` z wykresami typu sparkline dla trendów godzinowych.

### Logika biznesowa i automatyzacja
*   Automatyczne zamknięcie sesji: Jeśli brak zdarzenia 'out' po 12 godzinach, system automatycznie zamyka sesję i flaguje rekord do przeglądu przez HR.
*   Obliczanie nadgodzin: Asynchroniczny job cronowy uruchamiany w nocy w Firebase Functions zliczający tygodniowe saldo godzin.

### Procedury testowe
*   Weryfikacja algorytmów czasu: `npm run test -- attendance-logic.test.ts`.

---

## 4. Moduł: Urlopy (Leaves)

**Cel:** "Zero-touch" dla HR przy standardowych wnioskach, inteligentne blokowanie kolizji.

### Struktura Firestore
*   Kolekcja `leaves`:
    *   `id` (string), `employeeId` (string), `type` ('vacation' | 'sick' | 'paternity' | 'unpaid'), `startDate` (timestamp), `endDate` (timestamp), `daysCount` (number), `status` ('pending' | 'approved' | 'rejected' | 'auto_approved'), `approverId` (string).
*   Kolekcja `leave_balances` (Oddzielna ze względów bezpieczeństwa i audytu):
    *   `employeeId` (string) jako ID dokumentu, `vacationTotal` (number), `vacationUsed` (number), `sickUsed` (number).

### Komponenty interfejsu
*   `Calendar` (zintegrowany widok pokazujący nieobecności zespołu).
*   `Dialog` / `Form` (react-hook-form + zod do składania wniosków).
*   `Progress` (pasek pokazujący zużycie dostępnych dni).

### Logika biznesowa i automatyzacja
*   Automatyczna akceptacja (Auto-Approval): Jeśli pracownik bierze < 3 dni urlopu, ma wystarczające saldo, a w jego zespole (department) na urlopie przebywa mniej niż 20% osób -> status zmienia się automatycznie na `auto_approved`.
*   Blokowanie: Walidacja na poziomie backendu zapobiegająca tworzeniu nakładających się na siebie wniosków.

### Procedury testowe
*   Walidacja schematów Zod (Frontend & Backend/Firebase Rules).
*   E2E z użyciem Playwright/Cypress do ścieżki "Złóż i zaakceptuj wniosek".

---

## 5. Moduł: Rekrutacja (ATS - Applicant Tracking System)

**Cel:** Prosty ATS, lejki rekrutacyjne i integracja z pracownikami (przejście z kandydata na pracownika).

### Struktura Firestore
*   Kolekcja `jobs` (ogłoszenia): `title`, `departmentId`, `status` ('open' | 'closed').
*   Kolekcja `candidates`:
    *   `id`, `jobId`, `firstName`, `lastName`, `email`, `stage` ('applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'), `score` (number).

### Komponenty interfejsu
*   Kanban Board (Drag & Drop) używając dnd-kit i komponentów kolumn/kart tailwinda.
*   `Select` / `DropdownMenu` (do szybkich zmian statusu kandydata).

### Logika biznesowa i automatyzacja
*   Auto-odrzucanie: Zautomatyzowane e-maile po przesunięciu karty do kolumny 'rejected'.
*   Hiring to Employee: Przycisk "Zatrudnij" automatycznie przenosi dane kandydata do kolekcji `employees` i inicjuje Onboarding.

---

## 6. Moduł: Oceny (Performance & 360 Reviews)

**Cel:** Obiektywne mierniki, cykliczne oceny.

### Struktura Firestore
*   Kolekcja `reviews`:
    *   `id`, `employeeId`, `reviewerId`, `period` (string, np. '2026-Q1'), `ratings` (map: komunikacja: 4, kodowanie: 5), `comments` (string), `status` ('draft' | 'submitted').

### Komponenty interfejsu
*   `Slider` / `RadioGroup` (do wystawiania ocen liczbowych).
*   `Textarea` (z limitem znaków dla feedbacku).
*   `Chart` (np. Radar Chart z Recharts do wizualizacji umiejętności 360).

---

## 7. Moduł: Szkolenia (Learning & Development)

**Cel:** Śledzenie certyfikatów i compliance.

### Struktura Firestore
*   Kolekcja `trainings`: `title`, `mandatory` (boolean), `validityMonths` (number).
*   Kolekcja `employee_trainings`: `employeeId`, `trainingId`, `completedDate`, `expiryDate`, `status`.

### Logika biznesowa i automatyzacja
*   Auto-assign: Przypisywanie obowiązkowego szkolenia BHP w dniu zatrudnienia. Alert na 14 dni przed upływem `expiryDate`.

---

## 8. Moduł: Benefity

**Cel:** Samoobsługa dla pracowników (Self-Service).

### Struktura Firestore
*   Kolekcja `benefits`: `name`, `provider`, `monthlyCost`.
*   Kolekcja `employee_benefits`: `employeeId`, `benefitIds` (array of strings).

### Logika biznesowa i automatyzacja
*   Limit wydatków: System blokuje możliwość zapisu na benefity przekraczające dozwolony miesięczny budżet pracownika (walidacja na poziomie bazy i formularza).
