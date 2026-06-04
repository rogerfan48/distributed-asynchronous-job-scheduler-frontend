import type { ReactNode } from "react";
import { render } from "@testing-library/react";
import { SWRConfig } from "swr";
import { ConsoleProvider } from "@/components/app/console";

/**
 * Render a component inside the app's client providers (SWR cache + global
 * Console), with an isolated SWR cache per call so mutate()/revalidation in one
 * test never leaks into another.
 */
export function renderWithProviders(ui: ReactNode) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <ConsoleProvider>{ui}</ConsoleProvider>
    </SWRConfig>,
  );
}
