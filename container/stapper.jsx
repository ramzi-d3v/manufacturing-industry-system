"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation"; // ✅ FIX

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

/* --------------------------
   STEPS
-------------------------- */
const steps = [
  { value: "company", title: "Company Details", description: "Business info" },
  { value: "user", title: "User Details", description: "Personal info" },
  { value: "payment", title: "Payment Info", description: "Payment setup" },
  { value: "documents", title: "Documents", description: "Upload documents" },
];

const years = Array.from({ length: 30 }, (_, i) =>
  `${new Date().getFullYear() - i}`
);

export function StepperFormDemo({ onComplete }) {
  const router = useRouter(); // ✅ FIX
  const db = getFirestoreDB();

  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);

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
    birthday: "",
    paymentMethod: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    bankName: "",
    accountNumber: "",
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

  const nextStep = () =>
    setStep((s) => Math.min(s + 1, steps.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  /* --------------------------
     SUBMIT (FIXED)
  -------------------------- */
  async function onSubmit(e) {
  e.preventDefault();
  if (!user) return toast.error("Not authenticated");

  try {
    const uid = user.uid;

    // 1️⃣ Company
    await setDoc(
      doc(db, "companies", uid),
      {
        companyName: form.companyName,
        tin: form.tin,
        description: form.description,
        brelaName: form.brelaName,
        businessLicenceYear: form.businessLicenceYear,
        location: form.location,
        contact: form.contact,
        companyEmail: form.companyEmail,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 2️⃣ User
    await setDoc(
      doc(db, "users", uid),
      {
        firstName: form.firstName,
        phone: form.phone,
        email: form.email,
        role: form.role,
        birthday: form.birthday,
        isDecline: false, // default
        isAdmin: false,   // default
        isApproved: false, // needs admin approval
        profileCompleted: true, // unlock guard
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 3️⃣ Payment
    await setDoc(
      doc(db, "payments", uid),
      {
        uid,
        paymentMethod: form.paymentMethod,
        cardLast4: form.cardNumber?.slice(-4) || "",
        bankName: form.bankName || "",
        accountNumber: form.accountNumber || "",
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // 4️⃣ Documents
    await setDoc(
      doc(db, "documents", uid),
      {
        uid,
        uploaded: true,
        files: form.uploadedFiles || [], // optional, depends on FileUpload
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    toast.success("Registration completed!");
    if (onComplete) {
      onComplete();
    }
   // redirect to home
  } catch (err) {
    console.error(err);
    toast.error("Submission failed");
  }
}


  return (
    <form onSubmit={onSubmit} className="w-[80%] mx-auto">
      {/* --------------------------
          STEPPER HEADER
      -------------------------- */}
      <div className="flex items-center justify-center gap-6 mb-6">
        {steps.map((s, i) => (
          <div key={s.value} className="flex items-center gap-2">
            <div
              className={`size-8 rounded-full flex items-center justify-center border
              ${
                i === step
                  ? "bg-white text-black"
                  : i < step
                  ? "bg-green-500 text-white"
                  : "text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <div>
              <div className="font-semibold">{s.title}</div>
              <div className="text-xs text-muted-foreground">
                {s.description}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --------------------------
          STEP CONTENT (SMOOTH)
      -------------------------- */}
      <div className="relative overflow-hidden">
        <div
          key={step}
          className="animate-fade-slide" // ✅ smooth transition
        >
         {step === 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Company Name" value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              <Input placeholder="TIN" value={form.tin} onChange={(e) => update("tin", e.target.value)} />
            </div>

            <textarea
              className="border rounded-md p-2"
              placeholder="Description"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />

            <div className="grid grid-cols-3 gap-4">
              <Input placeholder="BRELA" value={form.brelaName} onChange={(e) => update("brelaName", e.target.value)} />
              <Select value={form.businessLicenceYear} onValueChange={(v) => update("businessLicenceYear", v)}>
                <SelectTrigger><SelectValue placeholder="Licence Year" /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input placeholder="Location" value={form.location} onChange={(e) => update("location", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Contact" value={form.contact} onChange={(e) => update("contact", e.target.value)} />
              <Input placeholder="Company Email" value={form.companyEmail} onChange={(e) => update("companyEmail", e.target.value)} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="First Name" value={form.firstName} onChange={(e) => update("firstName", e.target.value)} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              <Select value={form.role} onValueChange={(v) => update("role", v)}>
                <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="supplier">Supplier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="distributor">Distributor</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={form.birthday} onChange={(e) => update("birthday", e.target.value)} />
            </div>
          </div>
        )}

  {step === 2 && (
  <div className="flex flex-col gap-4">
    <Select
      value={form.paymentMethod}
      onValueChange={(v) => update("paymentMethod", v)}
    >
      <SelectTrigger>
        <SelectValue placeholder="Payment Method" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="card">Card</SelectItem>
        <SelectItem value="bank">Bank</SelectItem>
        <SelectItem value="cash">Cash</SelectItem>
      </SelectContent>
    </Select>

    {/* CARD */}
    {form.paymentMethod === "card" && (
      <div className="grid grid-cols-3 gap-4">
        <Input
          placeholder="XXX XXX XXX XXX"
          value={form.cardNumber}
          onChange={(e) => update("cardNumber", e.target.value)}
        />
        <Input
          placeholder="MM/YY"
          value={form.expiry}
          onChange={(e) => update("expiry", e.target.value)}
        />
        <Input
          placeholder="CVV"
          value={form.cvv}
          onChange={(e) => update("cvv", e.target.value)}
        />
      </div>
    )}

    {/* BANK */}
    {form.paymentMethod === "bank" && (
      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="Bank Name"
          value={form.bankName}
          onChange={(e) => update("bankName", e.target.value)}
        />
        <Input
          placeholder="Account Number"
          value={form.accountNumber}
          onChange={(e) => update("accountNumber", e.target.value)}
        />
      </div>
    )}

    {/* CASH */}
    {form.paymentMethod === "cash" && (
      <p className="text-sm text-muted-foreground">
        You will pay in cash upon delivery or visit.
      </p>
    )}
  </div>
)}


        {step === 3 && <FileUpload />}

        </div>
      </div>

      {/* --------------------------
          ACTIONS
      -------------------------- */}
      <div className="mt-6 flex justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0}
          onClick={prevStep}
        >
          Previous
        </Button>

        {step === steps.length - 1 ? (
          <Button type="submit">Complete</Button>
        ) : (
          <Button type="button" onClick={nextStep}>
            Next
          </Button>
        )}
      </div>
    </form>
  );
}
