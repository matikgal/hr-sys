'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Database, Trash2, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const clearCollection = async (name: string) => {
    const col = collection(db, name);
    const snap = await getDocs(col);
    if (snap.empty) return;
    
    // Delete in batches or parallel
    const promises = snap.docs.map(d => deleteDoc(doc(db, name, d.id)));
    await Promise.all(promises);
    console.log(`Cleared ${name}`);
  };

  const seedData = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const collections = ["employees", "departments", "benefits", "trainings", "jobs", "candidates", "leaves", "attendance", "employee_benefits", "employee_trainings", "reviews"];
      
      // Sequential clearing to avoid overwhelming the connection
      for (const c of collections) {
        await clearCollection(c);
      }

      // 1. Departments
      const depts = [
        { name: "IT & Engineering", managerId: "", location: "Warszawa, HQ", budget: 250000 },
        { name: "Human Resources", managerId: "", location: "Kraków, Hub", budget: 80000 },
        { name: "Sales & Marketing", managerId: "", location: "Wrocław, Office", budget: 150000 },
        { name: "Finance", managerId: "", location: "Warszawa, HQ", budget: 120000 }
      ];
      
      const deptRefs = await Promise.all(depts.map(d => addDoc(collection(db, "departments"), d)));

      // 2. Employees
      const empData = [
        {
          firstName: "Admin",
          lastName: "Systemowy",
          email: "admin@hr.local",
          departmentId: deptRefs[0].id,
          positionId: "Chief Technology Officer",
          status: "active",
          startDate: "2023-01-01",
          metadata: { skills: ["Architecture", "Firebase", "Leadership"], languages: ["English", "Polish", "German"] }
        },
        {
          firstName: "Jan",
          lastName: "Kowalski",
          email: "user@hr.local",
          departmentId: deptRefs[1].id,
          positionId: "HR Business Partner",
          status: "active",
          startDate: "2023-03-15",
          metadata: { skills: ["Recruitment", "Coaching", "Mediation"], languages: ["English", "Polish"] }
        },
        {
          firstName: "Marta",
          lastName: "Zielińska",
          email: "marta.zielinska@hr.local",
          departmentId: deptRefs[0].id,
          positionId: "Senior Frontend Developer",
          status: "active",
          startDate: "2023-06-01",
          metadata: { skills: ["React", "TypeScript", "Tailwind"], languages: ["English"] }
        },
        {
          firstName: "Piotr",
          lastName: "Nowak",
          email: "piotr.nowak@hr.local",
          departmentId: deptRefs[2].id,
          positionId: "Account Manager",
          status: "active",
          startDate: "2023-02-10",
          metadata: { skills: ["Salesforce", "Negotiations"], languages: ["English", "French"] }
        }
      ];

      const empRefs = await Promise.all(empData.map(e => addDoc(collection(db, "employees"), e)));

      // Update Department Managers
      await updateDoc(doc(db, "departments", deptRefs[0].id), { managerId: empRefs[0].id });
      await updateDoc(doc(db, "departments", deptRefs[1].id), { managerId: empRefs[1].id });

      // 3. Attendance for today
      const today = new Date().toISOString().split('T')[0];
      const attendanceData = empRefs.map(emp => ({
        employeeId: emp.id,
        employeeName: "Employee", // Will be fetched in real app
        date: today,
        events: [
          { type: 'in', timestamp: Date.now() - 28800000, location: 'Office' }, // 8h ago
          { type: 'out', timestamp: Date.now() - 14400000, location: 'Office' }, // 4h ago
          { type: 'in', timestamp: Date.now() - 10800000, location: 'Remote' } // 3h ago
        ],
        totalHours: 5.0,
        status: 'present'
      }));

      await Promise.all(attendanceData.map(a => addDoc(collection(db, "attendance"), a)));

      // 4. Benefits
      const benefits = [
        { name: "LuxMed VIP", provider: "LuxMed", monthlyCost: 250, description: "Pełna opieka medyczna z dentystą" },
        { name: "MultiSport Platinum", provider: "Benefit Systems", monthlyCost: 180, description: "Dostęp do wszystkich obiektów" },
        { name: "Ubezpieczenie Allianz", provider: "Allianz", monthlyCost: 90, description: "Grupowe ubezpieczenie na życie" },
        { name: "Lunch Card", provider: "Edenred", monthlyCost: 400, description: "Karta lunchowa 400 PLN/msc" }
      ];
      await Promise.all(benefits.map(b => addDoc(collection(db, "benefits"), b)));

      // 5. Recruitment
      const jobs = [
        { title: "Node.js Developer", departmentId: deptRefs[0].id, status: "open", salaryRange: "15k - 22k PLN" },
        { title: "Talent Acquisition Specialist", departmentId: deptRefs[1].id, status: "open", salaryRange: "8k - 12k PLN" }
      ];
      const jobRefs = await Promise.all(jobs.map(j => addDoc(collection(db, "jobs"), j)));

      const candidates = [
        { firstName: "Robert", lastName: "Lewandowski", email: "robert@goals.com", jobId: jobRefs[0].id, stage: "interview", score: 92 },
        { firstName: "Iga", lastName: "Świątek", email: "iga@tennis.com", jobId: jobRefs[1].id, stage: "applied", score: 88 }
      ];
      await Promise.all(candidates.map(c => addDoc(collection(db, "candidates"), c)));

      // 6. Reviews
      const reviews = [
        { employeeId: empRefs[2].id, reviewerId: empRefs[0].id, rating: 5, comment: "Wybitne wyniki w kwartale Q1.", date: today },
        { employeeId: empRefs[3].id, reviewerId: empRefs[1].id, rating: 4, comment: "Dobra realizacja celów sprzedażowych.", date: today }
      ];
      await Promise.all(reviews.map(r => addDoc(collection(db, "reviews"), r)));

      setStatus({ type: 'success', message: 'System HR Nexus został pomyślnie zainicjalizowany spójnymi danymi.' });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', message: 'Błąd podczas zasilania bazy: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!confirm("CZY NA PEWNO? To usunie WSZYSTKIE dane z wybranych kolekcji!")) return;
    setLoading(true);
    setStatus(null);
    try {
      const collections = ["employees", "departments", "benefits", "trainings", "jobs", "candidates", "leaves", "attendance", "employee_benefits", "employee_trainings", "reviews"];
      await Promise.all(collections.map(c => clearCollection(c)));
      setStatus({ type: 'success', message: 'Baza danych została wyczyszczona.' });
    } catch (err: any) {
      setStatus({ type: 'error', message: 'Błąd podczas czyszczenia bazy: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="max-w-md w-full shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Database className="text-primary" size={24} />
          </div>
          <CardTitle className="text-xl">Inicjalizacja Bazy Danych</CardTitle>
          <CardDescription>Panel administracyjny do zarządzania danymi testowymi HR Nexus.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status && (
            <Alert variant={status.type === 'success' ? 'default' : 'destructive'} className={status.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : ''}>
              {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <AlertTitle>{status.type === 'success' ? 'Sukces' : 'Błąd'}</AlertTitle>
              <AlertDescription className="text-xs">{status.message}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4">
            <Button onClick={seedData} disabled={loading} className="w-full h-11">
              <Zap size={18} className="mr-2" /> Generuj Dane Testowe
            </Button>
            <Button onClick={handleClear} disabled={loading} variant="outline" className="w-full h-11 text-destructive hover:bg-destructive/10">
              <Trash2 size={18} className="mr-2" /> Wyczyść Bazę Danych
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
