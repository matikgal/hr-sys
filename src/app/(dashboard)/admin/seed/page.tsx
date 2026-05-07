'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, deleteDoc, doc, updateDoc, setDoc, writeBatch,
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Database, Trash2, Zap, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ─── helpers ───────────────────────────────────────────────────────────────
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const isoDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};
const today = isoDate(0);

async function clearCollection(name: string) {
  const snap = await getDocs(collection(db, name));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}

// ─── seed ──────────────────────────────────────────────────────────────────
async function runSeed(log: (msg: string) => void) {
  const COLS = ['departments','employees','leaves','leave_balances','attendance',
                'benefits','employee_benefits','trainings','employee_trainings',
                'reviews','jobs','candidates'];
  log('Czyszczenie kolekcji…');
  for (const c of COLS) { await clearCollection(c); log(`  ✓ ${c}`); }

  // 1. DEPARTMENTS
  log('Tworzenie działów…');
  const deptData = [
    { name: 'Inżynieria',        description: 'R&D, Frontend, Backend, DevOps', location: 'Warszawa HQ', budget: 320000 },
    { name: 'Sprzedaż',          description: 'Account Management, BDM',        location: 'Wrocław',     budget: 180000 },
    { name: 'Human Resources',   description: 'Rekrutacja, L&D, Payroll',        location: 'Kraków Hub',  budget: 90000  },
    { name: 'Finanse',           description: 'Controlling, Księgowość',          location: 'Warszawa HQ', budget: 130000 },
    { name: 'Marketing',         description: 'Growth, Brand, Content',           location: 'Warszawa HQ', budget: 110000 },
    { name: 'Operacje',          description: 'Projekty, Procesy, Support',       location: 'Gdańsk',      budget: 95000  },
  ];
  const deptRefs: Record<string, string> = {};
  for (const d of deptData) {
    const ref = await addDoc(collection(db, 'departments'), d);
    deptRefs[d.name] = ref.id;
  }

  // 2. EMPLOYEES (18)
  log('Tworzenie pracowników…');
  const empData = [
    // Inżynieria
    { fn:'Adam',    ln:'Wiśniewski', email:'adam.wisniewski@hr.local',    dept:'Inżynieria',      pos:'CTO',                       status:'active',    start: isoDate(900), skills:['Architecture','Firebase','Go'],          langs:['EN','PL','DE'] },
    { fn:'Marta',   ln:'Zielińska',  email:'marta.zielinska@hr.local',    dept:'Inżynieria',      pos:'Lead Frontend Developer',   status:'active',    start: isoDate(730), skills:['React','TypeScript','Tailwind'],         langs:['EN','PL'] },
    { fn:'Tomasz',  ln:'Jabłoński',  email:'tomasz.jablonski@hr.local',   dept:'Inżynieria',      pos:'Backend Developer',         status:'active',    start: isoDate(540), skills:['Node.js','PostgreSQL','Docker'],         langs:['EN','PL'] },
    { fn:'Karolina',ln:'Dąbrowska',  email:'karolina.dabrowska@hr.local', dept:'Inżynieria',      pos:'QA Engineer',               status:'active',    start: isoDate(480), skills:['Cypress','Jest','Playwright'],           langs:['EN','PL'] },
    { fn:'Michał',  ln:'Lewandowski',email:'michal.lewandowski@hr.local', dept:'Inżynieria',      pos:'DevOps Engineer',           status:'active',    start: isoDate(610), skills:['Kubernetes','Terraform','CI/CD'],        langs:['EN','PL'] },
    // Sprzedaż
    { fn:'Piotr',   ln:'Nowak',      email:'piotr.nowak@hr.local',        dept:'Sprzedaż',        pos:'Head of Sales',             status:'active',    start: isoDate(820), skills:['Salesforce','Negotiations','CRM'],       langs:['EN','PL','FR'] },
    { fn:'Anna',    ln:'Kowalczyk',  email:'anna.kowalczyk@hr.local',     dept:'Sprzedaż',        pos:'Account Manager',           status:'on-leave',  start: isoDate(410), skills:['B2B','Prezentacje'],                    langs:['EN','PL'] },
    { fn:'Bartosz', ln:'Mazur',      email:'bartosz.mazur@hr.local',      dept:'Sprzedaż',        pos:'Business Development Mgr',  status:'active',    start: isoDate(290), skills:['Prospecting','LinkedIn Sales Nav'],      langs:['EN','PL','ES'] },
    // HR
    { fn:'Jan',     ln:'Kowalski',   email:'jan.kowalski@hr.local',       dept:'Human Resources', pos:'HR Business Partner',       status:'active',    start: isoDate(700), skills:['Rekrutacja','Coaching','Mediacja'],      langs:['EN','PL'] },
    { fn:'Zuzanna', ln:'Wróbel',     email:'zuzanna.wrobel@hr.local',     dept:'Human Resources', pos:'Talent Acquisition Spec.',  status:'active',    start: isoDate(200), skills:['Sourcing','Employer Branding'],          langs:['EN','PL'] },
    // Finanse
    { fn:'Krzysztof',ln:'Kamiński',  email:'krzysztof.kaminski@hr.local', dept:'Finanse',         pos:'CFO',                       status:'active',    start: isoDate(950), skills:['IFRS','Controlling','Excel'],            langs:['EN','PL','DE'] },
    { fn:'Monika',  ln:'Szymańska',  email:'monika.szymanska@hr.local',   dept:'Finanse',         pos:'Senior Accountant',         status:'active',    start: isoDate(380), skills:['Symfonia','SAP','Vat'],                  langs:['PL'] },
    // Marketing
    { fn:'Agnieszka',ln:'Woźniak',   email:'agnieszka.wozniak@hr.local',  dept:'Marketing',       pos:'CMO',                       status:'active',    start: isoDate(800), skills:['Brand','Growth','Google Analytics'],     langs:['EN','PL'] },
    { fn:'Łukasz',  ln:'Kaczmarek',  email:'lukasz.kaczmarek@hr.local',   dept:'Marketing',       pos:'Content & SEO Lead',        status:'active',    start: isoDate(340), skills:['SEO','Copywriting','Ahrefs'],            langs:['EN','PL'] },
    // Operacje
    { fn:'Natalia', ln:'Piotrowska', email:'natalia.piotrowska@hr.local', dept:'Operacje',        pos:'COO',                       status:'active',    start: isoDate(870), skills:['Lean','Six Sigma','JIRA'],               langs:['EN','PL','IT'] },
    { fn:'Marek',   ln:'Pawlak',     email:'marek.pawlak@hr.local',       dept:'Operacje',        pos:'Project Manager',           status:'active',    start: isoDate(430), skills:['Scrum','Risk Mgmt','MS Project'],        langs:['EN','PL'] },
    { fn:'Dawid',   ln:'Wojciechowski',email:'dawid.wojciechowski@hr.local',dept:'Operacje',      pos:'Business Analyst',          status:'inactive',  start: isoDate(510), skills:['SQL','Power BI','BPMN'],                 langs:['EN','PL'] },
    { fn:'Ewa',     ln:'Czarnecka',  email:'ewa.czarnecka@hr.local',      dept:'Operacje',        pos:'Office Manager',            status:'active',    start: isoDate(260), skills:['Administracja','Excel','SAP'],            langs:['PL'] },
  ];
  const empRefs: string[] = [];
  for (const e of empData) {
    const ref = await addDoc(collection(db, 'employees'), {
      firstName: e.fn, lastName: e.ln, email: e.email,
      departmentId: deptRefs[e.dept], positionId: e.pos,
      status: e.status, startDate: e.start,
      metadata: { skills: e.skills, languages: e.langs },
    });
    empRefs.push(ref.id);
  }

  // set manager IDs
  await updateDoc(doc(db,'departments',deptRefs['Inżynieria']),      { managerId: empRefs[0] });
  await updateDoc(doc(db,'departments',deptRefs['Sprzedaż']),        { managerId: empRefs[5] });
  await updateDoc(doc(db,'departments',deptRefs['Human Resources']), { managerId: empRefs[8] });
  await updateDoc(doc(db,'departments',deptRefs['Finanse']),         { managerId: empRefs[10] });
  await updateDoc(doc(db,'departments',deptRefs['Marketing']),       { managerId: empRefs[12] });
  await updateDoc(doc(db,'departments',deptRefs['Operacje']),        { managerId: empRefs[14] });

  // 3. JOB HISTORY subcollections
  log('Historia stanowisk…');
  const jobHistoryData: [number, {position:string;startDate:string;endDate?:string;salary:number}[]][] = [
    [0, [{ position:'Senior Engineer', startDate: isoDate(1200), endDate: isoDate(901), salary: 18000 }, { position:'CTO', startDate: isoDate(900), salary: 24000 }]],
    [1, [{ position:'Mid Frontend Dev', startDate: isoDate(900), endDate: isoDate(731), salary: 12000 }, { position:'Lead Frontend Developer', startDate: isoDate(730), salary: 17500 }]],
    [5, [{ position:'Account Executive', startDate: isoDate(1100), endDate: isoDate(821), salary: 9000 }, { position:'Head of Sales', startDate: isoDate(820), salary: 20000 }]],
  ];
  for (const [idx, history] of jobHistoryData) {
    const histCol = collection(db, 'employees', empRefs[idx], 'job_history');
    for (const h of history) await addDoc(histCol, h);
  }

  // 4. LEAVES
  log('Tworzenie urlopów…');
  type LeaveStatus = 'approved'|'pending'|'rejected'|'auto_approved';
  const leaveRows: {empIdx:number;type:string;from:number;to:number;status:LeaveStatus}[] = [
    // approved past leaves
    { empIdx:1, type:'vacation', from:80, to:74, status:'approved' },
    { empIdx:2, type:'vacation', from:120,to:116,status:'approved' },
    { empIdx:3, type:'sick',     from:30, to:28, status:'auto_approved' },
    { empIdx:4, type:'vacation', from:60, to:55, status:'approved' },
    { empIdx:5, type:'vacation', from:90, to:85, status:'approved' },
    { empIdx:6, type:'sick',     from:14, to:12, status:'auto_approved' },
    { empIdx:8, type:'vacation', from:200,to:195,status:'approved' },
    { empIdx:9, type:'vacation', from:50, to:46, status:'approved' },
    { empIdx:10,type:'vacation', from:150,to:144,status:'approved' },
    { empIdx:11,type:'sick',     from:7,  to:6,  status:'auto_approved' },
    { empIdx:12,type:'vacation', from:100,to:94, status:'approved' },
    { empIdx:14,type:'vacation', from:180,to:175,status:'approved' },
    // current on-leave (Anna)
    { empIdx:6, type:'vacation', from:5,  to:-5, status:'approved' },  // negative to = future
    // pending
    { empIdx:0, type:'vacation', from:-10,to:-14,status:'pending' },
    { empIdx:2, type:'vacation', from:-7, to:-11,status:'pending' },
    { empIdx:3, type:'vacation', from:-3, to:-7, status:'pending' },
    { empIdx:7, type:'paternity',from:-2, to:-16,status:'pending' },
    { empIdx:13,type:'vacation', from:-5, to:-9, status:'pending' },
    // rejected
    { empIdx:4, type:'unpaid',   from:-5, to:-12,status:'rejected' },
  ];
  const leaveNames = empData.map(e => `${e.fn} ${e.ln}`);
  for (const lr of leaveRows) {
    const sd = isoDate(lr.from);
    const ed = isoDate(lr.to);
    const days = Math.max(1, Math.abs(lr.from - lr.to));
    await addDoc(collection(db, 'leaves'), {
      employeeId: empRefs[lr.empIdx],
      employeeName: leaveNames[lr.empIdx],
      type: lr.type, startDate: sd, endDate: ed,
      daysCount: days, status: lr.status,
      approverId: lr.status === 'approved' ? empRefs[8] : undefined,
      createdAt: isoDate(lr.from + 2),
    });
  }

  // 5. LEAVE BALANCES
  log('Salda urlopowe…');
  for (let i = 0; i < empRefs.length; i++) {
    const vacUsed = rnd(0, 20);
    await addDoc(collection(db,'leave_balances'), {
      employeeId: empRefs[i], vacationTotal: 26, vacationUsed: vacUsed, sickUsed: rnd(0,8),
    });
  }

  // 6. ATTENDANCE (7 days for all active employees)
  log('Dane obecności…');
  const activeIdxs = empData.map((e,i)=>e.status==='active'?i:-1).filter(i=>i>=0);
  for (let dayAgo = 6; dayAgo >= 0; dayAgo--) {
    const date = isoDate(dayAgo);
    if ([5,6].includes(new Date(date).getDay())) continue; // skip weekends
    for (const idx of activeIdxs) {
      const isLate = Math.random() < 0.1;
      const inTime = (dayAgo === 0 ? Date.now() : new Date(date).getTime()) - (dayAgo === 0 ? 28800000 : 0);
      await addDoc(collection(db,'attendance'), {
        employeeId: empRefs[idx],
        employeeName: leaveNames[idx],
        date, totalHours: isLate ? rnd(5,7) : rnd(7,9),
        status: isLate ? 'late' : 'present',
        events: [
          { type:'in',  timestamp: inTime + (isLate ? 3600000 : 0), location:'Office' },
          { type:'out', timestamp: inTime + (isLate ? 3600000 : 0) + 28800000, location:'Office' },
        ],
      });
    }
  }

  // 7. BENEFITS
  log('Benefity…');
  const benefitsData = [
    { name:'LuxMed VIP',         provider:'LuxMed',         monthlyCost:290, description:'Pełna opieka medyczna z dentystą i okulistą' },
    { name:'MultiSport Platinum',provider:'Benefit Systems', monthlyCost:190, description:'Dostęp do wszystkich obiektów sportowych' },
    { name:'Ubezpieczenie Allianz',provider:'Allianz',       monthlyCost:95,  description:'Grupowe ubezpieczenie na życie' },
    { name:'Karta Lunchowa',     provider:'Edenred',          monthlyCost:450, description:'450 PLN miesięcznie na posiłki' },
    { name:'Parking',            provider:'Wewnętrzny',       monthlyCost:150, description:'Miejsce parkingowe w garażu HQ' },
    { name:'Remote Work Budget', provider:'Firmowy',          monthlyCost:200, description:'Zwrot za internet i sprzęt biurowy' },
  ];
  const benefitRefs: string[] = [];
  for (const b of benefitsData) {
    const ref = await addDoc(collection(db,'benefits'), b);
    benefitRefs.push(ref.id);
  }
  for (const empId of empRefs) {
    const count = rnd(2,4);
    const chosen = [...benefitRefs].sort(()=>Math.random()-0.5).slice(0,count);
    await addDoc(collection(db,'employee_benefits'), { employeeId: empId, benefitIds: chosen });
  }

  // 8. TRAININGS
  log('Szkolenia…');
  const trainingsData = [
    { title:'BHP Podstawowe',          mandatory:true,  validityMonths:12 },
    { title:'RODO dla pracownika',     mandatory:true,  validityMonths:24 },
    { title:'Bezpieczeństwo IT',       mandatory:true,  validityMonths:12 },
    { title:'React & TypeScript',      mandatory:false, validityMonths:0  },
    { title:'Leadership Essentials',   mandatory:false, validityMonths:0  },
    { title:'Google Analytics 4',      mandatory:false, validityMonths:18 },
    { title:'Scrum Master',            mandatory:false, validityMonths:0  },
    { title:'AWS Cloud Practitioner',  mandatory:false, validityMonths:36 },
    { title:'Efektywna komunikacja',   mandatory:false, validityMonths:0  },
  ];
  const trainingRefs: string[] = [];
  for (const t of trainingsData) {
    const ref = await addDoc(collection(db,'trainings'), t);
    trainingRefs.push(ref.id);
  }
  const completedDate = isoDate(90);
  const expiryDate = isoDate(-365);
  for (const empId of empRefs) {
    // mandatory always assigned
    for (const tId of trainingRefs.slice(0,3)) {
      const status = Math.random() < 0.85 ? 'completed' : 'pending';
      await addDoc(collection(db,'employee_trainings'), {
        employeeId: empId, trainingId: tId,
        completedDate: status==='completed' ? completedDate : null,
        expiryDate: status==='completed' ? expiryDate : null,
        status,
      });
    }
    // 1-3 optional
    const optional = trainingRefs.slice(3).sort(()=>Math.random()-0.5).slice(0,rnd(1,3));
    for (const tId of optional) {
      await addDoc(collection(db,'employee_trainings'), {
        employeeId: empId, trainingId: tId,
        completedDate, expiryDate: null, status:'completed',
      });
    }
  }

  // 9. REVIEWS (5-category format)
  log('Oceny pracownicze…');
  const periods = ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','Q1 2026'];
  const reviewable = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];
  for (const idx of reviewable) {
    const numReviews = rnd(1,3);
    for (let r=0;r<numReviews;r++) {
      const period = periods[periods.length - 1 - r];
      await addDoc(collection(db,'reviews'), {
        employeeId: empRefs[idx],
        reviewerId: empRefs[8], // HR reviews everyone
        period,
        date: isoDate(rnd(5,180)),
        status: 'submitted',
        ratings: {
          quality:       rnd(3,5),
          communication: rnd(2,5),
          teamwork:      rnd(3,5),
          initiative:    rnd(2,5),
          reliability:   rnd(3,5),
        },
        comments: pick([
          'Bardzo dobre wyniki i zaangażowanie w projekty kwartalne.',
          'Pracownik wykazuje inicjatywę i doskonale współpracuje z zespołem.',
          'Solidna realizacja zadań. Obszary do rozwoju: komunikacja.',
          'Wybitne wyniki techniczne. Lider w swoim obszarze.',
          'Dobra praca, terminowe dostarczanie zadań.',
          'Potrzeba większej proaktywności w komunikacji z interesariuszami.',
        ]),
      });
    }
  }

  // 10. JOBS & CANDIDATES
  log('Rekrutacja…');
  const jobRows = [
    { title:'Senior React Developer',     dept:'Inżynieria',      status:'open',   salaryRange:'18k – 26k PLN' },
    { title:'Node.js Backend Developer',  dept:'Inżynieria',      status:'open',   salaryRange:'16k – 22k PLN' },
    { title:'Talent Acquisition Spec.',   dept:'Human Resources', status:'open',   salaryRange:'9k – 13k PLN'  },
    { title:'Account Executive (Mid)',    dept:'Sprzedaż',        status:'open',   salaryRange:'10k – 16k PLN' },
    { title:'Growth Marketing Manager',   dept:'Marketing',       status:'closed', salaryRange:'13k – 18k PLN' },
  ];
  const jobRefs: string[] = [];
  for (const j of jobRows) {
    const ref = await addDoc(collection(db,'jobs'), {
      title: j.title, departmentId: deptRefs[j.dept], status: j.status, salaryRange: j.salaryRange,
    });
    jobRefs.push(ref.id);
  }

  type Stage = 'applied'|'screening'|'interview'|'offer'|'hired'|'rejected';
  const candidateRows: {fn:string;ln:string;email:string;jobIdx:number;stage:Stage;score:number}[] = [
    { fn:'Robert',   ln:'Kowalski',  email:'robert.k@mail.com',    jobIdx:0, stage:'interview', score:91 },
    { fn:'Patrycja', ln:'Nowacka',   email:'patrycja.n@mail.com',  jobIdx:0, stage:'offer',     score:96 },
    { fn:'Damian',   ln:'Wiśniak',   email:'damian.w@mail.com',    jobIdx:0, stage:'screening', score:78 },
    { fn:'Kinga',    ln:'Sobieraj',  email:'kinga.s@mail.com',     jobIdx:0, stage:'applied',   score:65 },
    { fn:'Filip',    ln:'Marczak',   email:'filip.m@mail.com',     jobIdx:1, stage:'interview', score:88 },
    { fn:'Wiktoria', ln:'Jankowska', email:'wiktoria.j@mail.com',  jobIdx:1, stage:'applied',   score:72 },
    { fn:'Szymon',   ln:'Ostrowski', email:'szymon.o@mail.com',    jobIdx:1, stage:'rejected',  score:45 },
    { fn:'Iga',      ln:'Świątek',   email:'iga.s@mail.com',       jobIdx:2, stage:'offer',     score:94 },
    { fn:'Konrad',   ln:'Bąk',       email:'konrad.b@mail.com',    jobIdx:2, stage:'screening', score:80 },
    { fn:'Alicja',   ln:'Głowacka',  email:'alicja.g@mail.com',    jobIdx:3, stage:'interview', score:85 },
    { fn:'Hubert',   ln:'Zawadzki',  email:'hubert.z@mail.com',    jobIdx:3, stage:'applied',   score:70 },
    { fn:'Zofia',    ln:'Kruk',      email:'zofia.k@mail.com',     jobIdx:4, stage:'hired',     score:97 },
  ];
  for (const c of candidateRows) {
    await addDoc(collection(db,'candidates'), {
      firstName: c.fn, lastName: c.ln, email: c.email,
      jobId: jobRefs[c.jobIdx], stage: c.stage, score: c.score,
    });
  }

  log('✅ Seed zakończony pomyślnie!');
}

// ─── UI ────────────────────────────────────────────────────────────────────
export default function SeedPage() {
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [done, setDone] = useState<'idle'|'ok'|'err'>('idle');

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleSeed = async () => {
    setRunning(true); setLogs([]); setDone('idle');
    try {
      await runSeed(addLog);
      setDone('ok');
    } catch (err: any) {
      addLog('❌ Błąd: ' + err.message);
      setDone('err');
    } finally {
      setRunning(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Usunąć WSZYSTKIE dane testowe?')) return;
    setRunning(true); setLogs(['Czyszczenie…']); setDone('idle');
    try {
      const COLS = ['departments','employees','leaves','leave_balances','attendance',
                    'benefits','employee_benefits','trainings','employee_trainings',
                    'reviews','jobs','candidates'];
      for (const c of COLS) { await clearCollection(c); addLog(`  ✓ ${c} wyczyszczone`); }
      setDone('ok');
    } catch (err: any) {
      addLog('❌ ' + err.message);
      setDone('err');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-6">
      <Card className="max-w-lg w-full border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Database className="text-primary" size={24} />
          </div>
          <CardTitle className="text-xl">Inicjalizacja bazy danych</CardTitle>
          <CardDescription>
            Generuje 18 pracowników, 6 działów, urlopy, oceny (5 kategorii),<br/>
            szkolenia, benefity, 5 ogłoszeń i 12 kandydatów.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {done === 'ok' && (
            <Alert className="bg-emerald-50 border-emerald-200 text-emerald-800">
              <CheckCircle2 size={16} /><AlertTitle>Sukces</AlertTitle>
              <AlertDescription className="text-xs">Dane zostały załadowane do Firestore.</AlertDescription>
            </Alert>
          )}
          {done === 'err' && (
            <Alert variant="destructive">
              <AlertCircle size={16} /><AlertTitle>Błąd</AlertTitle>
              <AlertDescription className="text-xs">Sprawdź logi poniżej.</AlertDescription>
            </Alert>
          )}

          {logs.length > 0 && (
            <div className="bg-muted/60 rounded-lg p-3 max-h-48 overflow-y-auto font-mono text-[11px] space-y-0.5 text-muted-foreground">
              {logs.map((l, i) => <div key={i}>{l}</div>)}
              {running && <div className="flex items-center gap-1 text-primary"><Loader2 size={10} className="animate-spin" /> pracuję…</div>}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={handleSeed} disabled={running} className="w-full h-11">
              {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Zap size={16} className="mr-2" />}
              Generuj dane testowe (18 prac.)
            </Button>
            <Button onClick={handleClear} disabled={running} variant="outline"
              className="w-full h-11 text-destructive hover:bg-destructive/10 border-destructive/30">
              <Trash2 size={16} className="mr-2" /> Wyczyść wszystkie kolekcje
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
