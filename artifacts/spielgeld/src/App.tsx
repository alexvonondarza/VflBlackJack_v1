import { Switch, Route, Link } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Session from "@/pages/session";
import Admin from "@/pages/admin";
import Guide from "@/pages/guide";
import GroupSelect from "@/pages/group-select";
import SuperAdmin from "@/pages/superadmin";
import { GroupProvider, useGroup } from "@/contexts/GroupContext";
import { useGetActiveSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

const queryClient = new QueryClient();

function Navigation() {
  const { data: activeSession } = useGetActiveSession();
  const { groupName, clearGroup } = useGroup();

  return (
    <nav className="border-b border-border px-4 py-3 font-mono">
      <div className="max-w-6xl mx-auto flex gap-4 items-center">
        <Link href="/">Übersicht</Link>
        <Link href="/session">Spielabend</Link>
        <Link href="/admin">Administration</Link>
        {activeSession && (
          <span className="text-orange-500 text-sm font-bold">Aktiv</span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {groupName && (
            <span className="text-xs text-muted-foreground uppercase tracking-wider border border-border px-2 py-1 rounded">
              {groupName}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearGroup();
              queryClient.clear();
            }}
            className="text-xs uppercase tracking-wider"
          >
            ✕ Exit
          </Button>
        </div>
      </div>
    </nav>
  );
}

function AppRouter() {
  const { groupId } = useGroup();

  if (!groupId) {
    return <GroupSelect />;
  }

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
        <GroupProvider>
          <Switch>
            <Route path="/superadmin" component={SuperAdmin} />
            <Route component={AppRouter} />
          </Switch>
          <Toaster />
        </GroupProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
