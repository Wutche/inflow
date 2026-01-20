"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Copy,
  Check,
  Link as LinkIcon,
  FileText,
  User,
  DollarSign,
  MessageSquare,
  Mail,
  Send,
  Loader2,
} from "lucide-react";
import QRCode from "qrcode";
import { createPaymentUrl, InvoiceInput, InvoiceSchema } from "@/lib/url-state";
import { useInvoiceHistory } from "@/hooks/useInvoiceHistory";
import { useNotifications } from "@/hooks/useNotifications";
import { sendInvoiceEmail, isValidEmail } from "@/lib/email";

interface FormErrors {
  recipient?: string;
  amount?: string;
  memo?: string;
}

/**
 * Form component for creating shareable invoice payment links.
 * Uses the State-in-URL pattern to encode invoice data into a single Base64 token.
 */
export function CreateInvoiceForm() {
  // Form state
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [token] = useState("USDC"); // Currently fixed to USDC
  const [network, setNetwork] = useState<"stacks" | "ethereum">("stacks");

  // UI state
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Email state
  const [clientEmail, setClientEmail] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // History hook for persisting generated invoices
  const { saveInvoice } = useInvoiceHistory();
  
  // Notifications hook
  const { addNotification } = useNotifications();

  /**
   * Get placeholder text based on network selection.
   * - Stacks: Payer pays with USDCx, so merchant enters their ETH address to receive
   * - Ethereum: Payer pays with USDC on ETH, so merchant enters their Stacks address to receive
   */
  const getRecipientPlaceholder = () => {
    return network === "stacks"
      ? "0x742d35Cc6634C0532925a3b..." // ETH address for Stacks payment
      : "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"; // Stacks address for ETH payment
  };

  const getRecipientLabel = () => {
    return network === "stacks"
      ? "Your Ethereum Address (to receive USDC)"
      : "Your Stacks Address (to receive USDCx)";
  };

  /**
   * Validates form inputs using the Zod schema.
   * Returns true if valid, updates error state if not.
   */
  const validateForm = useCallback((): boolean => {
    const data: InvoiceInput = {
      recipient,
      amount,
      memo: memo || undefined,
      token,
      network,
    };

    const result = InvoiceSchema.safeParse(data);

    if (!result.success) {
      const newErrors: FormErrors = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof FormErrors;
        if (path) {
          newErrors[path] = issue.message;
        }
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [recipient, amount, memo, token, network]);

  /**
   * Generates the shareable payment link using Base64 encoding.
   */
  const generateLink = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    const invoiceId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    const invoiceData: InvoiceInput = {
      invoiceId,
      recipient,
      amount,
      memo: memo || undefined,
      token,
      network,
      createdAt,
    };

    // Get the current origin for the full URL
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const paymentUrl = createPaymentUrl(invoiceData, origin);

    // Generate QR code for the payment URL
    try {
      const qr = await QRCode.toDataURL(paymentUrl, { width: 200, margin: 2 });
      setQrCodeUrl(qr);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setQrCodeUrl(null);
    }

    // Save to local history with the same ID
    saveInvoice({
      id: invoiceId, // Use the same ID as in the payment URL
      recipient,
      amount,
      token,
      link: paymentUrl,
      network,
    });

    // Create notification for the new invoice
    addNotification(
      "invoice_created",
      "Invoice Created",
      `New invoice for $${amount} ${token} has been generated`
    );

    setGeneratedLink(paymentUrl);
    setCopied(false);
  }, [recipient, amount, memo, token, network, validateForm, saveInvoice, addNotification]);

  /**
   * Copies the generated link to clipboard.
   */
  const copyToClipboard = useCallback(async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = generatedLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedLink]);

  /**
   * Clears the error for a specific field when user starts typing.
   */
  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Sends the invoice via email to the client.
   */
  const sendEmail = useCallback(async () => {
    if (!generatedLink || !clientEmail) return;

    // Validate email
    if (!isValidEmail(clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSendingEmail(true);
    setEmailError(null);
    setEmailSent(false);

    const result = await sendInvoiceEmail({
      to_email: clientEmail,
      amount,
      token,
      recipient,
      network,
      pay_link: generatedLink,
      memo: memo || undefined,
    });

    setIsSendingEmail(false);

    if (result.success) {
      setEmailSent(true);
      addNotification(
        "invoice_sent",
        "Invoice Sent",
        `Invoice emailed to ${clientEmail}`
      );
      // Reset after 3 seconds
      setTimeout(() => {
        setEmailSent(false);
        setClientEmail("");
      }, 3000);
    } else {
      setEmailError(result.message);
    }
  }, [generatedLink, clientEmail, amount, token, recipient, network, memo, addNotification]);

  return (
    <div className="bg-white rounded-3xl border border-border-subtle p-8 max-w-xl mx-auto dark:bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center">
          <FileText className="w-6 h-6 text-brand-orange" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">Create Invoice</h2>
          <p className="text-sm text-muted">
            Generate a shareable payment link
          </p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-6">
        {/* Payment Network Selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            Payment Network
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setNetwork("stacks")}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                network === "stacks"
                  ? "border-brand-orange bg-brand-orange/5"
                  : "border-border-subtle bg-sidebar hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#5546FF] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://cryptologos.cc/logos/stacks-stx-logo.png"
                    className="w-4 h-4 brightness-0 invert"
                    alt="Stacks"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Pay with USDCx</p>
                  <p className="text-[10px] text-muted">On Stacks</p>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setNetwork("ethereum")}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                network === "ethereum"
                  ? "border-brand-orange bg-brand-orange/5"
                  : "border-border-subtle bg-sidebar hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#627EEA] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://cryptologos.cc/logos/ethereum-eth-logo.png"
                    className="w-4 h-4 brightness-0 invert"
                    alt="Ethereum"
                  />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Pay with USDC</p>
                  <p className="text-[10px] text-muted">On Ethereum</p>
                </div>
              </div>
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">
            {network === "stacks"
              ? "Payer will send USDCx on Stacks → You receive USDC on Ethereum"
              : "Payer will send USDC on Ethereum → You receive USDCx on Stacks"}
          </p>
        </div>

        {/* Recipient Address */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <User size={14} className="text-muted" />
            {getRecipientLabel()}
          </label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              clearError("recipient");
            }}
            placeholder={getRecipientPlaceholder()}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.recipient ? "border-red-500" : "border-border-subtle"
            } bg-sidebar focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm font-mono`}
          />
          {errors.recipient && (
            <p className="mt-1 text-xs text-red-500">{errors.recipient}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <DollarSign size={14} className="text-muted" />
            Amount (USDC)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              // Only allow numbers and decimal point
              const value = e.target.value.replace(/[^0-9.]/g, "");
              setAmount(value);
              clearError("amount");
            }}
            placeholder="100.00"
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.amount ? "border-red-500" : "border-border-subtle"
            } bg-sidebar focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm`}
          />
          {errors.amount && (
            <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
          )}
        </div>

        {/* Memo (Optional) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-bold mb-2">
            <MessageSquare size={14} className="text-muted" />
            Memo
            <span className="text-muted font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={memo}
            onChange={(e) => {
              setMemo(e.target.value);
              clearError("memo");
            }}
            placeholder="Payment for services 🎉"
            maxLength={50}
            className={`w-full px-4 py-3 rounded-xl border ${
              errors.memo ? "border-red-500" : "border-border-subtle"
            } bg-sidebar focus:outline-none focus:ring-2 focus:ring-brand-orange/20 focus:border-brand-orange transition-all text-sm`}
          />
          <div className="flex justify-between mt-1">
            {errors.memo ? (
              <p className="text-xs text-red-500">{errors.memo}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-muted">{memo.length}/50</span>
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={generateLink}
          className="w-full py-4 bg-brand-orange text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-brand-orange/90 transition-colors cursor-pointer"
        >
          <LinkIcon size={18} />
          Generate Payment Link
        </motion.button>

        {/* Generated Link Display */}
        {generatedLink && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-sidebar rounded-xl border border-border-subtle"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Payment Link
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={copyToClipboard}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  copied
                    ? "bg-green-100 text-green-700"
                    : "bg-white border border-border-subtle hover:bg-gray-50"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </motion.button>
            </div>
            <p className="text-xs font-mono text-muted break-all leading-relaxed">
              {generatedLink}
            </p>
            {/* QR Code Display */}
            {qrCodeUrl && (
              <div className="mt-4 flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrCodeUrl}
                  alt="Invoice QR Code"
                  className="w-40 h-40 rounded-lg"
                />
                <p className="text-xs text-muted mt-2">Scan to pay</p>
              </div>
            )}

            {/* Email Invoice Section */}
            <div className="mt-6 pt-6 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-3">
                <Mail size={14} className="text-muted" />
                <span className="text-xs font-bold text-muted uppercase tracking-wider">
                  Send via Email
                </span>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => {
                      setClientEmail(e.target.value);
                      setEmailError(null);
                    }}
                    placeholder="client@email.com"
                    disabled={isSendingEmail || emailSent}
                    className={`w-full px-4 py-3 rounded-xl border text-sm ${
                      emailError 
                        ? "border-red-500" 
                        : emailSent 
                          ? "border-green-500 bg-green-50"
                          : "border-border-subtle"
                    } bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-brand-orange/20 transition-all disabled:opacity-50`}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: isSendingEmail || emailSent ? 1 : 1.02 }}
                  whileTap={{ scale: isSendingEmail || emailSent ? 1 : 0.98 }}
                  onClick={sendEmail}
                  disabled={!clientEmail || isSendingEmail || emailSent}
                  className={`px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                    emailSent
                      ? "bg-green-500 text-white"
                      : "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSendingEmail ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span className="hidden sm:inline">Sending...</span>
                    </>
                  ) : emailSent ? (
                    <>
                      <Check size={16} />
                      <span className="hidden sm:inline">Sent!</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span className="hidden sm:inline">Send</span>
                    </>
                  )}
                </motion.button>
              </div>
              
              {emailError && (
                <p className="mt-2 text-xs text-red-500">{emailError}</p>
              )}
              
              {emailSent && (
                <p className="mt-2 text-xs text-green-600">
                  ✓ Invoice sent to {clientEmail}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
