import { useEffect, useMemo, useState } from "react";

import { auth } from "../../firebase";
import { sendEmailVerification } from "firebase/auth";
import { useAuth } from "../../context/FirebaseAuthContext";

const STORAGE_KEY = "verify-email-modal-dismissed";

/**
 * Displays a modal prompting the user to verify their email if they are logged in
 * but their email is not yet verified. Allows resending verification email and
 * refreshing verification status.
 */
const VerifyEmailModal = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dismissedForThisUser = useMemo(() => {
    if (!user?.uid) return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed: Record<string, number> = JSON.parse(raw);
      return Boolean(parsed[user.uid]);
    } catch {
      return false;
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user && user.email && !user.emailVerified && !dismissedForThisUser) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user, dismissedForThisUser]);

  const dismiss = () => {
    setIsOpen(false);
    if (!user?.uid) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      parsed[user.uid] = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {
      // ignore storage errors
    }
  };

  const handleSendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    setMessage(null);
    try {
      await sendEmailVerification(user);
      setMessage(
        "Verification email sent. Please check your inbox (and spam folder)."
      );
    } catch (error) {
      setMessage("Failed to send verification email. Please try again.");
      // eslint-disable-next-line no-console
      console.error("Error sending verification email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleRefreshStatus = async () => {
    try {
      await auth.currentUser?.reload();
      // Close if verified after reload
      if (auth.currentUser?.emailVerified) {
        setIsOpen(false);
      } else {
        setMessage("Still not verified. Once you verify, click Refresh again.");
      }
    } catch {
      setMessage("Couldn't refresh status. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={dismiss} />
      <div className="relative z-10 w-[90%] max-w-md rounded-lg bg-white p-6 text-gray-900 shadow-xl">
        <h2 className="mb-2 text-xl font-semibold">Verify your email</h2>
        <p className="mb-4 text-sm text-gray-700">
          To keep your account secure, please verify your email address. We can
          send you a verification link.
        </p>

        {message && (
          <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleSendVerification}
            disabled={isSending}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {isSending ? "Sending..." : "Send verification email"}
          </button>
          <button
            type="button"
            onClick={handleRefreshStatus}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-50"
          >
            Refresh status
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailModal;
