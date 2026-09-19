// components/admin/ErrorState.tsx
// "Failed to load" message with a retry button, shared by the dashboard views.

export default function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div className="text-center py-16">
            <p className="text-ink-2 text-sm mb-5">{message}</p>
            <button
                onClick={onRetry}
                className="px-6 py-2.5 text-[0.72rem] font-semibold tracking-[0.1em] uppercase border border-ink text-ink rounded-sm hover:bg-ink hover:text-bg transition-all"
            >
                Try Again
            </button>
        </div>
    );
}
