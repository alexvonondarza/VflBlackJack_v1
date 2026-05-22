import { Switch, Route, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Session from "@/pages/session";
import Admin from "@/pages/admin";
import Guide from "@/pages/guide";
import { useGetActiveSession } from "@workspace/api-client-react";

const queryClient = new QueryClient();

function Navigation() {
  const { data: activeSession } = useGetActiveSession();

  return (
    <nav className="border-b border-border px-4 py-3 font-mono">
      <div className="max-w-6xl mx-auto flex gap-4 items-center">
        <Link href="/">Übersicht</Link>
        <Link href="/session">Spielabend</Link>
        <Link href="/admin">Administration</Link>
        {activeSession && (
          <span className="text-orange-500 text-sm font-bold">Aktiv</span>
        )}
      </div>
    </nav>
  );
}

function AppRouter() {
  return (
    <>
      <Navigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/session" component={Session} />
        <Route path="/admin" component={Admin} />
        <Route path="/anleitung" component={Guide} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;