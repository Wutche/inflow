import emailjs from "@emailjs/browser";

// EmailJS Configuration
const EMAILJS_SERVICE_ID = "service_xb34dlf";
const EMAILJS_TEMPLATE_ID = "template_kvv11dd";
const EMAILJS_PUBLIC_KEY = "MQyDG0_rTqyh7cNIX";

// Track if EmailJS is initialized
let isInitialized = false;

function initEmailJS() {
  if (typeof window !== "undefined" && !isInitialized) {
    emailjs.init(EMAILJS_PUBLIC_KEY);
    isInitialized = true;
  }
}

export interface InvoiceEmailParams {
  to_email: string;
  reply_to?: string;
  amount: string;
  token: string;
  recipient: string;
  network: string;
  pay_link: string;
  memo?: string;
}

/**
 * Send an invoice via email using EmailJS
 * @param params - Email parameters including recipient email, amount, token, etc.
 * @returns Promise resolving to the EmailJS response
 */
export async function sendInvoiceEmail(
  params: InvoiceEmailParams
): Promise<{ success: boolean; message: string }> {
  try {
    // Initialize EmailJS on first call (client-side only)
    initEmailJS();

    // Check if we're on client
    if (typeof window === "undefined") {
      throw new Error("Email can only be sent from browser");
    }

    // Validate required fields
    if (!params.to_email || !params.to_email.includes("@")) {
      throw new Error("Invalid email address");
    }

    if (!params.amount || !params.pay_link) {
      throw new Error("Amount and payment link are required");
    }

    // Prepare template parameters
    const templateParams = {
      to_email: params.to_email,
      reply_to: params.reply_to || params.to_email,
      amount: params.amount,
      token: params.token || "USDC",
      recipient: params.recipient,
      network: params.network === "stacks" ? "Stacks" : "Ethereum",
      pay_link: params.pay_link,
      memo: params.memo || "",
    };

    console.log("Sending email with params:", templateParams);

    // Send email via EmailJS
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams,
      EMAILJS_PUBLIC_KEY
    );

    console.log("EmailJS response:", response);

    if (response.status === 200) {
      return {
        success: true,
        message: "Invoice sent successfully!",
      };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error: unknown) {
    console.error("Failed to send invoice email:", error);

    // Handle specific EmailJS errors
    if (error instanceof Error) {
      if (error.message.includes("Invalid email")) {
        return {
          success: false,
          message: "Please enter a valid email address",
        };
      }

      if (error.message.includes("quota")) {
        return {
          success: false,
          message: "Email quota exceeded. Please try again later.",
        };
      }

      // Return the actual error message for debugging
      return {
        success: false,
        message: error.message || "Failed to send email. Please try again.",
      };
    }

    // Check if it's an EmailJS error object
    if (typeof error === "object" && error !== null && "text" in error) {
      return {
        success: false,
        message: (error as { text: string }).text || "EmailJS error occurred",
      };
    }

    return {
      success: false,
      message: "Failed to send email. Please try again.",
    };
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
