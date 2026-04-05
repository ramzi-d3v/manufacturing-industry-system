import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

/**
 * Hook to fetch and calculate financial data
 * Calculates: revenue, expenses, profit, production stats, energy consumption
 */
export function useFinancials() {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [financials, setFinancials] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    profitMargin: 0,
    rawMaterialCost: 0,
    defectLoss: 0,
    totalInventoryValue: 0,
    productsManufactured: 0,
    rawMaterialsQuantity: 0,
    energyConsumption: 0,
    energyCost: 0,
  });

  // Fetch data and calculate metrics
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribes = [];

    // Fetch finished products (revenue source)
    const productsRef = collection(db, "finishedProducts", user.uid, "products");
    const productsQ = query(productsRef, orderBy("createdAt", "desc"));
    
    unsubscribes.push(onSnapshot(productsQ, (snapshot) => {
      let totalRevenue = 0;
      let totalProducts = 0;
      
      snapshot.docs.forEach((doc) => {
        const product = doc.data();
        const revenue = (product.sellingPrice || 0) * (product.quantity || 0);
        totalRevenue += revenue;
        totalProducts += (product.quantity || 0);
      });

      setFinancials(prev => ({
        ...prev,
        revenue: totalRevenue,
        productsManufactured: totalProducts,
      }));
    }, (err) => {
      console.error("Error fetching finished products:", err);
    }));

    // Fetch raw materials (expense source)
    const materialsRef = collection(db, "rawMaterials", user.uid, "materials");
    const materialsQ = query(materialsRef, orderBy("createdAt", "desc"));
    
    unsubscribes.push(onSnapshot(materialsQ, (snapshot) => {
      let rawMaterialCost = 0;
      let totalQuantity = 0;
      
      snapshot.docs.forEach((doc) => {
        const material = doc.data();
        const cost = (material.unitPrice || 0) * (material.quantity || 0);
        rawMaterialCost += cost;
        totalQuantity += (material.quantity || 0);
      });

      setFinancials(prev => ({
        ...prev,
        rawMaterialCost,
        rawMaterialsQuantity: totalQuantity,
      }));
    }, (err) => {
      console.error("Error fetching raw materials:", err);
    }));

    // Fetch defect reports (expense/loss source)
    const defectsRef = collection(db, "defectReports");
    const defectsQ = query(defectsRef, orderBy("createdAt", "desc"));
    
    unsubscribes.push(onSnapshot(defectsQ, (snapshot) => {
      let defectLoss = 0;
      
      snapshot.docs.forEach((doc) => {
        const defect = doc.data();
        defectLoss += (defect.totalLoss || 0);
      });

      setFinancials(prev => ({
        ...prev,
        defectLoss,
      }));
    }, (err) => {
      console.error("Error fetching defect reports:", err);
    }));

    // Fetch energy consumption data
    const energyRef = collection(db, "energyConsumption");
    const energyQ = query(energyRef, orderBy("timestamp", "desc"));
    
    unsubscribes.push(onSnapshot(energyQ, (snapshot) => {
      let totalConsumption = 0;
      let totalEnergyCost = 0;
      
      snapshot.docs.forEach((doc) => {
        const energy = doc.data();
        totalConsumption += (energy.consumption || 0);
        // Use cost field if available, otherwise calculate from consumption and costPerUnit
        const energyCost = energy.cost || ((energy.consumption || 0) * (energy.costPerUnit || 0));
        totalEnergyCost += energyCost;
      });

      setFinancials(prev => ({
        ...prev,
        energyConsumption: totalConsumption,
        energyCost: totalEnergyCost,
      }));
    }, (err) => {
      console.error("Error fetching energy data:", err);
    }));

    // After a short delay, calculate derived values and finish loading
    const timer = setTimeout(() => {
      setFinancials(prev => {
        const totalExpenses = prev.rawMaterialCost + prev.defectLoss + prev.energyCost;
        const profit = prev.revenue - totalExpenses;
        const profitMargin = prev.revenue > 0 ? (profit / prev.revenue) * 100 : 0;

        return {
          ...prev,
          expenses: totalExpenses,
          profit,
          profitMargin,
          totalInventoryValue: prev.rawMaterialCost + (prev.revenue / 2),
        };
      });
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timer);
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [user]);

  return { loading, financials };
}
