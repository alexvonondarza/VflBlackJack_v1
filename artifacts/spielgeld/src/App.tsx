import { Switch, Route, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Session from "@/pages/session";
import Admin from "@/pages/admin";
import { useGetActiveSession } from "@workspace/api-client-react";

const queryClient = new QueryClient();

function Navigation() {
  const [location] = useLocation();
  const { data: activeSession } = useGetActiveSession();

  return (
    <nav className="border-b border-border px-4 py-3 font-mono">
      <div className="max-w-6xl mx-auto flex gap-4">
        <Link href="/">Übersicht</Link>
        <Link href="/session">Spielabend</Link>
        <Link href="/admin">Administration</Link>
        {activeSession && <span className="text-orange-500">Aktiv</span>}
      </div>
    </nav>
  );
}

function Router() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/session" component={Session} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
