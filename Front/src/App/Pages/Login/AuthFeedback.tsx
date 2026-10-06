import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

export interface AuthFeedbackProps {
  state: "idle" | "scanning" | "error" | "success";
  messageError: string;
  messageSuccess: string;
}

export default function AuthFeedback(props: AuthFeedbackProps) {
  return (
    <AnimatePresence>
      {props.state === "error" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mt-6 flex items-center gap-2 text-sm text-red-400"
        >
          <AlertTriangle className="h-4 w-4" /> {props.messageError}
        </motion.div>
      )}

      {props.state === "success" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-sm text-emerald-400"
        >
          {props.messageSuccess}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
