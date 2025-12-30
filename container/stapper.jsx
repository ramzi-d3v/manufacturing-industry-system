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
import { ApprovalGuard } from "@/components/post-complete";

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
    contact: "",
    companyEmail: "",
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

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

async function onSubmit() {
  if (!user) return toast.error("Please sign in to submit");

  try {
    setLoading(true);
    const uid = user.uid;
    const timestamp = serverTimestamp();

    // 1. Prepare data for separate collections
    const companyData = {
      uid,
      companyName: form.companyName,
      tin: form.tin,
      description: form.description,
      brelaName: form.brelaName,
      businessLicenceYear: form.businessLicenceYear,
      location: form.location,
      updatedAt: timestamp,
    };

    const userData = {
      uid,
      firstName: form.firstName,
      phone: form.phone,
      email: form.email,
      role: form.role,
      gender: form.gender,
      updatedAt: timestamp,
    };

    const paymentData = {
      uid,
      paymentMethod: form.paymentMethod,
      bankName: form.bankName,
      accountNumber: form.accountNumber,
      recipientName: form.recipientName,
      updatedAt: timestamp,
    };

    // 2. Document Metadata (assuming FileUpload handles storage, 
    // or you pass the file info here)
    const documentData = {
      uid,
      // If your FileUpload component saves to state, include it here:
      // files: form.files || [], 
      submittedAt: timestamp,
      status: "pending_review"
    };

    // 3. Batch Write / Multiple SetDocs
    await Promise.all([
      setDoc(doc(db, "company_details", uid), companyData),
      setDoc(doc(db, "user_details", uid), userData),
      setDoc(doc(db, "payment_info", uid), paymentData),
      setDoc(doc(db, "documents", uid), documentData),
      
      // Update main users collection with your specific flags
      setDoc(doc(db, "users", uid), {
        uid,
        email: form.email,
        isSubmitted: true,
        isApproved: false,  // Default state
        isDeclined: false,  // Default state
        isAdmin: false,     // Default state (security: set this manually in console)
        status: "pending",
        updatedAt: timestamp,
      }, { merge: true })
    ]);

    toast.success("Registration submitted successfully!");
    localStorage.setItem('poststate', '1');

      // 2. Call the prop function to update the parent state IMMEDIATELY
      if (onComplete) {
        onComplete(true);
      }
  } catch (err) {
    console.error("Submission Error:", err);
    toast.error("Submission failed. Please try again.");
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
                onClick={() => i < step && setStep(i)}
                className={`size-7 rounded-full flex items-center justify-center text-[10px] border font-bold transition-all duration-500 cursor-pointer
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
                      <SelectTrigger className="bg-white/5 border-white/10 cursor-pointer text-slate-200">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        {years.map((y) => <SelectItem key={y} value={y} className="cursor-pointer">{y}</SelectItem>)}
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
                      <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 cursor-pointer">
                        <SelectValue placeholder="Gender" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        <SelectItem value="male" className="cursor-pointer">Male</SelectItem>
                        <SelectItem value="female" className="cursor-pointer">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={form.role} onValueChange={(v) => update("role", v)}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 cursor-pointer">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        <SelectItem value="staff" className="cursor-pointer">Staff</SelectItem>
                        <SelectItem value="manager" className="cursor-pointer">Manager</SelectItem>
                        <SelectItem value="director" className="cursor-pointer">Director</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </>
              )}

             {step === 2 && (
  <motion.div variants={itemVariants} className="space-y-4 w-full">
    {/* Full Width Method Selector */}
    <div className="">
      <Select value={form.paymentMethod} onValueChange={(v) => update("paymentMethod", v)}>
        <SelectTrigger className="bg-white/5 border-white/10 text-slate-200 h-10 cursor-pointer ">
          <SelectValue placeholder="Select Payment Method" />
        </SelectTrigger>
        <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
          <SelectItem value="card" className="cursor-pointer">Credit Card</SelectItem>
          <SelectItem value="bank" className="cursor-pointer">Bank Transfer</SelectItem>
          <SelectItem value="cash" className="cursor-pointer">Cash on Delivery</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Bank Transfer Layout - Matches width */}
    {form.paymentMethod === "bank" && (
      <div className="grid grid-cols-2 gap-4">
        <Input 
          placeholder="Bank Name" 
          value={form.bankName} 
          onChange={(e) => update("bankName", e.target.value)} 
          className="bg-white/5 border-white/10 h-10 text-sm" 
        />
        <Input 
          placeholder="Account Number" 
          value={form.accountNumber} 
          onChange={(e) => update("accountNumber", e.target.value)} 
          className="bg-white/5 border-white/10 h-10 text-sm" 
        />
      </div>
    )}

    {/* Credit Card - Single Row / Full Width */}
    {form.paymentMethod === "card" && (
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-2">
          <Input 
            placeholder="XXXX XXXX XXXX XXXX" 
            value={form.cardNumber} 
            onChange={(e) => update("cardNumber", e.target.value)} 
            className="bg-white/5 border-white/10 h-10 text-sm" 
          />
        </div>
        <Input 
          placeholder="MM/YY" 
          value={form.expiry} 
          onChange={(e) => update("expiry", e.target.value)} 
          className="bg-white/5 border-white/10 h-10 text-sm text-center" 
        />
        <Input 
          placeholder="CVV" 
          value={form.cvv} 
          onChange={(e) => update("cvv", e.target.value)} 
          className="bg-white/5 border-white/10 h-10 text-sm text-center" 
        />
      </div>
    )}

    {/* Cash Layout - Matches width */}
    {form.paymentMethod === "cash" && (
      <div className="space-y-4 p-4 bg-violet-500/5 border border-violet-500/10 rounded-md">
        <p className="text-[11px] text-slate-400 italic">Agent will collect payment in person.</p>
        <div className="grid grid-cols-2 gap-4">
          <Input 
            placeholder="Recipient Name" 
            value={form.recipientName} 
            onChange={(e) => update("recipientName", e.target.value)} 
            className="bg-white/5 border-white/10 h-10 text-sm" 
          />
          <Input 
            placeholder="Recipient Phone" 
            value={form.recipientPhone} 
            onChange={(e) => update("recipientPhone", e.target.value)} 
            className="bg-white/5 border-white/10 h-10 text-sm" 
          />
        </div>
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

        {step === steps.length - 1 && !loading ? (
          <Button 
            type="button" 
            onClick={onSubmit}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 cursor-pointer"
          >
            Complete Registration
          </Button>
        ) : loading ? (
          <Button 
            type="button" 
            disabled
            className="bg-white/10 text-white px-8 cursor-not-allowed"
          >
            Loading...
          </Button>
        ) : (
          <Button 
            type="button" 
            onClick={nextStep} 
            className="bg-white/10 hover:bg-white/20 text-white px-8 cursor-pointer"
          >
            Next Step
          </Button>
        )}
      </div>
    </form>
  );
}