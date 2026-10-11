import { useState } from 'react';

import type { ToastData } from '@/components/toast';

// Shows `error` as an error toast whenever it changes, while still letting the
// toast dismiss itself (setToast(null)). Tracks the last error seen and updates
// during render — React's pattern for state derived from a changing prop —
// instead of an effect that would render every error twice.
export function useErrorToast(error: string | null | undefined) {
  const [toast, setToast] = useState<ToastData | null>(error ? { type: 'error', message: error } : null);
  const [shownError, setShownError] = useState(error);

  if (error !== shownError) {
    setShownError(error);
    setToast(error ? { type: 'error', message: error } : null);
  }

  return [toast, setToast] as const;
}
