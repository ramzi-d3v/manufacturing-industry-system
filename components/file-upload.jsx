// Full stepper form with integrated FileUpload component
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

//-------------------------------------------------------------
// FILE UPLOAD COMPONENT WITH DOCUMENT TYPE
//-------------------------------------------------------------
export const FileUpload = ({}) => {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState({});
  const [docType, setDocType] = useState(""); // DOCUMENT TYPE
  const maxUploads = 5;
  const maxFileSizeMB = 10;

  const allowedFileTypes = ["application/pdf", "image/jpeg", "image/png"];

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (!docType) {
      toast("Select document type first");
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      if (!allowedFileTypes.includes(file.type)) {
        toast("Invalid file type: " + file.type);
        return false;
      }
      if (file.size > maxFileSizeMB * 1024 * 1024) {
        toast(`${file.name} exceeds ${maxFileSizeMB}MB`);
        return false;
      }
      return true;
    });

    const totalFiles = [...files, ...validFiles].slice(0, maxUploads);
    setFiles(totalFiles);

    const newStatus = {};
    totalFiles.forEach((file) => {
      if (!uploadStatus[file.name]) {
        newStatus[file.name] = 0;
      }
    });

    setUploadStatus((prev) => ({ ...prev, ...newStatus }));
    e.target.value = "";
  };

  useEffect(() => {
    Object.keys(uploadStatus).forEach((fileName) => {
      if (uploadStatus[fileName] < 100) {
        const interval = setInterval(() => {
          setUploadStatus((prev) => {
            const newProgress = prev[fileName] + 5;
            if (newProgress >= 100) {
              clearInterval(interval);
              return { ...prev, [fileName]: 100 };
            }
            return { ...prev, [fileName]: newProgress };
          });
        }, 150);
        return () => clearInterval(interval);
      }
    });
  }, [uploadStatus]);

  const removeFile = (name) => {
    setFiles(files.filter((f) => f.name !== name));
    const newStatus = { ...uploadStatus };
    delete newStatus[name];
    setUploadStatus(newStatus);
  };

  return (
    <div className="space-y-4 p-4 border rounded-xl bg-card/40 backdrop-blur">
      <Label className="font-medium text-lg">Upload Documents</Label>

      {/* DOCUMENT TYPE DROPDOWN */}
      <div className="space-y-2">
        <Label>Select Document Type</Label>
        <Select onValueChange={(v) => setDocType(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Choose type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="certification">Certification</SelectItem>
            <SelectItem value="license">License</SelectItem>
            <SelectItem value="nida">National ID (NIDA)</SelectItem>
            <SelectItem value="driving">Driving Permit</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* FILE DISPLAY + PROGRESS */}
      <div className="flex flex-col gap-3">
        {files.map((file) => (
          <div key={file.name} className="p-3 border rounded-lg bg-muted/40">
            <div className="flex justify-between mb-1 text-sm">
              <p>{file.name}</p>
              <p>{uploadStatus[file.name]}%</p>
            </div>
            <Progress value={uploadStatus[file.name]} />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => removeFile(file.name)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>

      {/* FILE INPUT */}
      <div>
        <Input
          type="file"
          multiple
          disabled={!docType}
          className={`cursor-pointer ${!docType ? "opacity-50 cursor-not-allowed" : ""}`}
          onChange={handleFileInput}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Allowed: PDF, PNG, JPG — Max {maxUploads} files, {maxFileSizeMB}MB each.
        </p>
      </div>
    </div>
  );
};

//-------------------------------------------------------------
// VALIDATION SCHEMA
//-------------------------------------------------------------
const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  role: z.string().min(1),
  companyUser: z.string().min(2),  // ADDED
  bio: z.string().min(10),
  company: z.string().min(2),
  website: z.string().optional(),
  accountNumber: z.string().min(5),
  bankName: z.string().min(2),
});

//-------------------------------------------------------------
// MAIN STEPPER COMPONENT
//-------------------------------------------------------------
const steps = ["user", "company", "payment", "documents", "review"];

export default function FullStepperForm() {
  const [step, setStep] = useState(0);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      role: "",
      companyUser: "", // ADDED
      bio: "",
      company: "",
      website: "",
      accountNumber: "",
      bankName: "",
    },
  });

  const next = async () => {
    const valid = await form.trigger();
    if (!valid) return toast("Please complete the required fields");
    setStep((s) => s + 1);
  };

  const prev = () => setStep((s) => s - 1);

  const submitFinal = (data) => {
    toast.success("Form Submitted!");
    console.log(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Multi-Step Registration</h1>

      {/* STEP INDICATOR */}
      <div className="flex gap-4 justify-center">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all duration-200 ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          ></div>
        ))}
      </div>

      {/* FORM */}
      <form onSubmit={form.handleSubmit(submitFinal)} className="space-y-6">
        {step === 0 && (
          <div className="space-y-4">
            {/* FIRST + LAST NAME */}
            <Label>First Name</Label>
            <Input {...form.register("firstName")} />
            <Label>Last Name</Label>
            <Input {...form.register("lastName")} />
            <Label>Email</Label>
            <Input {...form.register("email")} />

            {/* ROLE + COMPANY NAME (SIDE BY SIDE) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Role</Label>
                <Select onValueChange={(v) => form.setValue("role", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="supplier">Supplier</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Company Name</Label>
                <Input {...form.register("companyUser")} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Label>Company</Label>
            <Input {...form.register("company")} />
            <Label>Website</Label>
            <Input {...form.register("website")} />
            <Label>Bio</Label>
            <Textarea {...form.register("bio")} className="min-h-[120px]" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Bank Name</Label>
            <Input {...form.register("bankName")} />
            <Label>Account Number</Label>
            <Input {...form.register("accountNumber")} />
          </div>
        )}

        {step === 3 && <FileUpload />}

        {step === 4 && (
          <div className="p-4 border rounded-lg">
            <h2 className="font-medium text-lg mb-2">Review Your Details</h2>
            <pre className="text-sm bg-muted p-3 rounded-lg">
              {JSON.stringify(form.getValues(), null, 2)}
            </pre>
          </div>
        )}

        {/* BUTTONS */}
        <div className="flex justify-between">
          {step > 0 ? (
            <Button type="button" variant="outline" onClick={prev}>
              Previous
            </Button>
          ) : (
            <div></div>
          )}

          {step === steps.length - 1 ? (
            <Button type="submit">Submit</Button>
          ) : (
            <Button type="button" onClick={next}>
              Next
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
