import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  addDoc,
  query, 
  where, 
  orderBy,
  runTransaction
} from "firebase/firestore";
import { Benefit, EmployeeBenefit } from "@/types";

const BENEFITS_COL = "benefits";
const EMP_BENEFITS_COL = "employee_benefits";
const BUDGET_LIMIT = 500;

export const getAvailableBenefits = async (): Promise<Benefit[]> => {
  const col = collection(db, BENEFITS_COL);
  const snapshot = await getDocs(query(col, orderBy("name")));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Benefit));
};

export const createBenefit = async (data: Omit<Benefit, "id">): Promise<string> => {
  const ref = await addDoc(collection(db, BENEFITS_COL), data);
  return ref.id;
};

export const deleteBenefit = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, BENEFITS_COL, id));
};

export const getEmployeeBenefits = async (employeeId: string): Promise<string[]> => {
  const docRef = doc(db, EMP_BENEFITS_COL, employeeId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return (docSnap.data() as EmployeeBenefit).benefitIds;
  }
  return [];
};

export const enrollInBenefit = async (employeeId: string, benefitId: string): Promise<void> => {
  await runTransaction(db, async (transaction) => {
    // 1. Get all available benefits to find the cost of the new one
    const benefitRef = doc(db, BENEFITS_COL, benefitId);
    const benefitSnap = await transaction.get(benefitRef);
    if (!benefitSnap.exists()) throw new Error("Benefit nie istnieje.");
    const newBenefit = benefitSnap.data() as Benefit;

    // 2. Get current employee benefits
    const empBenefitRef = doc(db, EMP_BENEFITS_COL, employeeId);
    const empBenefitSnap = await transaction.get(empBenefitRef);
    
    let currentBenefitIds: string[] = [];
    if (empBenefitSnap.exists()) {
      currentBenefitIds = (empBenefitSnap.data() as EmployeeBenefit).benefitIds;
    }

    if (currentBenefitIds.includes(benefitId)) return; // Already enrolled

    // 3. Calculate total cost
    let totalCost = newBenefit.monthlyCost;
    for (const id of currentBenefitIds) {
      const bRef = doc(db, BENEFITS_COL, id);
      const bSnap = await transaction.get(bRef);
      if (bSnap.exists()) {
        totalCost += (bSnap.data() as Benefit).monthlyCost;
      }
    }

    // 4. Check budget limit
    if (totalCost > BUDGET_LIMIT) {
      throw new Error(`Przekroczono miesięczny limit benefitów (${BUDGET_LIMIT} PLN). Twój aktualny wybór to ${totalCost} PLN.`);
    }

    // 5. Update enrollment
    const updatedIds = [...currentBenefitIds, benefitId];
    transaction.set(empBenefitRef, { employeeId, benefitIds: updatedIds });
  });
};

export const unenrollFromBenefit = async (employeeId: string, benefitId: string): Promise<void> => {
  const empBenefitRef = doc(db, EMP_BENEFITS_COL, employeeId);
  const empBenefitSnap = await getDoc(empBenefitRef);
  
  if (empBenefitSnap.exists()) {
    const currentIds = (empBenefitSnap.data() as EmployeeBenefit).benefitIds;
    const updatedIds = currentIds.filter(id => id !== benefitId);
    await setDoc(empBenefitRef, { employeeId, benefitIds: updatedIds });
  }
};
