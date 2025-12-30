"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { getFirebaseAuth, getFirestoreDB } from "@/lib/firebase";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";

const steps = [
  { value: "company", title: "Company Details" },
  { value: "user", title: "User Details" },
  { value: "payment", title: "Payment Info" },
  { value: "documents", title: "Documents" },
];

const years = Array.from({ length: 30 }, (_, i) => `${new Date().getFullYear() - i}`);

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function StepperFormDemo({ onComplete }) {
  const db = getFirestoreDB();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    tin: "",
    description: "",
    brelaName: "",
    businessLicenceYear: "",
    location: "",
    firstName: "",
    phone: "",
    email: "",
    role: "",
    gender: "",
    paymentMethod: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    bankName: "",
    accountNumber: "",
    recipientName: "",
    recipientPhone: "",
  });

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const auth = getFirebaseAuth();
    return onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        update("email", u.email || "");
        update("firstName", u.displayName?.split(" ")[0] || "");
      }
    });
  }, []);

  // --- VALIDATION LOGIC ---
  const isStepValid = () => {
    if (step === 0) {
      return (
        form.companyName.trim() !== "" &&
        form.tin.trim() !== "" &&
        form.description.trim() !== "" &&
        form.brelaName.trim() !== "" &&
        form.businessLicenceYear !== "" &&
        form.location.trim() !== ""
      );
    }
    if (step === 1) {
      return (
        form.firstName.trim() !== "" &&
        form.phone.trim() !== "" &&
        form.email.trim() !== "" &&
        form.gender !== "" &&
        form.role !== ""
      );
    }
    if (step === 2) {
      if (form.paymentMethod === "card") {
        return form.cardNumber.trim() !== "" && form.expiry.trim() !== "" && form.cvv.trim() !== "";
      }
      if (form.paymentMethod === "bank") {
        return form.bankName.trim() !== "" && form.accountNumber.trim() !== "";
      }
      if (form.paymentMethod === "cash") {
        return form.recipientName.trim() !== "" && form.recipientPhone.trim() !== "";
      }
    }
    return true; // Step 3 (Documents) usually has internal validation in FileUpload
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    } else {
      toast.error("Please fill in all fields before continuing");
    }
  };
  
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  async function onSubmit() {
    if (!isStepValid()) return toast.error("Please complete all fields");
    if (!user) return toast.error("Please sign in to submit");

    try {
      setLoading(true);
      const uid = user.uid;
      const timestamp = serverTimestamp();

      const companyData = { uid, ...form, updatedAt: timestamp };

      await Promise.all([
        setDoc(doc(db, "company_details", uid), {
            uid,
            companyName: form.companyName,
            tin: form.tin,
            description: form.description,
            brelaName: form.brelaName,
            businessLicenceYear: form.businessLicenceYear,
            location: form.location,
            updatedAt: timestamp,
        }),
        setDoc(doc(db, "user_details", uid), {
            uid,
            firstName: form.firstName,
            phone: form.phone,
            email: form.email,
            role: form.role,
            gender: form.gender,
            updatedAt: timestamp,
        }),
        setDoc(doc(db, "users", uid), {
          uid,
          isSubmitted: true,
          status: "pending",
          updatedAt: timestamp,
        }, { merge: true })
      ]);

      toast.success("Submitted!");
      if (onComplete) onComplete(true);
    } catch (err) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="w-full mx-auto flex flex-col h-full justify-between" onSubmit={(e) => e.preventDefault()}>
      <div>
        <div className="flex items-center justify-center gap-10 mb-8">
          {steps.map((s, i) => (
            <div key={s.value} className="flex items-center gap-3">
              <div 
                className={`size-7 rounded-full flex items-center justify-center text-[10px] border font-bold transition-all duration-500
                ${i === step ? "bg-violet-500 border-violet-500 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]" : 
                  i < step ? "bg-emerald-500 border-emerald-400 text-white" : "border-white/10 text-slate-500"}`}>
                {i + 1}
              </div>
              <div className="hidden md:block">
                <div className={`text-[11px] font-bold uppercase tracking-widest ${i === step ? "text-white" : "text-slate-500"}`}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="min-h-[280px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col gap-4"
            >
              {step === 0 && (
                <>
                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <Input placeholder="Company Name" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} className="bg-white/5 border-white/10" />
                    <Input placeholder="TIN" value={form.tin} onChange={(e) => update("tin", e.target.value)} className="bg-white/5 border-white/10" />
                  </motion.div>
                  <motion.textarea
                    variants={itemVariants}
                    className="border border-white/10 rounded-md p-3 h-[80px] bg-white/5 text-sm outline-none focus:border-violet-500/50 transition-colors text-slate-200"
                    placeholder="Description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                  <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                    <Input placeholder="BRELA" value={form.brelaName} onChange={(e) => update("brelaName", e.target.value)} className="bg-white/5 border-white/10" />
                    <Select value={form.businessLicenceYear} onValueChange={(v) => update("businessLicenceYear", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-slate-200">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        {years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input placeholder="Location" value={form.location} onChange={(e) => update("location", e.target.value)} className="bg-white/5 border-white/10" />
                  </motion.div>
                </>
              )}

              {step === 1 && (
                <>
                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    <Input placeholder="First Name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} className="bg-white/5 border-white/10" />
                    <Input placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} className="bg-white/5 border-white/10" />
                  </motion.div>
                  <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                    <Input placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-white/5 border-white/10" />
                    <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-slate-200">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={form.role} onValueChange={(v) => update("role", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-slate-200">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="manager">Supplier</SelectItem>
                        <SelectItem value="director">Distributor</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </>
              )}

              {step === 2 && (
                <motion.div variants={itemVariants} className="space-y-4 w-full">
                  <Select value={form.paymentMethod} onValueChange={(v) => update("paymentMethod", v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 h-10">
                      <SelectValue placeholder="Select Payment Method" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                      <SelectItem value="card">Credit Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>

                  {form.paymentMethod === "bank" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Bank Name" value={form.bankName} onChange={(e) => update("bankName", e.target.value)} className="bg-white/5 border-white/10 h-10" />
                      <Input placeholder="Account Number" value={form.accountNumber} onChange={(e) => update("accountNumber", e.target.value)} className="bg-white/5 border-white/10 h-10" />
                    </div>
                  )}

                  {form.paymentMethod === "card" && (
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <Input placeholder="XXXX XXXX XXXX XXXX" value={form.cardNumber} onChange={(e) => update("cardNumber", e.target.value)} className="bg-white/5 border-white/10 h-10" />
                      </div>
                      <Input placeholder="MM/YY" value={form.expiry} onChange={(e) => update("expiry", e.target.value)} className="bg-white/5 border-white/10 h-10 text-center" />
                      <Input placeholder="CVV" value={form.cvv} onChange={(e) => update("cvv", e.target.value)} className="bg-white/5 border-white/10 h-10 text-center" />
                    </div>
                  )}

                  {form.paymentMethod === "cash" && (
                    <div className="grid grid-cols-2 gap-4">
                      <Input placeholder="Recipient Name" value={form.recipientName} onChange={(e) => update("recipientName", e.target.value)} className="bg-white/5 border-white/10 h-10" />
                      <Input placeholder="Recipient Phone" value={form.recipientPhone} onChange={(e) => update("recipientPhone", e.target.value)} className="bg-white/5 border-white/10 h-10" />
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div variants={itemVariants}>
                  <FileUpload />
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-8 flex justify-between border-t border-white/5 pt-6">
        <Button
          type="button"
          variant="ghost"
          disabled={step === 0}
          onClick={prevStep}
          className="text-slate-500 hover:text-white cursor-pointer"
        >
          Back
        </Button>

        {step === steps.length - 1 ? (
          <Button 
            type="button" 
            onClick={onSubmit}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 cursor-pointer"
          >
            {loading ? "Submitting..." : "Complete Registration"}
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={nextStep} 
            disabled={!isStepValid()} // Button visually shows it's locked until forms are filled
            className={`${!isStepValid() ? "bg-white/5 text-slate-600" : "bg-white/10 hover:bg-white/20 text-white"} px-8 transition-colors cursor-pointer`}
          >
            Next Step
          </Button>
        )}
      </div>
    </form>
  );
}