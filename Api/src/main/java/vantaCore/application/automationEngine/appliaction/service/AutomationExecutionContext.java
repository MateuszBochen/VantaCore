package vantaCore.application.automationEngine.appliaction.service;

import java.util.function.Supplier;

/** Tracks how many rule-triggered-another-rule hops deep the current call chain is, entirely via a
 ThreadLocal - safe ONLY because the whole recursive chain (evaluate rule -> execute action ->
 dispatch a command -> that command fires an event -> the automation engine reacts again) runs
 synchronously on ONE thread once AutomationRuleEngine hands the top-level trigger off to
 automationEngineExecutor; nothing in that chain hops to a different thread (see
 AutomationRuleEngine's own doc for why the ticket/comment-mutation events involved aren't routed
 through EventBus's AsyncEvent mechanism). If that ever changes, this ThreadLocal approach breaks
 silently (depth resets to "not active" on whatever pooled thread continues the chain) - don't reuse
 this pattern across an AsyncEvent hop without re-deriving whether it's still safe. */
public final class AutomationExecutionContext {

    private static final ThreadLocal<Integer> DEPTH = new ThreadLocal<>();

    private AutomationExecutionContext() {
    }

    /** true once inside a top-level automation task on this thread - distinguishes "this is a fresh
     trigger from outside automation" (not active, needs handing off to the executor) from "this is
     a recursive re-trigger from within automation's own action execution" (already active, process
     inline on this same thread instead of hopping to the executor again). */
    public static boolean isActive() {
        return DEPTH.get() != null;
    }

    public static int currentDepth() {
        Integer depth = DEPTH.get();
        return depth == null ? 0 : depth;
    }

    /** Marks the start of a top-level automation task on this (pooled executor) thread. Must be
     paired with clear() in a finally block - pooled threads are reused, so a leaked ThreadLocal
     value would make an unrelated LATER top-level task on the same thread think it's already deep
     inside a chain. */
    public static void enter() {
        DEPTH.set(0);
    }

    public static void clear() {
        DEPTH.remove();
    }

    /** Runs action with the depth counter incremented for its duration, then restores it - used
     around "evaluate this rule's actions", since it's the actions (not the trigger/condition
     evaluation itself) that can cause a further rule to fire. */
    public static <T> T runAtIncrementedDepth(Supplier<T> action) {
        int previous = currentDepth();
        DEPTH.set(previous + 1);
        try {
            return action.get();
        } finally {
            DEPTH.set(previous);
        }
    }
}
