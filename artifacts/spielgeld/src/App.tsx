import { Switch, Route, Router as WouterRouter, Link, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Session from "@/pages/session";
import { useGetActiveSession } from "@workspace/api-client-react";
import Admin from "@/pages/admin";

const queryClient = new QueryClient();

function Navigation() {
  const [location] = useLocation();
  const { data: activeSession } = useGetActiveSession();

  return (
    <nav className="bg-card border-b border-border px-4 md:px-8 py-4 flex items-center gap-6 font-mono">
      <Link href="/" className={`text-lg font-bold tracking-wider uppercase transition-colors hover:text-primary ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
        Übersicht
      </Link>
      <Link href="/session" className={`relative text-lg font-bold tracking-wider uppercase transition-colors hover:text-primary ${location === "/session" ? "text-primary" : "text-muted-foreground"}`}>
        Spielabend
        {activeSession && (
          <span className="absolute -top-1 -right-3 w-2.5 h-2.5 bg-orange-500 rounded-full" />
        )}
      </Link>
    </nav>
  );
}

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navigation />
      <div className="flex-1">
<Switch>
  <Route path="/" component={Dashboard} />
  <Route path="/session" component={Session} />
  <Route path="/admin" component={Admin} />
</Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
